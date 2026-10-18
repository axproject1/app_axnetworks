import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import { Cita, Perfil, TipoServicio, EstadoCita } from '@/types/database';
import { CitasService, UsuariosService } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CitaFormModal } from './CitaFormModal';
import { CitaDetailModal } from './CitaDetailModal';
import { WhatsAppCitaReminderModal } from './WhatsAppCitaReminderModal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Laptop, 
  MapPin, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User,
  MessageSquare,
  List,
  CalendarDays
} from 'lucide-react';

const SERVICE_COLORS: Record<TipoServicio, { bg: string; border: string; text: string; hex: string }> = {
  remoto: {
    bg: 'bg-sky-50 dark:bg-sky-950/70',
    border: 'border-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    hex: '#0284c7', // Sky 600
  },
  domicilio: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/70',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    hex: '#16a34a', // Emerald 600
  },
  taller: {
    bg: 'bg-orange-50 dark:bg-orange-950/70',
    border: 'border-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    hex: '#ea580c', // Orange 600
  },
};

export const AgendaPage: React.FC = () => {
  const calendarRef = useRef<any>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterTecnico, setFilterTecnico] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [citaToEdit, setCitaToEdit] = useState<Cita | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [citaForWhatsApp, setCitaForWhatsApp] = useState<Cita | null>(null);

  // Notificación de conflicto al arrastrar
  const [conflictToast, setConflictToast] = useState<string | null>(null);

  // Vista en móvil: calendario vs lista
  const [mobileViewMode, setMobileViewMode] = useState<'calendar' | 'list'>('calendar');

  const loadCitas = async () => {
    try {
      const [allCitas, allPerfiles] = await Promise.all([
        CitasService.getAll(),
        UsuariosService.getAll(),
      ]);
      setCitas(allCitas);
      setTecnicos(allPerfiles.filter((p: Perfil) => p.rol === 'tecnico' || p.rol === 'dueno'));
    } catch (err) {
      console.error('Error al cargar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  // Filtrado de citas
  const filteredCitas = citas.filter((c) => {
    if (filterTecnico !== 'todos' && c.tecnico_id !== filterTecnico) return false;
    if (filterTipo !== 'todos' && c.tipo_servicio !== filterTipo) return false;
    if (filterEstado !== 'todos' && c.estado !== filterEstado) return false;
    return true;
  });

  // Métricas rápidas
  const todayStr = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(
    (c) => c.inicio.startsWith(todayStr) && c.estado !== 'cancelada'
  );
  const pendientesConfirmar = citas.filter((c) => c.estado === 'programada');
  const citasRemotas = citas.filter((c) => c.tipo_servicio === 'remoto');
  const citasDomicilio = citas.filter((c) => c.tipo_servicio === 'domicilio');

  // Mapeo a eventos de FullCalendar
  const calendarEvents = filteredCitas.map((c) => {
    const color = SERVICE_COLORS[c.tipo_servicio] || SERVICE_COLORS.taller;
    const isCancelled = c.estado === 'cancelada';

    return {
      id: c.id,
      title: `${c.titulo} · ${c.cliente?.nombre || 'Cliente'}`,
      start: c.inicio,
      end: c.fin,
      backgroundColor: isCancelled ? '#94a3b8' : color.hex,
      borderColor: isCancelled ? '#64748b' : color.hex,
      textColor: '#ffffff',
      extendedProps: {
        cita: c,
      },
    };
  });

  // Manejador de Drag & Drop (Reprogramación con validación de conflicto)
  const handleEventDrop = async (info: any) => {
    const cita = info.event.extendedProps.cita as Cita;
    if (!cita) return;

    const newStart = info.event.start?.toISOString();
    const newEnd = info.event.end?.toISOString() || new Date(info.event.start!.getTime() + 60 * 60000).toISOString();

    if (!newStart) {
      info.revert();
      return;
    }

    try {
      await CitasService.reprogramar(cita.id, newStart, newEnd);
      await loadCitas();
      setConflictToast(`Cita "${cita.titulo}" reprogramada con éxito.`);
      setTimeout(() => setConflictToast(null), 4000);
    } catch (err: any) {
      info.revert();
      setConflictToast(err.message || 'Conflicto detectado: El técnico ya tiene otra cita asignada en ese horario.');
      setTimeout(() => setConflictToast(null), 5000);
    }
  };

  // Manejador de Resize (cambio de duración)
  const handleEventResize = async (info: any) => {
    const cita = info.event.extendedProps.cita as Cita;
    if (!cita || !info.event.start || !info.event.end) return;

    try {
      await CitasService.update(cita.id, {
        inicio: info.event.start.toISOString(),
        fin: info.event.end.toISOString(),
      });
      await loadCitas();
    } catch (err: any) {
      info.revert();
      setConflictToast(err.message || 'Error al cambiar la duración de la cita.');
      setTimeout(() => setConflictToast(null), 5000);
    }
  };

  // Clic en evento
  const handleEventClick = (info: any) => {
    const cita = info.event.extendedProps.cita as Cita;
    if (cita) {
      setSelectedCita(cita);
      setIsDetailOpen(true);
    }
  };

  // Clic en fecha vacía para crear nueva cita
  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setCitaToEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toast de conflicto / éxito */}
      {conflictToast && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between shadow-md transition-all ${
          conflictToast.includes('Conflicto') || conflictToast.includes('Error')
            ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {conflictToast.includes('Conflicto') ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{conflictToast}</span>
          </div>
          <button
            onClick={() => setConflictToast(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado Principal y Botón Nueva Cita */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-axBlue" />
            Agenda y Citas Técnicas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de citas de taller, visitas presenciales a domicilio y soporte remoto con prevención de solapamiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle en pantallas móviles */}
          <div className="sm:hidden flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-darkCard">
            <button
              onClick={() => setMobileViewMode('calendar')}
              className={`p-1.5 rounded text-xs ${
                mobileViewMode === 'calendar'
                  ? 'bg-white dark:bg-darkBg text-axBlue shadow-xs font-medium'
                  : 'text-slate-500'
              }`}
              title="Ver Calendario"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileViewMode('list')}
              className={`p-1.5 rounded text-xs ${
                mobileViewMode === 'list'
                  ? 'bg-white dark:bg-darkBg text-axBlue shadow-xs font-medium'
                  : 'text-slate-500'
              }`}
              title="Ver Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => {
              setCitaToEdit(null);
              setSelectedDate(new Date());
              setIsFormOpen(true);
            }}
            className="bg-axBlue hover:bg-axBlueHover text-white font-semibold flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Citas Hoy</span>
            <Clock className="w-4 h-4 text-axBlue" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {citasHoy.length}
          </p>
          <span className="text-[10px] text-slate-400">Programadas para el día</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Por Confirmar</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {pendientesConfirmar.length}
          </p>
          <span className="text-[10px] text-slate-400">Recordatorio pendiente</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Remoto</span>
            <Laptop className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {citasRemotas.length}
          </p>
          <span className="text-[10px] text-slate-400">AnyDesk / En línea</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Domicilio</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {citasDomicilio.length}
          </p>
          <span className="text-[10px] text-slate-400">Visitas presenciales</span>
        </div>
      </div>

      {/* Barra de Filtros y Leyenda de Color */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filtros:
              </span>

              {/* Filtro Técnico */}
              <select
                value={filterTecnico}
                onChange={(e) => setFilterTecnico(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los Técnicos</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>

              {/* Filtro Modalidad */}
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todas las Modalidades</option>
                <option value="remoto">Remoto (Azul)</option>
                <option value="domicilio">Domicilio (Verde)</option>
                <option value="taller">Taller (Naranja)</option>
              </select>

              {/* Filtro Estado */}
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los Estados</option>
                <option value="programada">Programada</option>
                <option value="confirmada">Confirmada</option>
                <option value="en_curso">En Curso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Leyenda Visual */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Remoto
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Domicilio
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                Taller
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario interactivo FullCalendar */}
      {(mobileViewMode === 'calendar' || window.innerWidth >= 640) && (
        <Card className="overflow-hidden">
          <CardContent className="p-2 sm:p-4">
            <div className="fc-theme-ax text-xs">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                locale="es"
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                events={calendarEvents}
                editable={true}
                droppable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventClick={handleEventClick}
                select={handleDateSelect}
                height="auto"
                aspectRatio={1.6}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de Lista para Móvil o Resumen */}
      {(mobileViewMode === 'list' || filteredCitas.length === 0) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Citas Programadas ({filteredCitas.length})
          </h2>
          {filteredCitas.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No hay citas que coincidan con los filtros seleccionados.
            </div>
          ) : (
            filteredCitas.map((cita) => {
              const ini = new Date(cita.inicio);
              const color = SERVICE_COLORS[cita.tipo_servicio];
              return (
                <div
                  key={cita.id}
                  onClick={() => {
                    setSelectedCita(cita);
                    setIsDetailOpen(true);
                  }}
                  className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 hover:border-axBlue cursor-pointer transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.bg} ${color.text}`}>
                        {cita.tipo_servicio}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {ini.toLocaleDateString('es-PA', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                        {ini.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {cita.titulo}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{cita.cliente?.nombre || 'Cliente'}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>Téc: {cita.tecnico?.nombre || 'Sin asignar'}</span>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCitaForWhatsApp(cita);
                      setIsWhatsAppOpen(true);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 text-[11px] h-7 px-2"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modales */}
      <CitaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        citaToEdit={citaToEdit}
        initialDate={selectedDate}
        onSaved={async () => {
          await loadCitas();
        }}
      />

      <CitaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        cita={selectedCita}
        onEdit={(cita) => {
          setCitaToEdit(cita);
          setIsFormOpen(true);
        }}
        onDelete={async (id) => {
          await CitasService.delete(id);
          await loadCitas();
        }}
        onOpenWhatsApp={(cita) => {
          setCitaForWhatsApp(cita);
          setIsWhatsAppOpen(true);
        }}
        onUpdated={async () => {
          await loadCitas();
          if (selectedCita) {
            const fresh = await CitasService.getById(selectedCita.id);
            setSelectedCita(fresh);
          }
        }}
      />

      <WhatsAppCitaReminderModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        cita={citaForWhatsApp}
        onSent={async () => {
          await loadCitas();
        }}
      />
    </div>
  );
};
