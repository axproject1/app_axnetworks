import React, { useState, useEffect } from 'react';
import { Cita, Cliente, Perfil, Orden, TipoServicio, EstadoCita } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ClientesService, UsuariosService, OrdenesService, CitasService } from '@/lib/storage';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Laptop, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

interface CitaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  citaToEdit?: Cita | null;
  initialDate?: Date | null;
  onSaved: (cita: Cita) => void;
}

export const CitaFormModal: React.FC<CitaFormModalProps> = ({
  isOpen,
  onClose,
  citaToEdit,
  initialDate,
  onSaved,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos de formulario
  const [clienteId, setClienteId] = useState('');
  const [ordenId, setOrdenId] = useState<string>('');
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>('domicilio');
  const [titulo, setTitulo] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:30');
  const [direccion, setDireccion] = useState('');
  const [enlaceRemoto, setEnlaceRemoto] = useState('');
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState<EstadoCita>('programada');

  // Conflict state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [cliList, perfilesList, ordList] = await Promise.all([
          ClientesService.getAll(),
          UsuariosService.getAll(),
          OrdenesService.getAll(),
        ]);

        setClientes(cliList);
        const tecs = perfilesList.filter((p: Perfil) => p.rol === 'tecnico' || p.rol === 'dueno');
        setTecnicos(tecs);
        setOrdenes(ordList);

        if (citaToEdit) {
          setClienteId(citaToEdit.cliente_id);
          setOrdenId(citaToEdit.orden_id || '');
          setTipoServicio(citaToEdit.tipo_servicio);
          setTitulo(citaToEdit.titulo);
          setTecnicoId(citaToEdit.tecnico_id);
          setDireccion(citaToEdit.direccion || '');
          setEnlaceRemoto(citaToEdit.enlace_remoto || '');
          setNotas(citaToEdit.notas || '');
          setEstado(citaToEdit.estado);

          const ini = new Date(citaToEdit.inicio);
          const f = new Date(citaToEdit.fin);
          setFecha(ini.toISOString().split('T')[0]);
          setHoraInicio(ini.toTimeString().slice(0, 5));
          setHoraFin(f.toTimeString().slice(0, 5));
        } else {
          // Defaults para nueva cita
          const baseDate = initialDate || new Date();
          const dateStr = baseDate.toISOString().split('T')[0];
          setFecha(dateStr);
          setHoraInicio('10:00');
          setHoraFin('11:30');
          setTipoServicio('domicilio');
          setTitulo('');
          setOrdenId('');
          setDireccion('');
          setEnlaceRemoto('');
          setNotas('');
          setEstado('programada');

          if (cliList.length > 0) setClienteId(cliList[0].id);
          if (tecs.length > 0) setTecnicoId(tecs[0].id);
        }
      } catch (err) {
        console.error('Error cargando datos de cita:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, citaToEdit, initialDate]);

  // Si cambia el cliente y es domicilio, autorellenar dirección
  const handleClienteChange = (cId: string) => {
    setClienteId(cId);
    if (tipoServicio === 'domicilio') {
      const cli = clientes.find((c) => c.id === cId);
      if (cli?.direccion && !direccion) {
        setDireccion(cli.direccion);
      }
    }
  };

  // Validación de solapamiento en tiempo real
  useEffect(() => {
    if (!tecnicoId || !fecha || !horaInicio || !horaFin) {
      setConflictWarning(null);
      return;
    }

    try {
      const startIso = `${fecha}T${horaInicio}:00`;
      const endIso = `${fecha}T${horaFin}:00`;

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        setConflictWarning('La hora de fin debe ser posterior a la de inicio.');
        return;
      }

      const res = CitasService.checkConflict(
        tecnicoId,
        startIso,
        endIso,
        citaToEdit ? citaToEdit.id : undefined
      );

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
  }, [tecnicoId, fecha, horaInicio, horaFin, citaToEdit]);

  // Accesos rápidos de duración
  const setDuration = (minutes: number) => {
    if (!horaInicio) return;
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    setHoraFin(
      `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !tecnicoId || !titulo.trim() || !fecha || !horaInicio || !horaFin) {
      setErrorMsg('Por favor completa los campos obligatorios marcados con *');
      return;
    }

    const startIso = new Date(`${fecha}T${horaInicio}:00`).toISOString();
    const endIso = new Date(`${fecha}T${horaFin}:00`).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (citaToEdit) {
        const updated = await CitasService.update(citaToEdit.id, {
          cliente_id: clienteId,
          orden_id: ordenId || null,
          tipo_servicio: tipoServicio,
          titulo: titulo.trim(),
          tecnico_id: tecnicoId,
          inicio: startIso,
          fin: endIso,
          direccion: tipoServicio === 'domicilio' ? direccion.trim() : null,
          enlace_remoto: tipoServicio === 'remoto' ? enlaceRemoto.trim() : null,
          estado,
          notas: notas.trim() || null,
        });
        onSaved(updated);
      } else {
        const created = await CitasService.create({
          cliente_id: clienteId,
          orden_id: ordenId || null,
          ticket_id: null,
          tipo_servicio: tipoServicio,
          titulo: titulo.trim(),
          tecnico_id: tecnicoId,
          inicio: startIso,
          fin: endIso,
          direccion: tipoServicio === 'domicilio' ? direccion.trim() : null,
          enlace_remoto: tipoServicio === 'remoto' ? enlaceRemoto.trim() : null,
          estado,
          notas: notas.trim() || null,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar cita:', err);
      setErrorMsg(err.message || 'Error al guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={citaToEdit ? 'Editar Cita Técnica' : 'Programar Nueva Cita Técnica'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modalidad de Servicio (Color coded) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tipo de Servicio / Modalidad *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipoServicio('remoto')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tipoServicio === 'remoto'
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Laptop className="w-4 h-4 text-sky-500" />
              <span>Remoto (Azul)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoServicio('domicilio');
                const cli = clientes.find((c) => c.id === clienteId);
                if (cli?.direccion && !direccion) setDireccion(cli.direccion);
              }}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tipoServicio === 'domicilio'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Domicilio (Verde)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoServicio('taller')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tipoServicio === 'taller'
                  ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4 text-orange-500" />
              <span>Taller (Naranja)</span>
            </button>
          </div>
        </div>

        {/* Título de la cita */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Motivo / Título de la Cita *
          </label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Mantenimiento preventivo PC oficina o Soporte AnyDesk"
            required
          />
        </div>

        {/* Cliente y Técnico en dos columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente *
            </label>
            <select
              value={clienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-axBlue focus:outline-none"
              required
            >
              <option value="">Seleccione cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.empresa ? `(${c.empresa})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Técnico Asignado *
            </label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-axBlue focus:outline-none"
              required
            >
              <option value="">Seleccione técnico...</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.rol === 'dueno' ? 'Dueño' : 'Técnico'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha y Horario */}
        <div className="p-3 bg-slate-50 dark:bg-darkCard rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-axBlue" />
              Horario y Fecha
            </span>
            {/* Quick buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 mr-1">Duración:</span>
              <button
                type="button"
                onClick={() => setDuration(30)}
                className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 hover:border-axBlue text-slate-600 dark:text-slate-300"
              >
                30 min
              </button>
              <button
                type="button"
                onClick={() => setDuration(60)}
                className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 hover:border-axBlue text-slate-600 dark:text-slate-300"
              >
                1 hora
              </button>
              <button
                type="button"
                onClick={() => setDuration(90)}
                className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 hover:border-axBlue text-slate-600 dark:text-slate-300"
              >
                1.5 h
              </button>
              <button
                type="button"
                onClick={() => setDuration(120)}
                className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 hover:border-axBlue text-slate-600 dark:text-slate-300"
              >
                2 horas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Hora Inicio *
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Hora Fin *
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Detección y alerta de solapamiento en tiempo real */}
          {conflictWarning ? (
            <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{conflictWarning}</span>
            </div>
          ) : (
            <div className="p-1.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Horario disponible para el técnico seleccionado</span>
            </div>
          )}
        </div>

        {/* Campos condicionales según tipo de servicio */}
        {tipoServicio === 'domicilio' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección de la Visita Presencial
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, edificio, oficina o casa"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {tipoServicio === 'remoto' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Enlace o ID de Conexión Remota
            </label>
            <div className="relative">
              <Laptop className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={enlaceRemoto}
                onChange={(e) => setEnlaceRemoto(e.target.value)}
                placeholder="AnyDesk ID: 000 000 000 o enlace de Meet/Teams"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Estado y Orden vinculada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estado de la Cita
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCita)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="programada">Programada</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En Curso</option>
              <option value="completada">Completada</option>
              <option value="reprogramada">Reprogramada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vincular a Orden de Trabajo (opcional)
            </label>
            <select
              value={ordenId}
              onChange={(e) => setOrdenId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="">Sin orden vinculada</option>
              {ordenes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.numero} - {o.cliente?.nombre || 'Cliente'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Instrucciones o Notas Técnicas
          </label>
          <textarea
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Materiales a llevar, indicaciones de acceso o diagnóstico previo..."
            className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving || !!conflictWarning}
            className="bg-axBlue hover:bg-axBlueHover text-white font-semibold"
          >
            {saving ? 'Guardando...' : citaToEdit ? 'Actualizar Cita' : 'Crear Cita'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
