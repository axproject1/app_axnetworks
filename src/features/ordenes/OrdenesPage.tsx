import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrdenesService, PerfilesService, UbicacionesService } from '@/lib/storage';
import { Orden, Perfil, Ubicacion, EstadoOrden, TipoServicio } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import {
  ESTADOS_ORDEN_CONFIG,
  PRIORIDAD_CONFIG,
  TIPO_SERVICIO_CONFIG,
  formatCurrency,
  formatDate,
} from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  ClipboardList,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Laptop,
} from 'lucide-react';

export function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tabla' | 'kanban'>('tabla');

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [tecnicoFilter, setTecnicoFilter] = useState<string>('todos');
  const [ubicacionFilter, setUbicacionFilter] = useState<string>('todos');
  const [servicioFilter, setServicioFilter] = useState<string>('todos');

  // Aux data
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const { isTecnico } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ords, tecs, ubis] = await Promise.all([
        OrdenesService.getAll(),
        PerfilesService.getTecnicos(),
        UbicacionesService.getAll(),
      ]);
      setOrdenes(ords);
      setTecnicos(tecs);
      setUbicaciones(ubis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredOrdenes = ordenes.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.numero.toLowerCase().includes(q) ||
      (o.cliente?.nombre && o.cliente.nombre.toLowerCase().includes(q)) ||
      (o.equipo?.serie && o.equipo.serie.toLowerCase().includes(q)) ||
      (o.equipo?.modelo && o.equipo.modelo.toLowerCase().includes(q));

    const matchesEstado = estadoFilter === 'todos' || o.estado === estadoFilter;
    const matchesTecnico = tecnicoFilter === 'todos' || o.tecnico_id === tecnicoFilter;
    const matchesUbicacion = ubicacionFilter === 'todos' || o.ubicacion_id === ubicacionFilter;
    const matchesServicio = servicioFilter === 'todos' || o.tipo_servicio === servicioFilter;

    return matchesSearch && matchesEstado && matchesTecnico && matchesUbicacion && matchesServicio;
  });

  const exportToCSV = () => {
    if (ordenes.length === 0) return;
    const headers = ['Numero', 'Cliente', 'Equipo', 'Serie', 'Estado', 'Prioridad', 'Servicio', 'Tecnico', 'Ubicacion', 'Fecha_Ingreso', 'Total', 'Saldo'];
    const rows = ordenes.map((o) => [
      o.numero,
      `"${(o.cliente?.nombre || '').replace(/"/g, '""')}"`,
      `"${(o.equipo?.tipo || '')} ${(o.equipo?.marca || '')}"`,
      `"${o.equipo?.serie || ''}"`,
      `"${o.estado}"`,
      `"${o.prioridad}"`,
      `"${o.tipo_servicio}"`,
      `"${o.tecnico?.nombre || ''}"`,
      `"${o.ubicacion?.nombre || ''}"`,
      `"${formatDate(o.fecha_ingreso)}"`,
      `"${o.totales?.total || 0}"`,
      `"${o.totales?.saldo || 0}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ordenes_ax_network_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kanbanColumns: EstadoOrden[] = [
    'recibido',
    'diagnostico',
    'espera_aprobacion',
    'espera_repuesto',
    'reparacion',
    'listo',
    'entregado',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Control de Órdenes de Servicio (OT)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de ingresos, diagnósticos, aprobaciones y entrega de equipos en taller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Vista Tabla / Kanban */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('tabla')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'tabla'
                  ? 'bg-white dark:bg-darkBg-card text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista en Tabla"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-darkBg-card text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista en Tablero Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            CSV
          </Button>

          <Link to="/ordenes/nueva">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Orden
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, número de orden (OT-2026-...) o serie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Filtros Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Estados</option>
              {Object.entries(ESTADOS_ORDEN_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <select
              value={tecnicoFilter}
              onChange={(e) => setTecnicoFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            <select
              value={ubicacionFilter}
              onChange={(e) => setUbicacionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todas las Ubicaciones</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>

            <select
              value={servicioFilter}
              onChange={(e) => setServicioFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todas las Modalidades</option>
              <option value="taller">Taller</option>
              <option value="domicilio">Domicilio</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* VISTA TABLA */}
      {viewMode === 'tabla' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">N.º Orden</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 hidden md:table-cell">Dispositivo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Técnico / Ubicación</th>
                  {!isTecnico && <th className="py-3 px-4 text-right">Saldo</th>}
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Cargando órdenes de trabajo...
                    </td>
                  </tr>
                ) : filteredOrdenes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No se encontraron órdenes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrdenes.map((o) => {
                    const estado = ESTADOS_ORDEN_CONFIG[o.estado];
                    const prioridad = PRIORIDAD_CONFIG[o.prioridad];

                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/ordenes/${o.id}`)}
                      >
                        {/* Número & Prioridad */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                              {o.numero}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${prioridad.dot}`} />
                              <span className="text-[10px] text-slate-400 capitalize">{o.prioridad}</span>
                            </div>
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{o.cliente?.nombre}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(o.fecha_ingreso)}
                          </p>
                        </td>

                        {/* Dispositivo */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {o.equipo?.tipo} · {o.equipo?.marca} {o.equipo?.modelo}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {o.equipo?.serie || 'S/N'}
                          </p>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${estado.bg} ${estado.text} ${estado.border}`}>
                            {estado.label}
                          </span>
                        </td>

                        {/* Técnico y Ubicación */}
                        <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {o.tecnico?.nombre || 'Sin asignar'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {o.ubicacion?.nombre || 'Recepción'}
                          </p>
                        </td>

                        {/* Saldo (solo no técnicos) */}
                        {!isTecnico && (
                          <td className="py-3.5 px-4 text-right font-mono">
                            <span className={`font-bold ${(o.totales?.saldo || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {formatCurrency(o.totales?.saldo || 0)}
                            </span>
                          </td>
                        )}

                        {/* Acción */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
                            Ver Detalle <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* VISTA TABLERO KANBAN */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {kanbanColumns.map((colEstado) => {
            const colCfg = ESTADOS_ORDEN_CONFIG[colEstado];
            const colOrders = filteredOrdenes.filter((o) => o.estado === colEstado);

            return (
              <div
                key={colEstado}
                className="w-72 shrink-0 bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-3 flex flex-col max-h-[75vh]"
              >
                {/* Header de Columna */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {colCfg.label}
                  </span>
                  <Badge variant="outline" size="sm">
                    {colOrders.length}
                  </Badge>
                </div>

                {/* Lista de Tarjetas */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colOrders.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed rounded-xl">
                      Sin órdenes
                    </div>
                  ) : (
                    colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => navigate(`/ordenes/${ord.id}`)}
                        className="p-3 bg-white dark:bg-darkBg-card rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-soft hover:border-brand-500/60 cursor-pointer transition-all space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {ord.numero}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${PRIORIDAD_CONFIG[ord.prioridad].color}`}>
                            {ord.prioridad}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {ord.cliente?.nombre}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {ord.equipo?.tipo} · {ord.equipo?.marca} {ord.equipo?.modelo}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t text-[10px] text-slate-400">
                          <span className="truncate max-w-[120px]">{ord.ubicacion?.nombre || 'Recepción'}</span>
                          {!isTecnico && (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(ord.totales?.saldo || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
