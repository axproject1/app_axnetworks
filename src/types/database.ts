// =====================================================================
// AX NETWORK · Sistema de Control de Servicio Técnico
// Tipos de TypeScript sincronizados con ax_network_schema.sql
// =====================================================================

export type RolUsuario = 'dueno' | 'tecnico' | 'recepcion';
export type TipoServicio = 'remoto' | 'domicilio' | 'taller';
export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type EstadoOrden = 
  | 'recibido'
  | 'diagnostico'
  | 'espera_aprobacion'
  | 'espera_repuesto'
  | 'reparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type EstadoTicket = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';
export type EstadoCita = 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'reprogramada';
export type MetodoPago = 'efectivo' | 'yappy' | 'transferencia_ach' | 'tarjeta' | 'otro';
export type TipoItem = 'servicio' | 'repuesto' | 'otro';
export type TipoFoto = 'ingreso' | 'diagnostico' | 'antes' | 'despues' | 'otro';
export type TipoDescuento = 'ninguno' | 'porcentaje' | 'monto';

// ---------------------------------------------------------------------
// TABLAS
// ---------------------------------------------------------------------

export interface Perfil {
  id: string;
  nombre: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  email?: string; // Metadata auxiliar de auth
}

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipo {
  id: string;
  cliente_id: string;
  tipo: string;            // laptop, PC escritorio, impresora, router, servidor, etc.
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  procesador: string | null;
  ram: string | null;
  almacenamiento: string | null;
  sistema_operativo: string | null;
  accesorios: string | null;
  especificaciones: Record<string, any>;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Campos embebidos para joins
  cliente?: Cliente;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface CatalogoServicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  garantia_dias: number;
  activo: boolean;
}

export interface Orden {
  id: string;
  numero: string;
  cliente_id: string;
  equipo_id: string | null;
  tipo_servicio: TipoServicio;
  prioridad: Prioridad;
  estado: EstadoOrden;
  ubicacion_id: string | null;
  tecnico_id: string | null;
  falla_reportada: string | null;
  estado_fisico_ingreso: string | null;
  contrasena_equipo?: string | null; // Omitida en frontend por privacidad
  diagnostico: string | null;
  trabajo_realizado: string | null;
  recomendaciones: string | null;
  presupuesto_aprobado: boolean;
  aprobado_en: string | null;
  aprobado_por: string | null;
  aprobado_via: string | null;
  descuento_tipo: TipoDescuento;
  descuento_valor: number;
  descuento_motivo: string | null;
  itbms_pct: number;
  fecha_ingreso: string;
  fecha_estimada: string | null;
  fecha_entrega: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones
  cliente?: Cliente;
  equipo?: Equipo;
  tecnico?: Perfil;
  ubicacion?: Ubicacion;
  totales?: VOrdenTotales;
}

export interface OrdenHistorial {
  id: string;
  orden_id: string;
  estado: EstadoOrden;
  ubicacion_id: string | null;
  tecnico_id: string | null;
  nota: string | null;
  cambiado_por: string | null;
  created_at: string;
}

export interface OrdenItem {
  id: string;
  orden_id: string;
  tipo: TipoItem;
  servicio_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
}

export interface Foto {
  id: string;
  orden_id: string;
  tipo: TipoFoto;
  ruta: string;
  descripcion: string | null;
  subida_por: string | null;
  created_at: string;
}

export interface Pago {
  id: string;
  orden_id: string;
  monto: number;
  metodo: MetodoPago;
  referencia: string | null;
  fecha: string;
  recibido_por: string | null;
  anulado: boolean;
  nota: string | null;
  orden?: {
    numero: string;
    cliente?: {
      nombre: string;
    };
  };
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string | null;
  monto: number;
  orden_id: string | null;
  registrado_por: string | null;
  orden?: {
    numero: string;
    cliente?: {
      nombre: string;
    };
  };
  registrador?: {
    nombre: string;
  };
}

export interface Ticket {
  id: string;
  cliente_id: string;
  orden_id: string | null;
  titulo: string;
  descripcion: string | null;
  tipo_servicio: TipoServicio;
  prioridad: Prioridad;
  estado: EstadoTicket;
  tecnico_id: string | null;
  primera_respuesta_en: string | null;
  resuelto_en: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  tecnico?: Perfil;
}

export interface Cita {
  id: string;
  cliente_id: string;
  orden_id: string | null;
  ticket_id: string | null;
  tipo_servicio: TipoServicio;
  titulo: string;
  tecnico_id: string;
  inicio: string;
  fin: string;
  direccion: string | null;
  enlace_remoto: string | null;
  estado: EstadoCita;
  recordatorio_enviado: boolean;
  notas: string | null;
  created_at: string;
  cliente?: Cliente;
  tecnico?: Perfil;
}

export interface PlantillaClausula {
  id: string;
  orden: number;
  titulo: string;
  texto: string;
  activa: boolean;
}

export interface Informe {
  id: string;
  numero: string;
  orden_id: string;
  garantia_dias: number;
  garantia_cubre: string | null;
  garantia_excluye: string | null;
  clausulas: any[];
  snapshot: {
    orden: any;
    cliente: any;
    equipo: any;
    tecnico: any;
    items: any[];
    totales: any;
  };
  firma_tecnico?: string | null;
  firma_cliente?: string | null;
  firma_cliente_ruta?: string | null;
  firma_tecnico_ruta?: string | null;
  firmado_en?: string | null;
  pdf_ruta?: string | null;
  emitido_por?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// VISTAS SQL (v_*)
// ---------------------------------------------------------------------

export interface VOrdenTotales {
  orden_id: string;
  numero: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  pagado: number;
  saldo: number;
}

export interface VEquiposPorEstado {
  estado: EstadoOrden;
  cantidad: number;
}

export interface VEquiposPorTecnico {
  tecnico: string;
  cantidad: number;
}

export interface VEquiposAtrasados {
  id: string;
  numero: string;
  cliente: string;
  estado: EstadoOrden;
  fecha_ingreso: string;
  dias_en_taller: number;
  fecha_estimada: string | null;
}

export interface VCuentaPorCobrar {
  orden_id: string;
  numero: string;
  cliente: string;
  whatsapp: string | null;
  total: number;
  pagado: number;
  saldo: number;
}

export interface VIngresosMensuales {
  mes: string;
  tipo_servicio: TipoServicio;
  ingresos: number;
}

export interface VAgendaSemana {
  id: string;
  inicio: string;
  fin: string;
  tipo_servicio: TipoServicio;
  titulo: string;
  estado: EstadoCita;
  cliente: string;
  tecnico: string;
  direccion: string | null;
  enlace_remoto: string | null;
}
