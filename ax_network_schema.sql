-- =====================================================================
-- AX NETWORK · Sistema de control de servicio técnico
-- Base de datos para Supabase (PostgreSQL)
-- Cómo usarlo: Supabase > SQL Editor > pegar todo > Run
-- =====================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- 1. TIPOS (listas de valores fijos)
-- ---------------------------------------------------------------------
create type rol_usuario    as enum ('dueno', 'tecnico', 'recepcion');
create type tipo_servicio  as enum ('remoto', 'domicilio', 'taller');
create type prioridad      as enum ('baja', 'media', 'alta', 'urgente');
create type estado_orden   as enum ('recibido', 'diagnostico', 'espera_aprobacion',
                                    'espera_repuesto', 'reparacion', 'listo',
                                    'entregado', 'cancelado');
create type estado_ticket  as enum ('abierto', 'en_proceso', 'resuelto', 'cerrado');
create type estado_cita    as enum ('programada', 'confirmada', 'en_curso',
                                    'completada', 'cancelada', 'reprogramada');
create type metodo_pago    as enum ('efectivo', 'yappy', 'transferencia_ach', 'tarjeta', 'otro');
create type tipo_item      as enum ('servicio', 'repuesto', 'otro');
create type tipo_foto      as enum ('ingreso', 'diagnostico', 'antes', 'despues', 'otro');
create type tipo_descuento as enum ('ninguno', 'porcentaje', 'monto');

-- ---------------------------------------------------------------------
-- 2. SECUENCIAS DE NUMERACIÓN
-- ---------------------------------------------------------------------
create sequence seq_ordenes  start 1;
create sequence seq_informes start 1;

-- ---------------------------------------------------------------------
-- 3. USUARIOS DEL SISTEMA (vinculados al login de Supabase)
-- ---------------------------------------------------------------------
create table perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  rol         rol_usuario not null default 'tecnico',
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. CLIENTES Y EQUIPOS
-- ---------------------------------------------------------------------
create table clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  empresa     text,
  telefono    text,
  whatsapp    text,
  email       text,
  direccion   text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on clientes (nombre);
create index on clientes (telefono);

create table equipos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references clientes(id) on delete restrict,
  tipo             text not null,            -- laptop, PC escritorio, impresora, router, servidor, etc.
  marca            text,
  modelo           text,
  serie            text,
  procesador       text,
  ram              text,
  almacenamiento   text,
  sistema_operativo text,
  accesorios       text,                     -- cargador, bolso, mouse, etc.
  especificaciones jsonb not null default '{}'::jsonb,  -- campos extra libres
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on equipos (cliente_id);
create index on equipos (serie);

-- ---------------------------------------------------------------------
-- 5. UBICACIONES Y CATÁLOGO DE SERVICIOS
-- ---------------------------------------------------------------------
create table ubicaciones (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique,
  activa  boolean not null default true
);

create table catalogo_servicios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  descripcion   text,
  precio_base   numeric(10,2) not null default 0,
  garantia_dias integer not null default 0,
  activo        boolean not null default true
);

-- ---------------------------------------------------------------------
-- 6. ÓRDENES DE SERVICIO (corazón del sistema)
-- ---------------------------------------------------------------------
create table ordenes (
  id                    uuid primary key default gen_random_uuid(),
  numero                text not null unique
                          default ('OT-' || to_char(now(), 'YYYY') || '-' ||
                                   lpad(nextval('seq_ordenes')::text, 4, '0')),
  cliente_id            uuid not null references clientes(id) on delete restrict,
  equipo_id             uuid references equipos(id) on delete restrict,  -- null en soporte remoto sin equipo
  tipo_servicio         tipo_servicio not null default 'taller',
  prioridad             prioridad not null default 'media',
  estado                estado_orden not null default 'recibido',
  ubicacion_id          uuid references ubicaciones(id),
  tecnico_id            uuid references perfiles(id),

  falla_reportada       text,
  estado_fisico_ingreso text,
  contrasena_equipo     text,     -- opcional; considerar no guardarla
  diagnostico           text,
  trabajo_realizado     text,
  recomendaciones       text,

  -- Aprobación del presupuesto
  presupuesto_aprobado  boolean not null default false,
  aprobado_en           timestamptz,
  aprobado_por          text,     -- nombre de quien autorizó
  aprobado_via          text,     -- firma, WhatsApp, correo, verbal

  -- Dinero
  descuento_tipo        tipo_descuento not null default 'ninguno',
  descuento_valor       numeric(10,2) not null default 0,
  descuento_motivo      text,
  itbms_pct             numeric(5,2) not null default 0,   -- 7 si se cobra ITBMS

  -- Fechas
  fecha_ingreso         timestamptz not null default now(),
  fecha_estimada        date,
  fecha_entrega         timestamptz,

  created_by            uuid references perfiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on ordenes (estado);
create index on ordenes (cliente_id);
create index on ordenes (tecnico_id);
create index on ordenes (fecha_ingreso);

-- Historial de cambios de estado / ubicación
create table orden_historial (
  id            uuid primary key default gen_random_uuid(),
  orden_id      uuid not null references ordenes(id) on delete cascade,
  estado        estado_orden not null,
  ubicacion_id  uuid references ubicaciones(id),
  tecnico_id    uuid references perfiles(id),
  nota          text,
  cambiado_por  uuid references perfiles(id) default auth.uid(),
  created_at    timestamptz not null default now()
);
create index on orden_historial (orden_id, created_at);

-- Detalle de cobro: servicios, repuestos y otros
create table orden_items (
  id              uuid primary key default gen_random_uuid(),
  orden_id        uuid not null references ordenes(id) on delete cascade,
  tipo            tipo_item not null default 'servicio',
  servicio_id     uuid references catalogo_servicios(id),
  descripcion     text not null,
  cantidad        numeric(10,2) not null default 1 check (cantidad > 0),
  precio_unitario numeric(10,2) not null default 0,
  costo_unitario  numeric(10,2) not null default 0   -- lo que te costó (repuestos)
);
create index on orden_items (orden_id);

-- Fotos / evidencia (el archivo vive en Supabase Storage, aquí solo la ruta)
create table fotos (
  id           uuid primary key default gen_random_uuid(),
  orden_id     uuid not null references ordenes(id) on delete cascade,
  tipo         tipo_foto not null default 'otro',
  ruta         text not null,
  descripcion  text,
  subida_por   uuid references perfiles(id) default auth.uid(),
  created_at   timestamptz not null default now()
);
create index on fotos (orden_id);

-- ---------------------------------------------------------------------
-- 7. DINERO: PAGOS Y GASTOS
-- ---------------------------------------------------------------------
create table pagos (
  id            uuid primary key default gen_random_uuid(),
  orden_id      uuid not null references ordenes(id) on delete restrict,
  monto         numeric(10,2) not null check (monto > 0),
  metodo        metodo_pago not null default 'efectivo',
  referencia    text,                         -- n.º de transferencia o Yappy
  fecha         timestamptz not null default now(),
  recibido_por  uuid references perfiles(id) default auth.uid(),
  anulado       boolean not null default false,
  nota          text
);
create index on pagos (orden_id);
create index on pagos (fecha);

create table gastos (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null default current_date,
  concepto     text not null,
  categoria    text,                          -- repuestos, herramientas, transporte, etc.
  monto        numeric(10,2) not null check (monto > 0),
  orden_id     uuid references ordenes(id) on delete set null,
  registrado_por uuid references perfiles(id) default auth.uid()
);
create index on gastos (fecha);

-- ---------------------------------------------------------------------
-- 8. SOPORTE TÉCNICO (TICKETS) Y AGENDA
-- ---------------------------------------------------------------------
create table tickets (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid not null references clientes(id) on delete restrict,
  orden_id             uuid references ordenes(id) on delete set null,
  titulo               text not null,
  descripcion          text,
  tipo_servicio        tipo_servicio not null default 'remoto',
  prioridad            prioridad not null default 'media',
  estado               estado_ticket not null default 'abierto',
  tecnico_id           uuid references perfiles(id),
  primera_respuesta_en timestamptz,
  resuelto_en          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on tickets (estado);
create index on tickets (tecnico_id);

create table citas (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid not null references clientes(id) on delete restrict,
  orden_id              uuid references ordenes(id) on delete set null,
  ticket_id             uuid references tickets(id) on delete set null,
  tipo_servicio         tipo_servicio not null,
  titulo                text not null,
  tecnico_id            uuid not null references perfiles(id),
  inicio                timestamptz not null,
  fin                   timestamptz not null,
  direccion             text,                 -- para visitas presenciales
  enlace_remoto         text,                 -- AnyDesk, Meet, etc.
  estado                estado_cita not null default 'programada',
  recordatorio_enviado  boolean not null default false,
  notas                 text,
  created_at            timestamptz not null default now(),
  check (fin > inicio),
  -- Un técnico no puede tener dos citas activas al mismo tiempo
  exclude using gist (
    tecnico_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado not in ('cancelada', 'reprogramada'))
);
create index on citas (inicio);
create index on citas (tecnico_id, inicio);

-- ---------------------------------------------------------------------
-- 9. INFORME TÉCNICO PARA EL CLIENTE Y CLÁUSULAS
-- ---------------------------------------------------------------------
create table plantilla_clausulas (
  id        uuid primary key default gen_random_uuid(),
  orden     integer not null,
  titulo    text not null,
  texto     text not null,       -- admite {garantia_dias} como variable
  activa    boolean not null default true
);

create table informes (
  id                  uuid primary key default gen_random_uuid(),
  numero              text not null unique
                        default ('INF-' || to_char(now(), 'YYYY') || '-' ||
                                 lpad(nextval('seq_informes')::text, 4, '0')),
  orden_id            uuid not null references ordenes(id) on delete restrict,
  garantia_dias       integer not null default 0,
  garantia_cubre      text,
  garantia_excluye    text,
  clausulas           jsonb not null default '[]'::jsonb,  -- copia fija de las cláusulas al emitir
  snapshot            jsonb not null default '{}'::jsonb,  -- copia de montos y textos al emitir
  firma_cliente_ruta  text,
  firma_tecnico_ruta  text,
  firmado_en          timestamptz,
  pdf_ruta            text,
  emitido_por         uuid references perfiles(id) default auth.uid(),
  created_at          timestamptz not null default now()
);
create index on informes (orden_id);

-- ---------------------------------------------------------------------
-- 10. FUNCIONES Y TRIGGERS
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_clientes_upd before update on clientes for each row execute function set_updated_at();
create trigger trg_equipos_upd  before update on equipos  for each row execute function set_updated_at();
create trigger trg_ordenes_upd  before update on ordenes  for each row execute function set_updated_at();
create trigger trg_tickets_upd  before update on tickets  for each row execute function set_updated_at();

-- Guarda el historial al crear una orden o cambiar su estado / ubicación / técnico
create or replace function log_orden_historial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT'
     or new.estado is distinct from old.estado
     or new.ubicacion_id is distinct from old.ubicacion_id
     or new.tecnico_id is distinct from old.tecnico_id then
    insert into orden_historial (orden_id, estado, ubicacion_id, tecnico_id)
    values (new.id, new.estado, new.ubicacion_id, new.tecnico_id);
  end if;
  if new.estado = 'entregado' and new.fecha_entrega is null then
    new.fecha_entrega = now();
  end if;
  return new;
end $$;

create trigger trg_orden_historial_ins after insert on ordenes
  for each row execute function log_orden_historial();
create trigger trg_orden_historial_upd after update on ordenes
  for each row execute function log_orden_historial();

-- Regla: no pasar a reparación sin presupuesto aprobado
create or replace function validar_aprobacion() returns trigger
language plpgsql as $$
begin
  if new.estado in ('reparacion', 'listo', 'entregado')
     and new.presupuesto_aprobado = false then
    raise exception 'La orden % no tiene presupuesto aprobado por el cliente', new.numero;
  end if;
  return new;
end $$;

create trigger trg_validar_aprobacion before update on ordenes
  for each row execute function validar_aprobacion();

-- Crea el perfil automáticamente cuando se registra un usuario
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- 11. VISTAS (alimentan el panel del dueño)
-- ---------------------------------------------------------------------
create or replace view v_orden_totales with (security_invoker = true) as
select o.id as orden_id, o.numero,
       s.subtotal, d.descuento, t.impuesto,
       (s.subtotal - d.descuento + t.impuesto)             as total,
       p.pagado,
       (s.subtotal - d.descuento + t.impuesto - p.pagado)  as saldo
from ordenes o
cross join lateral (select coalesce(sum(cantidad * precio_unitario), 0) as subtotal
                    from orden_items where orden_id = o.id) s
cross join lateral (select round(case o.descuento_tipo
                              when 'porcentaje' then s.subtotal * o.descuento_valor / 100
                              when 'monto'      then least(o.descuento_valor, s.subtotal)
                              else 0 end, 2) as descuento) d
cross join lateral (select round((s.subtotal - d.descuento) * o.itbms_pct / 100, 2) as impuesto) t
cross join lateral (select coalesce(sum(monto), 0) as pagado
                    from pagos where orden_id = o.id and not anulado) p;

create or replace view v_equipos_por_estado with (security_invoker = true) as
select estado, count(*) as cantidad
from ordenes
where estado not in ('entregado', 'cancelado')
group by estado;

create or replace view v_equipos_por_tecnico with (security_invoker = true) as
select pf.nombre as tecnico, count(*) as cantidad
from ordenes o
join perfiles pf on pf.id = o.tecnico_id
where o.estado not in ('entregado', 'cancelado')
group by pf.nombre;

create or replace view v_equipos_atrasados with (security_invoker = true) as
select o.id, o.numero, c.nombre as cliente, o.estado, o.fecha_ingreso,
       (current_date - o.fecha_ingreso::date) as dias_en_taller,
       o.fecha_estimada
from ordenes o
join clientes c on c.id = o.cliente_id
where o.estado not in ('entregado', 'cancelado')
  and (o.fecha_estimada < current_date
       or o.fecha_ingreso < now() - interval '7 days');

create or replace view v_cuentas_por_cobrar with (security_invoker = true) as
select t.orden_id, t.numero, c.nombre as cliente, c.whatsapp,
       t.total, t.pagado, t.saldo
from v_orden_totales t
join ordenes o on o.id = t.orden_id
join clientes c on c.id = o.cliente_id
where t.saldo > 0 and o.estado <> 'cancelado';

create or replace view v_ingresos_mensuales with (security_invoker = true) as
select date_trunc('month', p.fecha)::date as mes,
       o.tipo_servicio,
       sum(p.monto) as ingresos
from pagos p
join ordenes o on o.id = p.orden_id
where not p.anulado
group by 1, 2;

create or replace view v_agenda_semana with (security_invoker = true) as
select ci.id, ci.inicio, ci.fin, ci.tipo_servicio, ci.titulo, ci.estado,
       c.nombre as cliente, pf.nombre as tecnico, ci.direccion, ci.enlace_remoto
from citas ci
join clientes c  on c.id  = ci.cliente_id
join perfiles pf on pf.id = ci.tecnico_id
where ci.inicio >= date_trunc('week', now())
  and ci.inicio <  date_trunc('week', now()) + interval '7 days'
  and ci.estado not in ('cancelada', 'reprogramada');

-- ---------------------------------------------------------------------
-- 12. SEGURIDAD (RLS): solo usuarios del sistema entran
--     IMPORTANTE: en Supabase > Authentication > desactiva "Allow new users to sign up"
--     y crea tú los usuarios. Luego asigna el rol 'dueno' a tu perfil:
--     update perfiles set rol = 'dueno' where id = '<tu-uuid>';
-- ---------------------------------------------------------------------
create or replace function rol_actual() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

do $$
declare t text;
begin
  -- Tablas que todo el personal puede leer y escribir
  foreach t in array array['clientes','equipos','ordenes','orden_historial','orden_items',
                           'fotos','tickets','citas','informes','ubicaciones']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy "personal_total" on %I for all to authenticated
                      using (rol_actual() is not null)
                      with check (rol_actual() is not null)$p$, t);
  end loop;
end $$;

-- Perfiles: todos leen; solo el dueño modifica
alter table perfiles enable row level security;
create policy "perfiles_leer"  on perfiles for select to authenticated using (rol_actual() is not null);
create policy "perfiles_dueno" on perfiles for all    to authenticated
  using (rol_actual() = 'dueno') with check (rol_actual() = 'dueno');

-- Catálogo y cláusulas: todos leen; solo el dueño modifica
alter table catalogo_servicios enable row level security;
create policy "catalogo_leer"  on catalogo_servicios for select to authenticated using (rol_actual() is not null);
create policy "catalogo_dueno" on catalogo_servicios for all to authenticated
  using (rol_actual() = 'dueno') with check (rol_actual() = 'dueno');

alter table plantilla_clausulas enable row level security;
create policy "clausulas_leer"  on plantilla_clausulas for select to authenticated using (rol_actual() is not null);
create policy "clausulas_dueno" on plantilla_clausulas for all to authenticated
  using (rol_actual() = 'dueno') with check (rol_actual() = 'dueno');

-- Pagos: todos leen (para saldos); solo dueño y recepción registran
alter table pagos enable row level security;
create policy "pagos_leer"   on pagos for select to authenticated using (rol_actual() is not null);
create policy "pagos_editar" on pagos for all to authenticated
  using (rol_actual() in ('dueno','recepcion'))
  with check (rol_actual() in ('dueno','recepcion'));

-- Gastos: solo el dueño
alter table gastos enable row level security;
create policy "gastos_dueno" on gastos for all to authenticated
  using (rol_actual() = 'dueno') with check (rol_actual() = 'dueno');

-- ---------------------------------------------------------------------
-- 13. DATOS INICIALES
-- ---------------------------------------------------------------------
insert into ubicaciones (nombre) values
  ('Recepción'), ('Mesa de trabajo'), ('Estante de espera'),
  ('Con el cliente (domicilio / oficina)'), ('Remoto');

-- Precios tomados de la web; ajústalos a tu gusto
insert into catalogo_servicios (nombre, descripcion, precio_base, garantia_dias) values
  ('Diagnóstico remoto exprés',   'Evaluación inicial técnica en línea',            15.00, 0),
  ('Optimización Estándar',       'Puesta a punto completa',                        20.00, 15),
  ('Optimización Pro / Avanzada', 'Máxima velocidad y estabilidad',                 35.00, 15),
  ('Optimización Gaming',         'Máximos FPS y mínima latencia',                  45.00, 15),
  ('Impresión blanco y negro',    'Por página',                                      0.50, 0),
  ('Impresión a color',           'Por página',                                      0.75, 0),
  ('Copia blanco y negro',        'Por copia',                                       0.10, 0),
  ('Copia a color',               'Por copia',                                       0.25, 0);

-- BORRADOR de cláusulas: debe revisarlas un abogado antes de usarlas con clientes
insert into plantilla_clausulas (orden, titulo, texto) values
  (1, 'Garantía',
      'La garantía cubre únicamente el trabajo realizado y los repuestos instalados, por un periodo de {garantia_dias} días contados desde la entrega.'),
  (2, 'Exclusiones de la garantía',
      'No cubre daños por golpes, líquidos, mal uso, sobrevoltaje, manipulación por terceros ni fallas distintas a la atendida.'),
  (3, 'Respaldo de información',
      'El cliente es responsable de respaldar su información. El taller no se responsabiliza por pérdida de datos.'),
  (4, 'Aprobación de costos',
      'Cualquier trabajo adicional al presupuesto aprobado requerirá autorización previa del cliente.'),
  (5, 'Diagnóstico',
      'Si el cliente no aprueba la reparación, podrá aplicarse el cobro del diagnóstico realizado.'),
  (6, 'Equipos no retirados',
      'Pasados los días indicados en el aviso de entrega sin retirar el equipo, el taller podrá cobrar almacenaje.'),
  (7, 'Confidencialidad',
      'AX Network mantiene absoluta confidencialidad sobre los archivos y datos del cliente.'),
  (8, 'Aceptación',
      'El cliente declara recibir el equipo conforme y acepta las condiciones de este informe con su firma.');

-- =====================================================================
-- FIN
-- =====================================================================
