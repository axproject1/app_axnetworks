import { EstadoOrden, Prioridad, TipoServicio, RolUsuario, MetodoPago } from '@/types/database';

/**
 * Formatea un número de teléfono para Panamá.
 * Soporta números de 8 dígitos móviles (6XXX-XXXX) o fijos (2XX-XXXX / 3XX-XXXX)
 * Agrega el prefijo +507 visual si corresponde.
 */
export function formatPanamaPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');

  // Si viene con prefijo 507
  if (digits.startsWith('507') && digits.length >= 11) {
    const local = digits.slice(3);
    if (local.length === 8) {
      return `+507 ${local.slice(0, 4)}-${local.slice(4)}`;
    }
    return `+507 ${local}`;
  }

  // 8 dígitos locales
  if (digits.length === 8) {
    return `+507 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  // 7 dígitos locales antiguos
  if (digits.length === 7) {
    return `+507 ${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return raw;
}

/**
 * Normaliza el teléfono al formato internacional limpio para enlaces de WhatsApp: 507XXXXXXXX
 */
export function cleanWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('507') && (digits.length === 8 || digits.length === 7)) {
    digits = `507${digits}`;
  }
  return digits;
}

/**
 * Formatea valores numéricos a dólares ($ USD)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea fechas a formato legible en español
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export const ESTADOS_ORDEN_CONFIG: Record<EstadoOrden, { label: string; bg: string; text: string; border: string }> = {
  recibido: { label: 'Recibido', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  diagnostico: { label: 'En Diagnóstico', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  espera_aprobacion: { label: 'Espera Aprobación', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  espera_repuesto: { label: 'Espera Repuesto', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  reparacion: { label: 'En Reparación', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-800 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  listo: { label: 'Listo p/ Retiro', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  entregado: { label: 'Entregado', bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  cancelado: { label: 'Cancelado', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
};

export const PRIORIDAD_CONFIG: Record<Prioridad, { label: string; color: string; dot: string }> = {
  baja: { label: 'Baja', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400' },
  media: { label: 'Media', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', dot: 'bg-blue-500' },
  alta: { label: 'Alta', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30', dot: 'bg-amber-500' },
  urgente: { label: 'Urgente', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30', dot: 'bg-rose-500' },
};

export const TIPO_SERVICIO_CONFIG: Record<TipoServicio, { label: string; icon: string }> = {
  taller: { label: 'Taller', icon: 'Wrench' },
  domicilio: { label: 'A Domicilio / Oficina', icon: 'MapPin' },
  remoto: { label: 'Soporte Remoto', icon: 'Wifi' },
};

export const ROL_CONFIG: Record<RolUsuario, { label: string; badge: string }> = {
  dueno: { label: 'Dueño / Admin', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  recepcion: { label: 'Recepción', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  tecnico: { label: 'Técnico Especialista', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

export const METODO_PAGO_CONFIG: Record<MetodoPago, { label: string }> = {
  efectivo: { label: 'Efectivo' },
  yappy: { label: 'Yappy (Banco General)' },
  transferencia_ach: { label: 'Transferencia ACH' },
  tarjeta: { label: 'Tarjeta Crédito/Débito' },
  otro: { label: 'Otro' },
};

export const CATEGORIA_GASTO_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  repuestos: { label: 'Repuestos', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', color: '#6366f1' },
  herramientas: { label: 'Herramientas y Equipos', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', color: '#f59e0b' },
  transporte: { label: 'Transporte y Viáticos', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', color: '#10b981' },
  servicios: { label: 'Servicios Públicos / Taller', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800', color: '#0ea5e9' },
  publicidad: { label: 'Publicidad y Marketing', badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800', color: '#ec4899' },
  alquiler: { label: 'Alquiler y Local', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800', color: '#a855f7' },
  otros: { label: 'Otros Gastos', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', color: '#64748b' },
};

