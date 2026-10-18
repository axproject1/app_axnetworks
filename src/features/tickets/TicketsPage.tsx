import React, { useState, useEffect } from 'react';
import { Ticket, Perfil, Prioridad, EstadoTicket, TipoServicio } from '@/types/database';
import { TicketsService, UsuariosService } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TicketFormModal } from './TicketFormModal';
import { TicketDetailModal } from './TicketDetailModal';
import { ConvertirTicketModal } from './ConvertirTicketModal';
import { 
  Headphones, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Laptop, 
  MapPin, 
  Wrench, 
  ArrowRight,
  FileText
} from 'lucide-react';

const PRIORIDAD_CONFIG: Record<Prioridad, { label: string; badge: string; dot: string }> = {
  urgente: { label: 'Urgente', badge: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300', dot: 'bg-rose-500' },
  alta: { label: 'Alta', badge: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' },
  media: { label: 'Media', badge: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300', dot: 'bg-blue-500' },
  baja: { label: 'Baja', badge: 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
};

const ESTADOS_CONFIG: Record<EstadoTicket, { label: string; badge: string }> = {
  abierto: { label: 'Abierto', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300' },
  en_proceso: { label: 'En Proceso', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300' },
  resuelto: { label: 'Resuelto', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' },
  cerrado: { label: 'Cerrado', badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
};

function formatElapsedTime(fromIso: string): string {
  const from = new Date(fromIso).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - from) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (hours < 24) return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('todos');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [isConvertirOpen, setIsConvertirOpen] = useState(false);
  const [ticketToConvert, setTicketToConvert] = useState<Ticket | null>(null);

  const loadData = async () => {
    try {
      const [allTickets, allPerfiles] = await Promise.all([
        TicketsService.getAll(),
        UsuariosService.getAll(),
      ]);
      setTickets(allTickets);
      setTecnicos(allPerfiles.filter((p: Perfil) => p.rol === 'tecnico' || p.rol === 'dueno'));
    } catch (err) {
      console.error('Error cargando tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado
  const filteredTickets = tickets.filter((t) => {
    if (filterEstado !== 'todos' && t.estado !== filterEstado) return false;
    if (filterPrioridad !== 'todos' && t.prioridad !== filterPrioridad) return false;
    if (filterTipo !== 'todos' && t.tipo_servicio !== filterTipo) return false;
    if (filterTecnico !== 'todos' && t.tecnico_id !== filterTecnico) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitulo = t.titulo.toLowerCase().includes(q);
      const matchDesc = t.descripcion?.toLowerCase().includes(q) || false;
      const matchCliente = t.cliente?.nombre.toLowerCase().includes(q) || false;
      const matchEmpresa = t.cliente?.empresa?.toLowerCase().includes(q) || false;
      return matchTitulo || matchDesc || matchCliente || matchEmpresa;
    }
    return true;
  });

  // Métricas
  const activos = tickets.filter((t) => t.estado === 'abierto' || t.estado === 'en_proceso');
  const sinRespuesta = tickets.filter((t) => !t.primera_respuesta_en && t.estado !== 'cerrado');
  const urgentes = tickets.filter((t) => (t.prioridad === 'urgente' || t.prioridad === 'alta') && t.estado !== 'resuelto' && t.estado !== 'cerrado');
  const resueltos = tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado');

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Headphones className="w-6 h-6 text-axBlue" />
            Tickets de Soporte Técnico
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recepción y seguimiento de incidentes, SLAs de respuesta y resolución, y derivación a órdenes o citas.
          </p>
        </div>

        <Button
          onClick={() => {
            setTicketToEdit(null);
            setIsFormOpen(true);
          }}
          className="bg-axBlue hover:bg-axBlueHover text-white font-semibold flex items-center gap-1.5 shadow-sm text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Ticket</span>
        </Button>
      </div>

      {/* Tarjetas de Métricas SLA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Activos en Cola</span>
            <Headphones className="w-4 h-4 text-axBlue" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {activos.length}
          </p>
          <span className="text-[10px] text-slate-400">Abiertos y en proceso</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sin Primera Respuesta</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {sinRespuesta.length}
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Requieren atención rápida</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Urgentes / Alta</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {urgentes.length}
          </p>
          <span className="text-[10px] text-slate-400">SLA prioritario de 4h-8h</span>
        </div>

        <div className="p-3 bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Resueltos / Cerrados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {resueltos.length}
          </p>
          <span className="text-[10px] text-slate-400">Casos concluidos</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {/* Búsqueda general */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, título del ticket o descripción..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtros selectores */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">Abiertos</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resueltos</option>
              <option value="cerrado">Cerrados</option>
            </select>

            {/* Prioridad */}
            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="todos">Todas las Prioridades</option>
              <option value="urgente">Urgente (4h)</option>
              <option value="alta">Alta (8h)</option>
              <option value="media">Media (24h)</option>
              <option value="baja">Baja (48h)</option>
            </select>

            {/* Modalidad */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="todos">Todas las Modalidades</option>
              <option value="remoto">Remoto</option>
              <option value="domicilio">Domicilio</option>
              <option value="taller">Taller</option>
            </select>

            {/* Técnico */}
            <select
              value={filterTecnico}
              onChange={(e) => setFilterTecnico(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="todos">Todos los Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No se encontraron tickets con los criterios de búsqueda.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const prio = PRIORIDAD_CONFIG[ticket.prioridad];
            const est = ESTADOS_CONFIG[ticket.estado];
            const tieneOrden = !!ticket.orden_id;
            const sinRespuestaAun = !ticket.primera_respuesta_en && ticket.estado !== 'cerrado';

            return (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsDetailOpen(true);
                }}
                className={`p-3.5 bg-white dark:bg-darkCard rounded-xl border transition-all cursor-pointer hover:border-axBlue flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  sinRespuestaAun && (ticket.prioridad === 'urgente' || ticket.prioridad === 'alta')
                    ? 'border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  {/* Badges superiores */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      #{ticket.id.slice(-6).toUpperCase()}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                      {prio.label}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${est.badge}`}>
                      {est.label}
                    </span>

                    {ticket.tipo_servicio === 'remoto' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Laptop className="w-3 h-3" />
                        Remoto
                      </span>
                    )}
                    {ticket.tipo_servicio === 'domicilio' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <MapPin className="w-3 h-3" />
                        Domicilio
                      </span>
                    )}
                    {ticket.tipo_servicio === 'taller' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        <Wrench className="w-3 h-3" />
                        Taller
                      </span>
                    )}

                    {tieneOrden && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        <FileText className="w-3 h-3" />
                        Orden Generada
                      </span>
                    )}
                  </div>

                  {/* Título y descripción */}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {ticket.titulo}
                  </h3>

                  {ticket.descripcion && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {ticket.descripcion}
                    </p>
                  )}

                  {/* Cliente y SLA metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <User className="w-3 h-3 text-slate-400" />
                      {ticket.cliente?.nombre || 'Cliente sin nombre'}
                      {ticket.cliente?.empresa ? ` · ${ticket.cliente.empresa}` : ''}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span>Téc: {ticket.tecnico?.nombre || 'Sin asignar'}</span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Hace {formatElapsedTime(ticket.created_at)}
                    </span>

                    {sinRespuestaAun ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                        Sin 1ra respuesta
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Respondido
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones directas en fila */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTicketToConvert(ticket);
                      setIsConvertirOpen(true);
                    }}
                    className="text-xs h-7 px-2.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1"
                  >
                    <span>Convertir</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modales */}
      <TicketFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        ticketToEdit={ticketToEdit}
        onSaved={async () => {
          await loadData();
        }}
      />

      <TicketDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        ticket={selectedTicket}
        onEdit={(ticket) => {
          setTicketToEdit(ticket);
          setIsFormOpen(true);
        }}
        onDelete={async (id) => {
          await TicketsService.delete(id);
          await loadData();
        }}
        onOpenConvertir={(ticket) => {
          setTicketToConvert(ticket);
          setIsConvertirOpen(true);
        }}
        onUpdated={async () => {
          await loadData();
          if (selectedTicket) {
            const fresh = await TicketsService.getById(selectedTicket.id);
            setSelectedTicket(fresh);
          }
        }}
      />

      <ConvertirTicketModal
        isOpen={isConvertirOpen}
        onClose={() => setIsConvertirOpen(false)}
        ticket={ticketToConvert}
        onConverted={async () => {
          await loadData();
        }}
      />
    </div>
  );
};
