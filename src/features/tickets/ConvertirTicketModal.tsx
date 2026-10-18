import React, { useState, useEffect } from 'react';
import { Ticket, Equipo, Ubicacion, Perfil } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EquiposService, UbicacionesService, UsuariosService, TicketsService, CitasService } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Wrench,
  ArrowRight
} from 'lucide-react';

interface ConvertirTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onConverted: () => void;
}

export const ConvertirTicketModal: React.FC<ConvertirTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onConverted,
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'orden' | 'cita'>('orden');

  // Datos para Orden
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [equipoId, setEquipoId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [fallaReportada, setFallaReportada] = useState('');
  const [estadoFisico, setEstadoFisico] = useState('');

  // Datos para Cita
  const [fechaCita, setFechaCita] = useState('');
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [horaFin, setHoraFin] = useState('11:30');
  const [direccionCita, setDireccionCita] = useState('');
  const [enlaceRemotoCita, setEnlaceRemotoCita] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ticket) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [eqList, ubiList, perfilesList] = await Promise.all([
          EquiposService.getByCliente(ticket.cliente_id),
          UbicacionesService.getAll(),
          UsuariosService.getAll(),
        ]);

        setEquipos(eqList);
        setUbicaciones(ubiList);
        const tecs = perfilesList.filter((p: Perfil) => p.rol === 'tecnico' || p.rol === 'dueno');
        setTecnicos(tecs);

        // Prellenar orden
        if (eqList.length > 0) setEquipoId(eqList[0].id);
        if (ubiList.length > 0) setUbicacionId(ubiList[0].id);
        setTecnicoId(ticket.tecnico_id || (tecs.length > 0 ? tecs[0].id : ''));
        setFallaReportada(`[Procedente de Ticket: ${ticket.titulo}]: ${ticket.descripcion || ''}`);
        setEstadoFisico('Ingreso derivado de ticket de soporte técnico');

        // Prellenar cita
        const today = new Date().toISOString().split('T')[0];
        setFechaCita(today);
        setHoraInicio('10:00');
        setHoraFin('11:30');
        setDireccionCita(ticket.cliente?.direccion || '');
        setEnlaceRemotoCita('');
      } catch (err) {
        console.error('Error cargando datos para conversión:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, ticket]);

  // Validación de solapamiento para cita
  useEffect(() => {
    if (tab !== 'cita' || !tecnicoId || !fechaCita || !horaInicio || !horaFin) {
      setConflictWarning(null);
      return;
    }

    try {
      const startIso = `${fechaCita}T${horaInicio}:00`;
      const endIso = `${fechaCita}T${horaFin}:00`;

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        setConflictWarning('La hora de fin debe ser posterior a la de inicio.');
        return;
      }

      const res = CitasService.checkConflict(tecnicoId, startIso, endIso);
      if (res.hasConflict && res.conflictingCita) {
        const cIni = new Date(res.conflictingCita.inicio).toLocaleTimeString('es-PA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const cFin = new Date(res.conflictingCita.fin).toLocaleTimeString('es-PA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        setConflictWarning(
          `Solapamiento: El técnico ya tiene "${res.conflictingCita.titulo}" de ${cIni} a ${cFin}.`
        );
      } else {
        setConflictWarning(null);
      }
    } catch {
      setConflictWarning(null);
    }
  }, [tab, tecnicoId, fechaCita, horaInicio, horaFin]);

  if (!ticket) return null;

  const handleConvertirAOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoId) {
      setErrorMsg('Debes seleccionar o crear un equipo del cliente para generar la orden.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const result = await TicketsService.convertirAOrden(ticket.id, {
        equipo_id: equipoId,
        ubicacion_id: ubicacionId,
        tecnico_id: tecnicoId,
        falla_reportada: fallaReportada,
        estado_fisico_ingreso: estadoFisico,
      });

      onConverted();
      onClose();
      // Redirigir al detalle de la orden recién creada
      navigate(`/ordenes/${result.orden.id}`);
    } catch (err: any) {
      console.error('Error al convertir ticket a orden:', err);
      setErrorMsg(err.message || 'Error al generar la orden');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertirACita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCita || !horaInicio || !horaFin || !tecnicoId) {
      setErrorMsg('Completa la fecha, horarios y técnico asignado.');
      return;
    }

    const startIso = new Date(`${fechaCita}T${horaInicio}:00`).toISOString();
    const endIso = new Date(`${fechaCita}T${horaFin}:00`).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await TicketsService.convertirACita(ticket.id, {
        inicio: startIso,
        fin: endIso,
        tecnico_id: tecnicoId,
        tipo_servicio: ticket.tipo_servicio,
        direccion: ticket.tipo_servicio === 'domicilio' ? direccionCita : undefined,
        enlace_remoto: ticket.tipo_servicio === 'remoto' ? enlaceRemotoCita : undefined,
      });

      onConverted();
      onClose();
      navigate('/agenda');
    } catch (err: any) {
      console.error('Error al convertir ticket a cita:', err);
      setErrorMsg(err.message || 'Error al programar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convertir Ticket de Soporte" size="lg">
      <div className="space-y-4">
        {/* Banner de origen */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Ticket #{ticket.id.slice(-6).toUpperCase()}
          </span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {ticket.titulo}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.cliente?.nombre}</span>
          </p>
        </div>

        {/* Selector de Destino: Orden vs Cita */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('orden'); setErrorMsg(null); }}
            className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              tab === 'orden'
                ? 'border-axBlue text-axBlue'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generar Orden de Trabajo</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('cita'); setErrorMsg(null); }}
            className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              tab === 'cita'
                ? 'border-axBlue text-axBlue'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Cita en Calendario</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Orden */}
        {tab === 'orden' && (
          <form onSubmit={handleConvertirAOrden} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equipo del Cliente *
              </label>
              {equipos.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  El cliente no tiene equipos registrados en la base de datos. Debes registrar el equipo primero desde la sección de Equipos.
                </div>
              ) : (
                <select
                  value={equipoId}
                  onChange={(e) => setEquipoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                  required
                >
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tipo} - {eq.marca} {eq.modelo} (Serie: {eq.serie || 'S/N'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ubicación Física Inicial
                </label>
                <select
                  value={ubicacionId}
                  onChange={(e) => setUbicacionId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                >
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Técnico Asignado
                </label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                >
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Falla / Trabajo a Realizar
              </label>
              <textarea
                rows={2}
                value={fallaReportada}
                onChange={(e) => setFallaReportada(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || equipos.length === 0}
                className="bg-axBlue hover:bg-axBlueHover text-white font-semibold flex items-center gap-1.5"
              >
                <span>{saving ? 'Creando Orden...' : 'Crear Orden e Ir al Detalle'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Formulario de Cita */}
        {tab === 'cita' && (
          <form onSubmit={handleConvertirACita} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidad del Servicio
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-xs font-semibold capitalize text-slate-800 dark:text-slate-100">
                  {ticket.tipo_servicio} (Heredado del ticket)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Técnico Asignado *
                </label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                  required
                >
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora Inicio *</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora Fin *</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Warning de solapamiento */}
            {conflictWarning && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">{conflictWarning}</span>
              </div>
            )}

            {ticket.tipo_servicio === 'domicilio' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección para Visita Presencial
                </label>
                <input
                  type="text"
                  value={direccionCita}
                  onChange={(e) => setDireccionCita(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {ticket.tipo_servicio === 'remoto' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enlace o AnyDesk ID
                </label>
                <input
                  type="text"
                  value={enlaceRemotoCita}
                  onChange={(e) => setEnlaceRemotoCita(e.target.value)}
                  placeholder="AnyDesk ID o Meet URL"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !!conflictWarning}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                <span>{saving ? 'Agendando...' : 'Agendar Cita en Calendario'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
