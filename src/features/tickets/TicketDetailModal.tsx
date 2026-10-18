import React, { useState } from 'react';
import { Ticket, EstadoTicket, Prioridad } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TicketsService } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  User, 
  Tag, 
  Laptop, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Edit2, 
  Trash2, 
  FileText, 
  Calendar,
  MessageSquare
} from 'lucide-react';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onOpenConvertir: (ticket: Ticket) => void;
  onUpdated: (ticket: Ticket) => void;
}

const PRIORIDAD_MAP: Record<Prioridad, { label: string; badge: string; slaHours: number }> = {
  urgente: { label: 'Urgente', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800', slaHours: 4 },
  alta: { label: 'Alta', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800', slaHours: 8 },
  media: { label: 'Media', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800', slaHours: 24 },
  baja: { label: 'Baja', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700', slaHours: 48 },
};

const ESTADOS_MAP: Record<EstadoTicket, { label: string; badge: string }> = {
  abierto: { label: 'Abierto', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300' },
  en_proceso: { label: 'En Proceso', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300' },
  resuelto: { label: 'Resuelto', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' },
  cerrado: { label: 'Cerrado', badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
};

function formatElapsedTime(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const diffMinutes = Math.max(0, Math.round((to - from) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (hours < 24) return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onEdit,
  onDelete,
  onOpenConvertir,
  onUpdated,
}) => {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  if (!ticket) return null;

  const prioInfo = PRIORIDAD_MAP[ticket.prioridad];
  const estadoInfo = ESTADOS_MAP[ticket.estado];

  const handleEstadoChange = async (newEstado: EstadoTicket) => {
    setUpdating(true);
    try {
      const updated = await TicketsService.update(ticket.id, { estado: newEstado });
      onUpdated(updated);
    } catch (err) {
      console.error('Error al cambiar estado de ticket:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRegistrarRespuesta = async () => {
    setUpdating(true);
    try {
      const updated = await TicketsService.registrarPrimeraRespuesta(ticket.id);
      onUpdated(updated);
    } catch (err) {
      console.error('Error registrando primera respuesta:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Ticket de Soporte" size="lg">
      <div className="space-y-4">
        {/* Encabezado con ID, Título y Estado */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-400">
                #{ticket.id.slice(-6).toUpperCase()}
              </span>

              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${prioInfo.badge}`}>
                {prioInfo.label}
              </span>

              {ticket.tipo_servicio === 'remoto' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  <Laptop className="w-3 h-3" />
                  Remoto
                </span>
              )}
              {ticket.tipo_servicio === 'domicilio' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <MapPin className="w-3 h-3" />
                  Domicilio
                </span>
              )}
              {ticket.tipo_servicio === 'taller' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  <Wrench className="w-3 h-3" />
                  Taller
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {ticket.titulo}
            </h3>
          </div>

          {/* Selector de estado */}
          <div className="shrink-0">
            <select
              value={ticket.estado}
              disabled={updating}
              onChange={(e) => handleEstadoChange(e.target.value as EstadoTicket)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-axBlue"
            >
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        {/* SLAs: Primera Respuesta y Tiempo de Resolución */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tarjeta Primera Respuesta */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              SLA Primera Respuesta
            </span>
            {ticket.primera_respuesta_en ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Respondido en {formatElapsedTime(ticket.created_at, ticket.primera_respuesta_en)}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Pendiente ({formatElapsedTime(ticket.created_at)} transcurridos)</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegistrarRespuesta}
                  disabled={updating}
                  className="w-full text-xs h-7 text-axBlue border-axBlue/30 hover:bg-axBlue/5"
                >
                  Registrar Primera Respuesta Ahora
                </Button>
              </div>
            )}
          </div>

          {/* Tarjeta Resolución */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              SLA Resolución (Objetivo: {prioInfo.slaHours}h)
            </span>
            {ticket.resuelto_en ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Resuelto en {formatElapsedTime(ticket.created_at, ticket.resuelto_en)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Abierto hace {formatElapsedTime(ticket.created_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cliente y Técnico Asignado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Cliente
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {ticket.cliente?.nombre || 'Cliente sin asignar'}
            </p>
            {ticket.cliente?.empresa && (
              <p className="text-[11px] text-slate-500">{ticket.cliente.empresa}</p>
            )}
            {ticket.cliente?.telefono && (
              <p className="text-[11px] text-slate-500 mt-1">Tel: {ticket.cliente.telefono}</p>
            )}
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Técnico Asignado
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {ticket.tecnico?.nombre || 'En cola general (sin asignar)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Creado el {new Date(ticket.created_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Descripción del Problema
          </span>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {ticket.descripcion || 'Sin descripción detallada.'}
          </p>
        </div>

        {/* Si ya está convertido a Orden, mostrar enlace directo */}
        {ticket.orden_id && (
          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-axBlue" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Orden de trabajo vinculada
                </p>
                <p className="text-[11px] text-slate-500">
                  Este ticket derivó en una orden de servicio técnico.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/ordenes/${ticket.orden_id}`);
              }}
              className="bg-axBlue hover:bg-axBlueHover text-white text-xs h-7 px-2.5 flex items-center gap-1"
            >
              <span>Ver Orden</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Acciones del pie */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar este ticket de soporte?')) {
                onDelete(ticket.id);
                onClose();
              }
            }}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Eliminar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(ticket);
                onClose();
              }}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Editar
            </Button>

            <Button
              size="sm"
              onClick={() => {
                onOpenConvertir(ticket);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Convertir a Orden / Cita</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
