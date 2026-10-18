import { Cliente, Equipo, Perfil, Orden, Ubicacion, CatalogoServicio, PlantillaClausula, Cita, Ticket, Informe, Gasto, Pago } from '@/types/database';
import { 
  MOCK_CLIENTES, 
  MOCK_EQUIPOS, 
  MOCK_PERFILES, 
  MOCK_ORDENES, 
  MOCK_UBICACIONES, 
  MOCK_CATALOGO_SERVICIOS, 
  MOCK_CLAUSULAS,
  MOCK_CITAS,
  MOCK_TICKETS,
  MOCK_PAGOS,
  MOCK_GASTOS
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CLIENTES: 'ax_clientes_v1',
  EQUIPOS: 'ax_equipos_v1',
  PERFILES: 'ax_perfiles_v1',
  ORDENES: 'ax_ordenes_v1',
  UBICACIONES: 'ax_ubicaciones_v1',
  SERVICIOS: 'ax_servicios_v1',
  CLAUSULAS: 'ax_clausulas_v1',
  CURRENT_USER: 'ax_current_user_v1',
  CITAS: 'ax_citas_v1',
  TICKETS: 'ax_tickets_v1',
  INFORMES: 'ax_informes_v1',
  PAGOS: 'ax_pagos_v1',
  GASTOS: 'ax_gastos_v1',
};

// Inicialización de Mock en localStorage si no existe
function initLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(MOCK_CLIENTES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EQUIPOS)) {
    localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(MOCK_EQUIPOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERFILES)) {
    localStorage.setItem(STORAGE_KEYS.PERFILES, JSON.stringify(MOCK_PERFILES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDENES)) {
    localStorage.setItem(STORAGE_KEYS.ORDENES, JSON.stringify(MOCK_ORDENES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.UBICACIONES)) {
    localStorage.setItem(STORAGE_KEYS.UBICACIONES, JSON.stringify(MOCK_UBICACIONES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICIOS)) {
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(MOCK_CATALOGO_SERVICIOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLAUSULAS)) {
    localStorage.setItem(STORAGE_KEYS.CLAUSULAS, JSON.stringify(MOCK_CLAUSULAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CITAS)) {
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(MOCK_CITAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(MOCK_TICKETS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INFORMES)) {
    localStorage.setItem(STORAGE_KEYS.INFORMES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAGOS)) {
    localStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(MOCK_PAGOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GASTOS)) {
    localStorage.setItem(STORAGE_KEYS.GASTOS, JSON.stringify(MOCK_GASTOS));
  }
}

initLocalStorage();

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error('Error reading localStorage:', err);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error writing localStorage:', err);
  }
}

// ============================================================================
// SERVICIO DE CLIENTES
// ============================================================================
export const ClientesService = {
  async getAll(): Promise<Cliente[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
  },

  async getById(id: string): Promise<Cliente | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    return list.find((c) => c.id === id) || null;
  },

  async create(payload: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const newClient: Cliente = {
      ...payload,
      id: `cli-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newClient);
    setLocal(STORAGE_KEYS.CLIENTES, list);
    return newClient;
  },

  async update(id: string, payload: Partial<Cliente>): Promise<Cliente> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cliente no encontrado');
    const updated = {
      ...list[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    setLocal(STORAGE_KEYS.CLIENTES, list);
    return updated;
  },

  async delete(id: string): Promise<void> {
    // Verificar si tiene equipos o órdenes asociadas
    const equipos = await EquiposService.getByCliente(id);
    if (equipos.length > 0) {
      throw new Error(`No se puede eliminar el cliente porque tiene ${equipos.length} equipo(s) registrado(s).`);
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const filtered = list.filter((c) => c.id !== id);
    setLocal(STORAGE_KEYS.CLIENTES, filtered);
  },
};

// ============================================================================
// SERVICIO DE EQUIPOS
// ============================================================================
export const EquiposService = {
  async getAll(): Promise<Equipo[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('equipos')
        .select('*, cliente:clientes(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, MOCK_EQUIPOS);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    return equipos.map((eq) => ({
      ...eq,
      cliente: clientes.find((c) => c.id === eq.cliente_id),
    }));
  },

  async getByCliente(clienteId: string): Promise<Equipo[]> {
    const all = await this.getAll();
    return all.filter((eq) => eq.cliente_id === clienteId);
  },

  async getById(id: string): Promise<Equipo | null> {
    const all = await this.getAll();
    return all.find((eq) => eq.id === id) || null;
  },

  async create(payload: Omit<Equipo, 'id' | 'created_at' | 'updated_at' | 'cliente'>): Promise<Equipo> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('equipos')
        .insert(payload)
        .select('*, cliente:clientes(*)')
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, MOCK_EQUIPOS);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const newEquipo: Equipo = {
      ...payload,
      id: `eq-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newEquipo);
    setLocal(STORAGE_KEYS.EQUIPOS, list);
    return {
      ...newEquipo,
      cliente: clientes.find((c) => c.id === newEquipo.cliente_id),
    };
  },

  async update(id: string, payload: Partial<Equipo>): Promise<Equipo> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('equipos')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, cliente:clientes(*)')
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, MOCK_EQUIPOS);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Equipo no encontrado');
    const updated = {
      ...list[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    setLocal(STORAGE_KEYS.EQUIPOS, list);
    return {
      ...updated,
      cliente: clientes.find((c) => c.id === updated.cliente_id),
    };
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('equipos').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, MOCK_EQUIPOS);
    const filtered = list.filter((e) => e.id !== id);
    setLocal(STORAGE_KEYS.EQUIPOS, filtered);
  },
};

// ============================================================================
// SERVICIO DE PERFILES / USUARIOS
// ============================================================================
export const PerfilesService = {
  async getAll(includeInactive = false): Promise<Perfil[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('perfiles').select('*').order('nombre', { ascending: true });
      if (!includeInactive) query = query.eq('activo', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    return includeInactive ? all : all.filter((p) => p.activo);
  },

  async getById(id: string): Promise<Perfil | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    return list.find((p) => p.id === id) || null;
  },

  async getTecnicos(): Promise<Perfil[]> {
    const list = await this.getAll();
    return list.filter((p) => (p.rol === 'tecnico' || p.rol === 'dueno') && p.activo);
  },

  async create(payload: { nombre: string; email?: string; telefono?: string | null; rol: string }): Promise<Perfil> {
    const newPerfil: Perfil = {
      id: `usr-${Date.now()}`,
      nombre: payload.nombre.trim(),
      telefono: payload.telefono || null,
      rol: payload.rol as any,
      activo: true,
      created_at: new Date().toISOString(),
      email: payload.email || undefined,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('perfiles').insert(newPerfil).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    list.push(newPerfil);
    setLocal(STORAGE_KEYS.PERFILES, list);
    return newPerfil;
  },

  async update(id: string, updates: Partial<Perfil>): Promise<Perfil> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('perfiles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Perfil no encontrado');
    list[idx] = { ...list[idx], ...updates };
    setLocal(STORAGE_KEYS.PERFILES, list);
    return list[idx];
  },

  async toggleActive(id: string): Promise<Perfil> {
    const perfil = await this.getById(id);
    if (!perfil) throw new Error('Perfil no encontrado');
    return this.update(id, { activo: !perfil.activo });
  },
};

export const UsuariosService = PerfilesService;

// ============================================================================
// SERVICIOS AUXILIARES (Ubicaciones, Catálogo)
// ============================================================================
export const UbicacionesService = {
  async getAll(includeInactive = false): Promise<Ubicacion[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('ubicaciones').select('*').order('nombre');
      if (!includeInactive) query = query.eq('activa', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Ubicacion[]>(STORAGE_KEYS.UBICACIONES, MOCK_UBICACIONES);
    return includeInactive ? all : all.filter((u) => u.activa);
  },

  async create(payload: { nombre: string }): Promise<Ubicacion> {
    const newUbi: Ubicacion = {
      id: `ubi-${Date.now()}`,
      nombre: payload.nombre.trim(),
      activa: true,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('ubicaciones').insert(newUbi).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Ubicacion[]>(STORAGE_KEYS.UBICACIONES, MOCK_UBICACIONES);
    list.push(newUbi);
    setLocal(STORAGE_KEYS.UBICACIONES, list);
    return newUbi;
  },

  async update(id: string, updates: Partial<Ubicacion>): Promise<Ubicacion> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('ubicaciones').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Ubicacion[]>(STORAGE_KEYS.UBICACIONES, MOCK_UBICACIONES);
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Ubicación no encontrada');
    list[idx] = { ...list[idx], ...updates };
    setLocal(STORAGE_KEYS.UBICACIONES, list);
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Ubicacion[]>(STORAGE_KEYS.UBICACIONES, MOCK_UBICACIONES);
    setLocal(STORAGE_KEYS.UBICACIONES, list.filter((u) => u.id !== id));
  },
};

export const CatalogoService = {
  async getAll(includeInactive = false): Promise<CatalogoServicio[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('catalogo_servicios').select('*').order('precio_base', { ascending: false });
      if (!includeInactive) query = query.eq('activo', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<CatalogoServicio[]>(STORAGE_KEYS.SERVICIOS, MOCK_CATALOGO_SERVICIOS);
    return includeInactive ? all : all.filter((s) => s.activo);
  },

  async create(payload: Omit<CatalogoServicio, 'id'>): Promise<CatalogoServicio> {
    const newSrv: CatalogoServicio = {
      id: `srv-${Date.now()}`,
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion || null,
      precio_base: Number(payload.precio_base),
      garantia_dias: Number(payload.garantia_dias) || 0,
      activo: payload.activo !== undefined ? payload.activo : true,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('catalogo_servicios').insert(newSrv).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<CatalogoServicio[]>(STORAGE_KEYS.SERVICIOS, MOCK_CATALOGO_SERVICIOS);
    list.push(newSrv);
    setLocal(STORAGE_KEYS.SERVICIOS, list);
    return newSrv;
  },

  async update(id: string, updates: Partial<CatalogoServicio>): Promise<CatalogoServicio> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('catalogo_servicios').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<CatalogoServicio[]>(STORAGE_KEYS.SERVICIOS, MOCK_CATALOGO_SERVICIOS);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Servicio no encontrado');
    list[idx] = { ...list[idx], ...updates };
    setLocal(STORAGE_KEYS.SERVICIOS, list);
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('catalogo_servicios').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<CatalogoServicio[]>(STORAGE_KEYS.SERVICIOS, MOCK_CATALOGO_SERVICIOS);
    setLocal(STORAGE_KEYS.SERVICIOS, list.filter((s) => s.id !== id));
  },
};

export const ClausulasService = {
  async getAll(includeInactive = false): Promise<PlantillaClausula[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('plantilla_clausulas').select('*').order('orden', { ascending: true });
      if (!includeInactive) query = query.eq('activa', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<PlantillaClausula[]>(STORAGE_KEYS.CLAUSULAS, MOCK_CLAUSULAS);
    return includeInactive ? all : all.filter((c) => c.activa);
  },

  async create(payload: Omit<PlantillaClausula, 'id'>): Promise<PlantillaClausula> {
    const newClausula: PlantillaClausula = {
      id: `cls-${Date.now()}`,
      orden: payload.orden,
      titulo: payload.titulo.trim(),
      texto: payload.texto.trim(),
      activa: payload.activa !== undefined ? payload.activa : true,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('plantilla_clausulas').insert(newClausula).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<PlantillaClausula[]>(STORAGE_KEYS.CLAUSULAS, MOCK_CLAUSULAS);
    list.push(newClausula);
    setLocal(STORAGE_KEYS.CLAUSULAS, list);
    return newClausula;
  },

  async update(id: string, updates: Partial<PlantillaClausula>): Promise<PlantillaClausula> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('plantilla_clausulas').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<PlantillaClausula[]>(STORAGE_KEYS.CLAUSULAS, MOCK_CLAUSULAS);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cláusula no encontrada');
    list[idx] = { ...list[idx], ...updates };
    setLocal(STORAGE_KEYS.CLAUSULAS, list);
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('plantilla_clausulas').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<PlantillaClausula[]>(STORAGE_KEYS.CLAUSULAS, MOCK_CLAUSULAS);
    setLocal(STORAGE_KEYS.CLAUSULAS, list.filter((c) => c.id !== id));
  },
};

// ============================================================================
// SERVICIO DE HISTORIAL DE ÓRDENES
// ============================================================================
const HISTORIAL_KEY = 'ax_orden_historial_v1';
const FOTOS_KEY = 'ax_fotos_v1';
const ITEMS_KEY = 'ax_orden_items_v1';
const PAGOS_KEY = 'ax_pagos_v1';

export const HistorialService = {
  async getByOrden(ordenId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orden_historial')
        .select('*, cambiado_por_perfil:perfiles!cambiado_por(nombre)')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<any[]>(HISTORIAL_KEY, []);
    return all.filter((h) => h.orden_id === ordenId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addEntry(ordenId: string, estado: string, ubicacionId?: string | null, tecnicoId?: string | null, nota?: string) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('orden_historial').insert({
        orden_id: ordenId,
        estado,
        ubicacion_id: ubicacionId || null,
        tecnico_id: tecnicoId || null,
        nota: nota || null,
      });
      return;
    }
    const all = getLocal<any[]>(HISTORIAL_KEY, []);
    all.unshift({
      id: `hist-${Date.now()}`,
      orden_id: ordenId,
      estado,
      ubicacion_id: ubicacionId || null,
      tecnico_id: tecnicoId || null,
      nota: nota || null,
      created_at: new Date().toISOString(),
    });
    setLocal(HISTORIAL_KEY, all);
  }
};

// ============================================================================
// SERVICIO DE FOTOS / EVIDENCIA
// ============================================================================
export const FotosService = {
  async getByOrden(ordenId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('fotos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<any[]>(FOTOS_KEY, []);
    return all.filter((f) => f.orden_id === ordenId);
  },

  async addFoto(ordenId: string, payload: { ruta: string; tipo: string; descripcion?: string | null }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('fotos')
        .insert({
          orden_id: ordenId,
          ruta: payload.ruta,
          tipo: payload.tipo,
          descripcion: payload.descripcion || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = getLocal<any[]>(FOTOS_KEY, []);
    const newFoto = {
      id: `foto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orden_id: ordenId,
      ruta: payload.ruta,
      tipo: payload.tipo,
      descripcion: payload.descripcion || null,
      created_at: new Date().toISOString(),
    };
    all.unshift(newFoto);
    setLocal(FOTOS_KEY, all);
    return newFoto;
  },

  async deleteFoto(fotoId: string) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('fotos').delete().eq('id', fotoId);
      return;
    }
    const all = getLocal<any[]>(FOTOS_KEY, []);
    setLocal(FOTOS_KEY, all.filter((f) => f.id !== fotoId));
  }
};

// ============================================================================
// SERVICIO DE ÍTEMS DE COBRO (SERVICIOS Y REPUESTOS)
// ============================================================================
export const OrdenItemsService = {
  async getByOrden(ordenId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orden_items')
        .select('*')
        .eq('orden_id', ordenId);
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<any[]>(ITEMS_KEY, [
      { id: 'itm-001', orden_id: 'ord-001', tipo: 'servicio', servicio_id: 'srv-5', descripcion: 'Mantenimiento Preventivo Físico + Pasta Térmica Kryonaut', cantidad: 1, precio_unitario: 35.00, costo_unitario: 5.00 },
      { id: 'itm-002', orden_id: 'ord-001', tipo: 'servicio', servicio_id: 'srv-4', descripcion: 'Optimización Gaming y Estabilidad Térmica', cantidad: 1, precio_unitario: 45.00, costo_unitario: 0.00 },
      { id: 'itm-003', orden_id: 'ord-002', tipo: 'servicio', servicio_id: 'srv-3', descripcion: 'Optimización Pro / Avanzada AX Network', cantidad: 1, precio_unitario: 35.00, costo_unitario: 0.00 }
    ]);
    return all.filter((i) => i.orden_id === ordenId);
  },

  async addItem(ordenId: string, item: { tipo: string; servicio_id?: string | null; descripcion: string; cantidad: number; precio_unitario: number; costo_unitario?: number }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orden_items')
        .insert({ ...item, orden_id: ordenId })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = getLocal<any[]>(ITEMS_KEY, []);
    const newItem = {
      id: `itm-${Date.now()}`,
      orden_id: ordenId,
      costo_unitario: 0,
      ...item,
    };
    all.push(newItem);
    setLocal(ITEMS_KEY, all);
    return newItem;
  },

  async deleteItem(itemId: string) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('orden_items').delete().eq('id', itemId);
      return;
    }
    const all = getLocal<any[]>(ITEMS_KEY, []);
    setLocal(ITEMS_KEY, all.filter((i) => i.id !== itemId));
  }
};

// ============================================================================
// SERVICIO DE PAGOS Y ABONOS (CON ANULACIÓN SIN BORRADO)
// ============================================================================
export const PagosService = {
  async getByOrden(ordenId: string): Promise<Pago[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pagos')
        .select('*, recibido_por_perfil:perfiles!recibido_por(nombre)')
        .eq('orden_id', ordenId)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Pago[]>(STORAGE_KEYS.PAGOS, MOCK_PAGOS);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    return all
      .filter((p) => p.orden_id === ordenId)
      .map((p) => ({
        ...p,
        recibido_por_perfil: perfiles.find((pf) => pf.id === p.recibido_por) || { nombre: 'Personal Recepción' },
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async getAll(): Promise<Pago[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pagos')
        .select('*, orden:ordenes(numero, cliente:clientes(nombre)), recibido_por_perfil:perfiles!recibido_por(nombre)')
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Pago[]>(STORAGE_KEYS.PAGOS, MOCK_PAGOS);
    const ordenes = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);

    return all.map((p) => {
      const ord = ordenes.find((o) => o.id === p.orden_id);
      const cli = ord ? clientes.find((c) => c.id === ord.cliente_id) : null;
      return {
        ...p,
        orden: ord ? { numero: ord.numero, cliente: cli ? { nombre: cli.nombre } : undefined } : undefined,
        recibido_por_perfil: perfiles.find((pf) => pf.id === p.recibido_por),
      };
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async create(payload: {
    orden_id: string;
    monto: number;
    metodo: string;
    referencia?: string | null;
    recibido_por?: string | null;
    nota?: string | null;
  }) {
    if (payload.monto <= 0) {
      throw new Error('El monto del abono debe ser mayor a $0.00');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pagos')
        .insert({
          orden_id: payload.orden_id,
          monto: payload.monto,
          metodo: payload.metodo,
          referencia: payload.referencia || null,
          recibido_por: payload.recibido_por || null,
          anulado: false,
          nota: payload.nota || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const all = getLocal<Pago[]>(STORAGE_KEYS.PAGOS, MOCK_PAGOS);
    const newPago: Pago = {
      id: `pag-${Date.now()}`,
      orden_id: payload.orden_id,
      monto: Number(payload.monto),
      metodo: payload.metodo as any,
      referencia: payload.referencia || null,
      fecha: new Date().toISOString(),
      recibido_por: payload.recibido_por || 'usr-rec-001',
      anulado: false,
      nota: payload.nota || null,
    };
    all.unshift(newPago);
    setLocal(STORAGE_KEYS.PAGOS, all);

    // Auditoría en el historial de la orden
    await HistorialService.addEntry(
      payload.orden_id,
      'pago_recibido' as any,
      undefined,
      undefined,
      `Abono registrado por $${Number(payload.monto).toFixed(2)} vía ${payload.metodo.toUpperCase()}${payload.referencia ? ` (Ref: ${payload.referencia})` : ''}`
    );

    return newPago;
  },

  async anular(pagoId: string, motivo: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pagos')
        .update({
          anulado: true,
          nota: `ANULADO: ${motivo}`,
        })
        .eq('id', pagoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const all = getLocal<Pago[]>(STORAGE_KEYS.PAGOS, MOCK_PAGOS);
    const idx = all.findIndex((p) => p.id === pagoId);
    if (idx === -1) throw new Error('Pago no encontrado');

    const targetPago = all[idx];
    targetPago.anulado = true;
    targetPago.nota = `ANULADO: ${motivo} (Fecha: ${new Date().toLocaleDateString('es-PA')})`;
    all[idx] = targetPago;
    setLocal(STORAGE_KEYS.PAGOS, all);

    // Registrar en auditoría
    await HistorialService.addEntry(
      targetPago.orden_id,
      'pago_anulado' as any,
      undefined,
      undefined,
      `PAGO ANULADO por $${Number(targetPago.monto).toFixed(2)}. Motivo: ${motivo}`
    );

    return targetPago;
  }
};

// ============================================================================
// SERVICIO DE GASTOS Y EGRESOS DEL TALLER (EXCLUSIVO DUEÑO)
// ============================================================================
export const GastosService = {
  async getAll(): Promise<Gasto[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('gastos')
        .select('*, orden:ordenes(numero, cliente:clientes(nombre)), registrador:perfiles!registrado_por(nombre)')
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Gasto[]>(STORAGE_KEYS.GASTOS, MOCK_GASTOS);
    const ordenes = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);

    return all.map((g) => {
      const ord = g.orden_id ? ordenes.find((o) => o.id === g.orden_id) : null;
      const cli = ord ? clientes.find((c) => c.id === ord.cliente_id) : null;
      const reg = g.registrado_por ? perfiles.find((p) => p.id === g.registrado_por) : null;
      return {
        ...g,
        orden: ord ? { numero: ord.numero, cliente: cli ? { nombre: cli.nombre } : undefined } : undefined,
        registrador: reg ? { nombre: reg.nombre } : undefined,
      };
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async getById(id: string): Promise<Gasto | null> {
    const list = await this.getAll();
    return list.find((g) => g.id === id) || null;
  },

  async getByOrden(ordenId: string): Promise<Gasto[]> {
    const list = await this.getAll();
    return list.filter((g) => g.orden_id === ordenId);
  },

  async create(payload: {
    fecha: string;
    concepto: string;
    categoria: string | null;
    monto: number;
    orden_id?: string | null;
    registrado_por?: string | null;
  }): Promise<Gasto> {
    if (Number(payload.monto) <= 0) {
      throw new Error('El monto del gasto debe ser mayor a $0.00');
    }

    const newId = `gst-${Date.now()}`;
    const newGasto: Gasto = {
      id: newId,
      fecha: payload.fecha || new Date().toISOString().slice(0, 10),
      concepto: payload.concepto.trim(),
      categoria: payload.categoria || 'otros',
      monto: Number(payload.monto),
      orden_id: payload.orden_id || null,
      registrado_por: payload.registrado_por || null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('gastos').insert(newGasto).select().single();
      if (error) throw error;
      return data;
    }

    const list = getLocal<Gasto[]>(STORAGE_KEYS.GASTOS, MOCK_GASTOS);
    list.unshift(newGasto);
    setLocal(STORAGE_KEYS.GASTOS, list);
    return newGasto;
  },

  async update(id: string, updates: Partial<Gasto>): Promise<Gasto> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('gastos').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const list = getLocal<Gasto[]>(STORAGE_KEYS.GASTOS, MOCK_GASTOS);
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Gasto no encontrado');

    const updated: Gasto = {
      ...list[idx],
      ...updates,
      monto: updates.monto !== undefined ? Number(updates.monto) : list[idx].monto,
    };
    list[idx] = updated;
    setLocal(STORAGE_KEYS.GASTOS, list);
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Gasto[]>(STORAGE_KEYS.GASTOS, MOCK_GASTOS);
    setLocal(STORAGE_KEYS.GASTOS, list.filter((g) => g.id !== id));
  }
};

// ============================================================================
// SERVICIO DE FINANZAS Y REPORTES AGREGADOS
// ============================================================================
export const FinanzasService = {
  async getResumenCompleto() {
    const [pagos, gastos, ordenes] = await Promise.all([
      PagosService.getAll(),
      GastosService.getAll(),
      OrdenesService.getAll(),
    ]);

    // Pagos válidos (no anulados)
    const pagosValidos = pagos.filter((p) => !p.anulado);
    const ingresosTotales = pagosValidos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const gastosTotales = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
    const utilidadNeta = ingresosTotales - gastosTotales;
    const margenUtilidad = ingresosTotales > 0 ? (utilidadNeta / ingresosTotales) * 100 : 0;

    // Calcular saldo pendiente y cuentas por cobrar
    const cuentasPorCobrarLista: Array<{
      orden_id: string;
      numero: string;
      cliente: string;
      whatsapp: string | null;
      telefono: string | null;
      total: number;
      pagado: number;
      saldo: number;
      fecha_ingreso: string;
      dias_transcurridos: number;
      estado: string;
    }> = [];

    let totalCuentasPorCobrar = 0;

    for (const orden of ordenes) {
      if (orden.estado === 'cancelado') continue;
      const totales = await OrdenesService.calculateTotales(orden);
      if (totales.saldo > 0.05) {
        totalCuentasPorCobrar += totales.saldo;
        const dias = Math.floor((Date.now() - new Date(orden.fecha_ingreso).getTime()) / 86400000);
        cuentasPorCobrarLista.push({
          orden_id: orden.id,
          numero: orden.numero,
          cliente: orden.cliente?.nombre || 'Cliente sin nombre',
          whatsapp: orden.cliente?.whatsapp || null,
          telefono: orden.cliente?.telefono || null,
          total: totales.total,
          pagado: totales.pagado,
          saldo: totales.saldo,
          fecha_ingreso: orden.fecha_ingreso,
          dias_transcurridos: dias,
          estado: orden.estado,
        });
      }
    }

    cuentasPorCobrarLista.sort((a, b) => b.saldo - a.saldo);

    // Gastos agrupados por categoría
    const gastosPorCategoriaMap: Record<string, { total: number; count: number }> = {};
    for (const g of gastos) {
      const cat = g.categoria || 'otros';
      if (!gastosPorCategoriaMap[cat]) {
        gastosPorCategoriaMap[cat] = { total: 0, count: 0 };
      }
      gastosPorCategoriaMap[cat].total += Number(g.monto || 0);
      gastosPorCategoriaMap[cat].count += 1;
    }

    const gastosPorCategoria = Object.entries(gastosPorCategoriaMap)
      .map(([categoria, info]) => ({
        categoria,
        total: info.total,
        count: info.count,
        porcentaje: gastosTotales > 0 ? (info.total / gastosTotales) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Ingresos agrupados por tipo de servicio de la orden
    const ingresosPorTipoServicioMap: Record<string, number> = {
      taller: 0,
      domicilio: 0,
      remoto: 0,
    };
    for (const p of pagosValidos) {
      const ord = ordenes.find((o) => o.id === p.orden_id);
      const tipo = ord?.tipo_servicio || 'taller';
      ingresosPorTipoServicioMap[tipo] = (ingresosPorTipoServicioMap[tipo] || 0) + Number(p.monto || 0);
    }

    // Flujo mensual agrupado por mes (YYYY-MM)
    const mesesMap: Record<string, { mes: string; ingresos: number; gastos: number }> = {};

    pagosValidos.forEach((p) => {
      const m = (p.fecha || '').slice(0, 7);
      if (m) {
        if (!mesesMap[m]) mesesMap[m] = { mes: m, ingresos: 0, gastos: 0 };
        mesesMap[m].ingresos += Number(p.monto || 0);
      }
    });

    gastos.forEach((g) => {
      const m = (g.fecha || '').slice(0, 7);
      if (m) {
        if (!mesesMap[m]) mesesMap[m] = { mes: m, ingresos: 0, gastos: 0 };
        mesesMap[m].gastos += Number(g.monto || 0);
      }
    });

    const flujoMensual = Object.values(mesesMap)
      .map((item) => ({
        ...item,
        utilidad: item.ingresos - item.gastos,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    return {
      ingresosTotales,
      gastosTotales,
      utilidadNeta,
      margenUtilidad,
      totalCuentasPorCobrar,
      pagosCount: pagosValidos.length,
      gastosCount: gastos.length,
      gastosPorCategoria,
      ingresosPorTipoServicio: ingresosPorTipoServicioMap,
      flujoMensual,
      cuentasPorCobrarLista,
    };
  }
};

// ============================================================================
// SERVICIO DE DASHBOARD (VISTAS SQL Y ADAPTACIÓN POR ROLES)
// ============================================================================
export const DashboardService = {
  async getMetrics(role: string, currentUserId?: string) {
    const [ordenes, tickets, citas, perfiles] = await Promise.all([
      OrdenesService.getAll(),
      TicketsService.getAll(),
      CitasService.getAll(),
      PerfilesService.getAll(),
    ]);

    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Citas de hoy
    const citasHoy = citas.filter((c) => {
      const cDate = (c.inicio || '').slice(0, 10);
      return cDate === todayDateStr && c.estado !== 'cancelada';
    });

    // Equipos atrasados (más de 7 días o fecha estimada vencida)
    const ordenesAtrasadas = ordenes.filter((o) => {
      if (o.estado === 'entregado' || o.estado === 'cancelado') return false;
      const ingresoDays = Math.floor((Date.now() - new Date(o.fecha_ingreso).getTime()) / 86400000);
      const estimadaPasada = o.fecha_estimada ? o.fecha_estimada < todayDateStr : false;
      return ingresoDays >= 7 || estimadaPasada;
    });

    // V_EQUIPOS_POR_ESTADO
    const estadosCount: Record<string, number> = {};
    ordenes.forEach((o) => {
      if (o.estado !== 'entregado' && o.estado !== 'cancelado') {
        estadosCount[o.estado] = (estadosCount[o.estado] || 0) + 1;
      }
    });

    // V_EQUIPOS_POR_TECNICO
    const tecnicosCount: Record<string, number> = {};
    ordenes.forEach((o) => {
      if (o.estado !== 'entregado' && o.estado !== 'cancelado') {
        const tec = perfiles.find((p) => p.id === o.tecnico_id);
        const name = tec?.nombre || 'Sin asignar';
        tecnicosCount[name] = (tecnicosCount[name] || 0) + 1;
      }
    });

    // Si es TÉCNICO: Retornar exclusivamente métricas técnicas SIN montos ni dinero
    if (role === 'tecnico') {
      const misOrdenes = ordenes.filter((o) => o.tecnico_id === currentUserId);
      const misOrdenesActivas = misOrdenes.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado');
      const misOrdenesReparacion = misOrdenes.filter((o) => o.estado === 'reparacion');
      const misOrdenesListas = misOrdenes.filter((o) => o.estado === 'listo');
      const misCitasHoy = citasHoy.filter((c) => c.tecnico_id === currentUserId);
      const misTickets = tickets.filter((t) => t.tecnico_id === currentUserId && t.estado !== 'cerrado');

      return {
        role: 'tecnico' as const,
        misOrdenesActivasCount: misOrdenesActivas.length,
        misOrdenesReparacionCount: misOrdenesReparacion.length,
        misOrdenesListasCount: misOrdenesListas.length,
        misCitasHoyCount: misCitasHoy.length,
        misTicketsCount: misTickets.length,
        misCitasHoy,
        misOrdenesActivas,
        estadosCount,
      };
    }

    // Si es RECEPCIÓN
    if (role === 'recepcion') {
      const equiposRecibidosHoy = ordenes.filter((o) => (o.fecha_ingreso || '').slice(0, 10) === todayDateStr);
      const equiposListosParaEntregar = ordenes.filter((o) => o.estado === 'listo');
      const citasTallerHoy = citasHoy.filter((c) => c.tipo_servicio === 'taller');
      const citasDomicilioHoy = citasHoy.filter((c) => c.tipo_servicio === 'domicilio');

      // Pagos cobrados hoy en recepción
      const pagos = await PagosService.getAll();
      const pagosHoy = pagos.filter((p) => !p.anulado && (p.fecha || '').slice(0, 10) === todayDateStr);
      const montoCobradoHoy = pagosHoy.reduce((acc, p) => acc + Number(p.monto || 0), 0);

      return {
        role: 'recepcion' as const,
        recibidosHoyCount: equiposRecibidosHoy.length,
        listosParaEntregarCount: equiposListosParaEntregar.length,
        citasHoyCount: citasHoy.length,
        citasTallerHoyCount: citasTallerHoy.length,
        citasDomicilioHoyCount: citasDomicilioHoy.length,
        montoCobradoHoy,
        equiposListosParaEntregar,
        citasHoy,
      };
    }

    // Si es DUEÑO: Métricas completas operacionales + financieras
    const resumenFinanciero = await FinanzasService.getResumenCompleto();
    const ordenesActivas = ordenes.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado');
    const ticketsAbiertos = tickets.filter((t) => t.estado === 'abierto' || t.estado === 'en_proceso');

    return {
      role: 'dueno' as const,
      ordenesActivasCount: ordenesActivas.length,
      ordenesAtrasadasCount: ordenesAtrasadas.length,
      ordenesAtrasadas,
      citasHoyCount: citasHoy.length,
      ticketsAbiertosCount: ticketsAbiertos.length,
      estadosCount,
      tecnicosCount,
      citasHoy,
      ultimasOrdenes: ordenes.slice(0, 6),
      finanzas: resumenFinanciero,
    };
  }
};

// ============================================================================
// SERVICIO DE ÓRDENES DE TRABAJO (CORAZÓN DEL SISTEMA)
// ============================================================================
export const OrdenesService = {
  // Cálculo de totales idéntico a la vista SQL v_orden_totales
  async calculateTotales(orden: Orden) {
    const items = await OrdenItemsService.getByOrden(orden.id);
    const subtotal = items.reduce((acc, curr) => acc + (Number(curr.cantidad) * Number(curr.precio_unitario)), 0);

    let descuento = 0;
    if (orden.descuento_tipo === 'porcentaje') {
      descuento = Math.round((subtotal * Number(orden.descuento_valor) / 100) * 100) / 100;
    } else if (orden.descuento_tipo === 'monto') {
      descuento = Math.min(Number(orden.descuento_valor), subtotal);
    }

    const itbmsPct = Number(orden.itbms_pct) || 0;
    const impuesto = Math.round(((subtotal - descuento) * itbmsPct / 100) * 100) / 100;
    const total = Math.max(0, subtotal - descuento + impuesto);

    // Pagos registrados
    const pagosAll = getLocal<any[]>(PAGOS_KEY, [
      { id: 'pag-001', orden_id: 'ord-002', monto: 33.71, metodo: 'yappy', fecha: new Date().toISOString(), anulado: false }
    ]);
    const pagado = pagosAll
      .filter((p) => p.orden_id === orden.id && !p.anulado)
      .reduce((acc, p) => acc + Number(p.monto), 0);

    const saldo = Math.max(0, total - pagado);

    return {
      orden_id: orden.id,
      numero: orden.numero,
      subtotal,
      descuento,
      impuesto,
      total,
      pagado,
      saldo,
    };
  },

  async getAll(): Promise<Orden[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(*),
          equipo:equipos(*),
          tecnico:perfiles!tecnico_id(*),
          ubicacion:ubicaciones(*)
        `)
        .order('fecha_ingreso', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const ordenes = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, MOCK_EQUIPOS);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);
    const ubicaciones = getLocal<Ubicacion[]>(STORAGE_KEYS.UBICACIONES, MOCK_UBICACIONES);

    const populated = await Promise.all(
      ordenes.map(async (ord) => {
        const cliente = clientes.find((c) => c.id === ord.cliente_id);
        const equipo = equipos.find((e) => e.id === ord.equipo_id);
        const tecnico = perfiles.find((p) => p.id === ord.tecnico_id);
        const ubicacion = ubicaciones.find((u) => u.id === ord.ubicacion_id);
        const totales = await this.calculateTotales(ord);

        return {
          ...ord,
          cliente,
          equipo,
          tecnico,
          ubicacion,
          totales,
        };
      })
    );

    return populated.sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime());
  },

  async getById(id: string): Promise<Orden | null> {
    const all = await this.getAll();
    return all.find((o) => o.id === id) || null;
  },

  async create(
    payload: Omit<Orden, 'id' | 'numero' | 'created_at' | 'updated_at' | 'cliente' | 'equipo' | 'tecnico' | 'ubicacion' | 'totales'>,
    fotosIngreso?: string[]
  ): Promise<Orden> {
    const list = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);

    // Generar correlativo OT-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countThisYear = list.filter((o) => o.numero.includes(`OT-${currentYear}`)).length + 1;
    const numero = `OT-${currentYear}-${String(countThisYear).padStart(4, '0')}`;
    const newId = `ord-${Date.now()}`;

    const newOrden: Orden = {
      ...payload,
      id: newId,
      numero,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('ordenes')
        .insert({ ...payload, id: newId, numero })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    list.unshift(newOrden);
    setLocal(STORAGE_KEYS.ORDENES, list);

    // Registro inicial en historial
    await HistorialService.addEntry(
      newId,
      payload.estado || 'recibido',
      payload.ubicacion_id,
      payload.tecnico_id,
      'Ingreso inicial de equipo a taller / registro de orden'
    );

    // Guardar fotos de ingreso si se adjuntaron
    if (fotosIngreso && fotosIngreso.length > 0) {
      for (const foto of fotosIngreso) {
        await FotosService.addFoto(newId, {
          ruta: foto,
          tipo: 'ingreso',
          descripcion: 'Foto de estado físico al ingreso',
        });
      }
    }

    const fullOrden = await this.getById(newId);
    return fullOrden!;
  },

  async update(id: string, payload: Partial<Orden>, notaHistorial?: string): Promise<Orden> {
    const list = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);
    const index = list.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Orden no encontrada');

    const current = list[index];

    // REGLA DE NEGOCIO CRÍTICA DE ax_network_schema.sql (validar_aprobacion):
    // "No pasar a reparación sin presupuesto aprobado por el cliente"
    const targetEstado = payload.estado || current.estado;
    const targetAprobado = payload.presupuesto_aprobado !== undefined ? payload.presupuesto_aprobado : current.presupuesto_aprobado;

    if (['reparacion', 'listo', 'entregado'].includes(targetEstado) && !targetAprobado) {
      throw new Error(
        `La orden ${current.numero} no tiene presupuesto aprobado por el cliente. Registra la aprobación antes de iniciar la reparación o marcar como listo.`
      );
    }

    // Si pasa a entregado y no tiene fecha_entrega, asignar now()
    let fecha_entrega = payload.fecha_entrega !== undefined ? payload.fecha_entrega : current.fecha_entrega;
    if (targetEstado === 'entregado' && !fecha_entrega) {
      fecha_entrega = new Date().toISOString();
    }

    const updated: Orden = {
      ...current,
      ...payload,
      fecha_entrega,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('ordenes')
        .update({ ...payload, fecha_entrega, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    list[index] = updated;
    setLocal(STORAGE_KEYS.ORDENES, list);

    // Registrar en historial si hubo cambio de estado, ubicación o técnico
    const cambioEstado = payload.estado && payload.estado !== current.estado;
    const cambioUbicacion = payload.ubicacion_id && payload.ubicacion_id !== current.ubicacion_id;
    const cambioTecnico = payload.tecnico_id && payload.tecnico_id !== current.tecnico_id;

    if (cambioEstado || cambioUbicacion || cambioTecnico || notaHistorial) {
      await HistorialService.addEntry(
        id,
        updated.estado,
        updated.ubicacion_id,
        updated.tecnico_id,
        notaHistorial || (cambioEstado ? `Cambio de estado a "${updated.estado}"` : 'Actualización de orden')
      );
    }

    const full = await this.getById(id);
    return full!;
  },

  async registrarAprobacion(
    ordenId: string,
    aprobacion: { aprobado_por: string; aprobado_via: string; nota?: string }
  ): Promise<Orden> {
    return this.update(
      ordenId,
      {
        presupuesto_aprobado: true,
        aprobado_en: new Date().toISOString(),
        aprobado_por: aprobacion.aprobado_por,
        aprobado_via: aprobacion.aprobado_via,
      },
      `Presupuesto aprobado por ${aprobacion.aprobado_por} vía ${aprobacion.aprobado_via}. ${aprobacion.nota || ''}`
    );
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('ordenes').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Orden[]>(STORAGE_KEYS.ORDENES, MOCK_ORDENES);
    setLocal(STORAGE_KEYS.ORDENES, list.filter((o) => o.id !== id));
  }
};

// ============================================================================
// SERVICIO DE CITAS / AGENDA
// ============================================================================
export const CitasService = {
  checkConflict(tecnicoId: string, inicioStr: string, finStr: string, excludeId?: string): { hasConflict: boolean; conflictingCita?: Cita } {
    const citas = getLocal<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
    const start = new Date(inicioStr).getTime();
    const end = new Date(finStr).getTime();

    const conflict = citas.find((c) => {
      if (excludeId && c.id === excludeId) return false;
      if (c.tecnico_id !== tecnicoId) return false;
      if (c.estado === 'cancelada' || c.estado === 'reprogramada') return false;

      const cStart = new Date(c.inicio).getTime();
      const cEnd = new Date(c.fin).getTime();
      // Overlap condition: start < cEnd && end > cStart
      return start < cEnd && end > cStart;
    });

    return {
      hasConflict: !!conflict,
      conflictingCita: conflict,
    };
  },

  async getAll(filters?: { tecnico_id?: string; tipo_servicio?: string; estado?: string }): Promise<Cita[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('citas').select('*, cliente:clientes(*), tecnico:perfiles!tecnico_id(*)').order('inicio', { ascending: true });
      if (filters?.tecnico_id) query = query.eq('tecnico_id', filters.tecnico_id);
      if (filters?.tipo_servicio) query = query.eq('tipo_servicio', filters.tipo_servicio);
      if (filters?.estado) query = query.eq('estado', filters.estado);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    const citas = getLocal<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);

    let filtered = citas;
    if (filters?.tecnico_id) filtered = filtered.filter((c) => c.tecnico_id === filters.tecnico_id);
    if (filters?.tipo_servicio) filtered = filtered.filter((c) => c.tipo_servicio === filters.tipo_servicio);
    if (filters?.estado) filtered = filtered.filter((c) => c.estado === filters.estado);

    return filtered.map((c) => ({
      ...c,
      cliente: clientes.find((cli) => cli.id === c.cliente_id),
      tecnico: perfiles.find((p) => p.id === c.tecnico_id),
    })).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  },

  async getById(id: string): Promise<Cita | null> {
    const list = await this.getAll();
    return list.find((c) => c.id === id) || null;
  },

  async create(payload: Omit<Cita, 'id' | 'created_at' | 'recordatorio_enviado'>): Promise<Cita> {
    if (new Date(payload.fin).getTime() <= new Date(payload.inicio).getTime()) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }

    const conflictCheck = this.checkConflict(payload.tecnico_id, payload.inicio, payload.fin);
    if (conflictCheck.hasConflict) {
      throw new Error(`Conflicto de horario: El técnico seleccionado ya tiene la cita "${conflictCheck.conflictingCita?.titulo}" asignada en ese lapso.`);
    }

    const newCita: Cita = {
      ...payload,
      id: `cita-${Date.now()}`,
      recordatorio_enviado: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('citas').insert(newCita).select().single();
      if (error) throw error;
      return data;
    }

    const list = getLocal<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
    list.push(newCita);
    setLocal(STORAGE_KEYS.CITAS, list);

    const full = await this.getById(newCita.id);
    return full || newCita;
  },

  async update(id: string, updates: Partial<Cita>): Promise<Cita> {
    const list = getLocal<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
    const existing = list.find((c) => c.id === id);
    if (!existing) throw new Error('Cita no encontrada');

    const merged = { ...existing, ...updates };

    if (new Date(merged.fin).getTime() <= new Date(merged.inicio).getTime()) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }

    if (updates.inicio || updates.fin || updates.tecnico_id) {
      const conflictCheck = this.checkConflict(merged.tecnico_id, merged.inicio, merged.fin, id);
      if (conflictCheck.hasConflict && merged.estado !== 'cancelada' && merged.estado !== 'reprogramada') {
        throw new Error(`Conflicto de horario: El técnico seleccionado ya tiene la cita "${conflictCheck.conflictingCita?.titulo}" en ese lapso.`);
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('citas').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const idx = list.findIndex((c) => c.id === id);
    list[idx] = merged;
    setLocal(STORAGE_KEYS.CITAS, list);

    const full = await this.getById(id);
    return full || merged;
  },

  async reprogramar(id: string, inicio: string, fin: string): Promise<Cita> {
    return this.update(id, {
      inicio,
      fin,
      estado: 'programada',
      recordatorio_enviado: false,
    });
  },

  async setRecordatorioEnviado(id: string, enviado = true): Promise<Cita> {
    return this.update(id, { recordatorio_enviado: enviado });
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('citas').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
    setLocal(STORAGE_KEYS.CITAS, list.filter((c) => c.id !== id));
  }
};

// ============================================================================
// SERVICIO DE TICKETS DE SOPORTE TÉCNICO
// ============================================================================
export const TicketsService = {
  async getAll(filters?: { estado?: string; prioridad?: string; tecnico_id?: string; cliente_id?: string }): Promise<Ticket[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('tickets').select('*, cliente:clientes(*), tecnico:perfiles!tecnico_id(*)').order('created_at', { ascending: false });
      if (filters?.estado) query = query.eq('estado', filters.estado);
      if (filters?.prioridad) query = query.eq('prioridad', filters.prioridad);
      if (filters?.tecnico_id) query = query.eq('tecnico_id', filters.tecnico_id);
      if (filters?.cliente_id) query = query.eq('cliente_id', filters.cliente_id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    const tickets = getLocal<Ticket[]>(STORAGE_KEYS.TICKETS, MOCK_TICKETS);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const perfiles = getLocal<Perfil[]>(STORAGE_KEYS.PERFILES, MOCK_PERFILES);

    let filtered = tickets;
    if (filters?.estado) filtered = filtered.filter((t) => t.estado === filters.estado);
    if (filters?.prioridad) filtered = filtered.filter((t) => t.prioridad === filters.prioridad);
    if (filters?.tecnico_id) filtered = filtered.filter((t) => t.tecnico_id === filters.tecnico_id);
    if (filters?.cliente_id) filtered = filtered.filter((t) => t.cliente_id === filters.cliente_id);

    return filtered.map((t) => ({
      ...t,
      cliente: clientes.find((c) => c.id === t.cliente_id),
      tecnico: perfiles.find((p) => p.id === t.tecnico_id),
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getById(id: string): Promise<Ticket | null> {
    const list = await this.getAll();
    return list.find((t) => t.id === id) || null;
  },

  async create(payload: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'primera_respuesta_en' | 'resuelto_en'>): Promise<Ticket> {
    const nowIso = new Date().toISOString();
    const newTicket: Ticket = {
      ...payload,
      id: `tkt-${Date.now()}`,
      primera_respuesta_en: null,
      resuelto_en: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tickets').insert(newTicket).select().single();
      if (error) throw error;
      return data;
    }

    const list = getLocal<Ticket[]>(STORAGE_KEYS.TICKETS, MOCK_TICKETS);
    list.unshift(newTicket);
    setLocal(STORAGE_KEYS.TICKETS, list);

    const full = await this.getById(newTicket.id);
    return full || newTicket;
  },

  async update(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const list = getLocal<Ticket[]>(STORAGE_KEYS.TICKETS, MOCK_TICKETS);
    const existing = list.find((t) => t.id === id);
    if (!existing) throw new Error('Ticket no encontrado');

    const merged: Ticket = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.estado === 'resuelto' && !existing.resuelto_en) {
      merged.resuelto_en = new Date().toISOString();
    } else if (updates.estado && updates.estado !== 'resuelto' && updates.estado !== 'cerrado') {
      merged.resuelto_en = null;
    }

    if (updates.tecnico_id && !existing.primera_respuesta_en) {
      merged.primera_respuesta_en = new Date().toISOString();
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const idx = list.findIndex((t) => t.id === id);
    list[idx] = merged;
    setLocal(STORAGE_KEYS.TICKETS, list);

    const full = await this.getById(id);
    return full || merged;
  },

  async registrarPrimeraRespuesta(id: string): Promise<Ticket> {
    const ticket = await this.getById(id);
    if (!ticket) throw new Error('Ticket no encontrado');
    if (ticket.primera_respuesta_en) return ticket;
    return this.update(id, { primera_respuesta_en: new Date().toISOString(), estado: ticket.estado === 'abierto' ? 'en_proceso' : ticket.estado });
  },

  async convertirAOrden(
    ticketId: string,
    ordenData: {
      equipo_id: string;
      ubicacion_id?: string;
      tecnico_id?: string;
      falla_reportada?: string;
      estado_fisico_ingreso?: string;
    }
  ): Promise<{ orden: Orden; ticket: Ticket }> {
    const ticket = await this.getById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Crear orden a partir de los datos del ticket
    const nuevaOrden = await OrdenesService.create({
      cliente_id: ticket.cliente_id,
      equipo_id: ordenData.equipo_id,
      tipo_servicio: ticket.tipo_servicio,
      prioridad: ticket.prioridad,
      estado: 'recibido',
      ubicacion_id: ordenData.ubicacion_id || null,
      tecnico_id: ordenData.tecnico_id || ticket.tecnico_id,
      falla_reportada: ordenData.falla_reportada || `[Derivado de Ticket ${ticket.titulo}]: ${ticket.descripcion || ''}`,
      estado_fisico_ingreso: ordenData.estado_fisico_ingreso || 'Ingreso procedente de ticket de soporte técnico',
      diagnostico: null,
      trabajo_realizado: null,
      recomendaciones: null,
      presupuesto_aprobado: false,
      aprobado_en: null,
      aprobado_por: null,
      aprobado_via: null,
      descuento_tipo: 'ninguno',
      descuento_valor: 0,
      descuento_motivo: null,
      itbms_pct: 7,
      fecha_ingreso: new Date().toISOString(),
      fecha_estimada: null,
      fecha_entrega: null,
      created_by: null,
    });

    await OrdenItemsService.addItem(nuevaOrden.id, {
      tipo: 'servicio',
      servicio_id: null,
      descripcion: `Atención técnica de ticket: ${ticket.titulo}`,
      cantidad: 1,
      precio_unitario: 25.0,
      costo_unitario: 0,
    });

    // Actualizar ticket enlazando la nueva orden
    const ticketActualizado = await this.update(ticketId, {
      orden_id: nuevaOrden.id,
      estado: 'en_proceso',
      primera_respuesta_en: ticket.primera_respuesta_en || new Date().toISOString(),
    });

    return { orden: nuevaOrden, ticket: ticketActualizado };
  },

  async convertirACita(
    ticketId: string,
    citaData: {
      inicio: string;
      fin: string;
      tecnico_id: string;
      tipo_servicio?: any;
      direccion?: string;
      enlace_remoto?: string;
      notas?: string;
    }
  ): Promise<{ cita: Cita; ticket: Ticket }> {
    const ticket = await this.getById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const nuevaCita = await CitasService.create({
      cliente_id: ticket.cliente_id,
      orden_id: ticket.orden_id,
      ticket_id: ticket.id,
      tipo_servicio: citaData.tipo_servicio || ticket.tipo_servicio,
      titulo: `[Ticket] ${ticket.titulo}`,
      tecnico_id: citaData.tecnico_id,
      inicio: citaData.inicio,
      fin: citaData.fin,
      direccion: citaData.direccion || null,
      enlace_remoto: citaData.enlace_remoto || null,
      estado: 'programada',
      notas: citaData.notas || ticket.descripcion,
    });

    const ticketActualizado = await this.update(ticketId, {
      estado: 'en_proceso',
      tecnico_id: citaData.tecnico_id,
      primera_respuesta_en: ticket.primera_respuesta_en || new Date().toISOString(),
    });

    return { cita: nuevaCita, ticket: ticketActualizado };
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Ticket[]>(STORAGE_KEYS.TICKETS, MOCK_TICKETS);
    setLocal(STORAGE_KEYS.TICKETS, list.filter((t) => t.id !== id));
  }
};

// ============================================================================
// SERVICIO DE INFORMES TÉCNICOS EN PDF
// ============================================================================
export const InformesService = {
  async getAll(): Promise<Informe[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('informes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocal<Informe[]>(STORAGE_KEYS.INFORMES, []);
  },

  async getByOrden(ordenId: string): Promise<Informe | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('informes')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    const all = getLocal<Informe[]>(STORAGE_KEYS.INFORMES, []);
    return all.find((inf) => inf.orden_id === ordenId) || null;
  },

  async getById(id: string): Promise<Informe | null> {
    const all = await this.getAll();
    return all.find((inf) => inf.id === id) || null;
  },

  async create(payload: {
    orden_id: string;
    garantia_dias: number;
    garantia_cubre?: string | null;
    garantia_excluye?: string | null;
    clausulas: any[];
    snapshot: any;
    firma_tecnico?: string | null;
    firma_cliente?: string | null;
    firmado_en?: string | null;
  }): Promise<Informe> {
    const list = getLocal<Informe[]>(STORAGE_KEYS.INFORMES, []);
    const currentYear = new Date().getFullYear();
    const countThisYear = list.filter((i) => i.numero.includes(`INF-${currentYear}`)).length + 1;
    const numero = `INF-${currentYear}-${String(countThisYear).padStart(4, '0')}`;
    const newId = `inf-${Date.now()}`;

    const newInforme: Informe = {
      id: newId,
      numero,
      orden_id: payload.orden_id,
      garantia_dias: payload.garantia_dias || 30,
      garantia_cubre: payload.garantia_cubre || 'Trabajo realizado y componentes instalados según reporte.',
      garantia_excluye: payload.garantia_excluye || 'Daños por humedad, golpes, sobrevoltaje o manipulación por terceros.',
      clausulas: payload.clausulas || [],
      snapshot: payload.snapshot,
      firma_tecnico: payload.firma_tecnico || null,
      firma_cliente: payload.firma_cliente || null,
      firma_tecnico_ruta: null,
      firma_cliente_ruta: null,
      firmado_en: payload.firmado_en || new Date().toISOString(),
      pdf_ruta: null,
      emitido_por: null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('informes').insert(newInforme).select().single();
      if (error) throw error;
      return data;
    }

    list.unshift(newInforme);
    setLocal(STORAGE_KEYS.INFORMES, list);

    // Registro de auditoría en la orden
    await HistorialService.addEntry(
      payload.orden_id,
      'informe_emitido' as any,
      undefined,
      undefined,
      `Informe Técnico ${numero} generado con firmas digitales`
    );

    return newInforme;
  },

  async update(id: string, updates: Partial<Informe>): Promise<Informe> {
    const list = getLocal<Informe[]>(STORAGE_KEYS.INFORMES, []);
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Informe no encontrado');

    const merged = { ...list[index], ...updates };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('informes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    list[index] = merged;
    setLocal(STORAGE_KEYS.INFORMES, list);
    return merged;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('informes').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const list = getLocal<Informe[]>(STORAGE_KEYS.INFORMES, []);
    setLocal(STORAGE_KEYS.INFORMES, list.filter((i) => i.id !== id));
  }
};

