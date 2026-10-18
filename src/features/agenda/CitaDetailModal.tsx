import React, { useState } from 'react';
import { Cita, EstadoCita } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CitasService } from '@/lib/storage';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Laptop, 
  Wrench, 
  User, 
  Phone, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Copy
} from 'lucide-react';

interface CitaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  onEdit: (cita: Cita) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (cita: Cita) => void;
  onUpdated: (cita: Cita) => void;
}

const ESTADOS_MAP: Record<EstadoCita, { label: string; badge: string }> = {
  programada: { label: 'Programada', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  confirmada: { label: 'Confirmada', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  en_curso: { label: 'En Curso', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  completada: { label: 'Completada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  cancelada: { label: 'Cancelada', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
  reprogramada: { label: 'Reprogramada', badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

export const CitaDetailModal: React.FC<CitaDetailModalProps> = ({
  isOpen,
  onClose,
  cita,
  onEdit,
  onDelete,
  onOpenWhatsApp,
  onUpdated,
}) => {
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!cita) return null;

  const ini = new Date(cita.inicio);
  const fin = new Date(cita.fin);
  const diffMinutes = Math.round((fin.getTime() - ini.getTime()) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes} min`;

  const handleEstadoChange = async (nuevoEstado: EstadoCita) => {
    setUpdatingEstado(true);
    try {
      const updated = await CitasService.update(cita.id, { estado: nuevoEstado });
      onUpdated(updated);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setUpdatingEstado(false);
    }
  };

  const copyRemote = () => {
    if (!cita.enlace_remoto) return;
    navigator.clipboard.writeText(cita.enlace_remoto);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de la Cita Técnica" size="md">
      <div className="space-y-4">
        {/* Encabezado con Tipo y Estado */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {cita.tipo_servicio === 'remoto' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  <Laptop className="w-3.5 h-3.5" />
                  Soporte Remoto
                </span>
              )}
              {cita.tipo_servicio === 'domicilio' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <MapPin className="w-3.5 h-3.5" />
                  Visita Domicilio / Oficina
                </span>
              )}
              {cita.tipo_servicio === 'taller' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                  <Wrench className="w-3.5 h-3.5" />
                  Atención en Taller
                </span>
              )}

              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${ESTADOS_MAP[cita.estado].badge}`}>
                {ESTADOS_MAP[cita.estado].label}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {cita.titulo}
            </h3>
          </div>

          {/* Selector rápido de estado */}
          <div className="shrink-0">
            <select
              value={cita.estado}
              disabled={updatingEstado}
              onChange={(e) => handleEstadoChange(e.target.value as EstadoCita)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-axBlue"
            >
              <option value="programada">Programada</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En Curso</option>
              <option value="completada">Completada</option>
              <option value="reprogramada">Reprogramada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="p-3 bg-slate-50 dark:bg-darkCard rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Fecha programada</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <Calendar className="w-3.5 h-3.5 text-axBlue" />
              <span>
                {ini.toLocaleDateString('es-PA', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Horario & Duración</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <Clock className="w-3.5 h-3.5 text-axBlue" />
              <span>
                {ini.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true })} -{' '}
                {fin.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true })}
                <span className="text-[11px] font-normal text-slate-400 ml-1">({durationText})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Técnico */}
        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cliente
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {cita.cliente?.nombre || 'Cliente sin registrar'}
              </p>
              {cita.cliente?.empresa && (
                <p className="text-[11px] text-slate-500">{cita.cliente.empresa}</p>
              )}
            </div>

            {/* Quick contact buttons */}
            <div className="flex items-center gap-1.5">
              {cita.cliente?.telefono && (
                <a
                  href={`tel:${cita.cliente.telefono}`}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-darkBg text-slate-600 dark:text-slate-300"
                  title="Llamar"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenWhatsApp(cita)}
                className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs py-1 px-2.5 h-auto flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
                {cita.recordatorio_enviado && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Técnico asignado
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {cita.tecnico?.nombre || 'Técnico sin asignar'}
            </p>
            {cita.tecnico?.telefono && (
              <p className="text-[11px] text-slate-500">Tel: {cita.tecnico.telefono}</p>
            )}
          </div>
        </div>

        {/* Ubicación o Enlace */}
        {cita.tipo_servicio === 'domicilio' && (
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
            <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
              Dirección de la visita
            </span>
            <p className="text-slate-700 dark:text-slate-200 font-medium flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{cita.direccion || cita.cliente?.direccion || 'Sin dirección especificada'}</span>
            </p>
          </div>
        )}

        {cita.tipo_servicio === 'remoto' && (
          <div className="p-3 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 text-xs">
            <span className="text-[10px] font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider block mb-1">
              Conexión remota
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="text-slate-700 dark:text-slate-200 font-mono font-medium">
                {cita.enlace_remoto || 'Coordinación por WhatsApp / AnyDesk'}
              </p>
              {cita.enlace_remoto && (
                <button
                  type="button"
                  onClick={copyRemote}
                  className="px-2 py-1 rounded bg-white dark:bg-darkBg border border-sky-300 dark:border-sky-800 text-[11px] text-sky-700 dark:text-sky-300 hover:bg-sky-50 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedLink ? 'Copiado' : 'Copiar'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        {cita.notas && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Notas técnicas
            </span>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{cita.notas}</p>
          </div>
        )}

        {/* Acciones del pie */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar esta cita técnica?')) {
                onDelete(cita.id);
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
                onEdit(cita);
                onClose();
              }}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenWhatsApp(cita)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Enviar WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
