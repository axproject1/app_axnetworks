import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FinanzasService, GastosService, PagosService } from '@/lib/storage';
import { Gasto, Pago } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cleanWhatsAppNumber,
  CATEGORIA_GASTO_CONFIG,
  METODO_PAGO_CONFIG,
} from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { GastoFormModal } from './GastoFormModal';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  MessageCircle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  PieChart,
  BarChart3,
  ShieldAlert,
  Building,
} from 'lucide-react';

export function FinanzasPage() {
  const { isDueno, user } = useAuth();

  // Estados de datos
  const [resumen, setResumen] = useState<any | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [activeTab, setActiveTab] = useState<'gastos' | 'cuentas' | 'pagos'>('gastos');
  const [periodo, setPeriodo] = useState<'mes' | '30dias' | 'anio' | 'todos'>('mes');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [selectedGastoToEdit, setSelectedGastoToEdit] = useState<Gasto | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, gstList, pgsList] = await Promise.all([
        FinanzasService.getResumenCompleto(),
        GastosService.getAll(),
        PagosService.getAll(),
      ]);
      setResumen(res);
      setGastos(gstList);
      setPagos(pgsList);
    } catch (err) {
      console.error('Error cargando finanzas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guard de rol: Solo el dueño puede ver finanzas
  if (!isDueno) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center bg-white dark:bg-darkCard rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Acceso Restringido a Finanzas
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          El módulo de contabilidad, gastos y reportes financieros es de visualización exclusiva para el rol de <strong>Dueño / Administrador</strong> de AX Network Solutions.
        </p>
        <Link to="/ordenes">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold">
            Volver a Órdenes de Trabajo
          </Button>
        </Link>
      </div>
    );
  }

  // Filtrado de gastos por búsqueda y categoría
  const filteredGastos = gastos.filter((g) => {
    const matchesCat = categoriaFilter === 'todos' || g.categoria === categoriaFilter;
    const matchesSearch =
      g.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.orden?.numero && g.orden.numero.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.orden?.cliente?.nombre && g.orden.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtrado de pagos
  const filteredPagos = pagos.filter((p) => {
    return (
      (p.referencia && p.referencia.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.orden?.numero && p.orden.numero.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.orden?.cliente?.nombre && p.orden.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.nota && p.nota.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDeleteGasto = async (id: string, concepto: string) => {
    if (confirm(`¿Estás seguro de eliminar el registro de gasto "${concepto}"?`)) {
      await GastosService.delete(id);
      await loadData();
    }
  };

  const handleOpenWhatsAppCobro = (item: any) => {
    const cleanPhone = cleanWhatsAppNumber(item.whatsapp || item.telefono);
    if (!cleanPhone) {
      alert('Este cliente no tiene un número telefónico registrado.');
      return;
    }

    const mensaje = `Hola ${item.cliente}, le saludamos de AX Network Solutions Group. Le escribimos con respecto a su orden de servicio ${item.numero} que presenta un saldo pendiente de $${item.saldo.toFixed(2)}. ¿Desea efectuar el pago mediante Yappy Comercial o transferencia ACH? Quedamos a su completa disposición.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 text-xs font-semibold mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Control Financiero y Contabilidad Interna
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Finanzas y Control de Gastos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Resumen en tiempo real de ingresos cobrados, compras de repuestos, costos de taller y cuentas por cobrar en Panamá.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedGastoToEdit(null);
              setIsGastoModalOpen(true);
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Gasto
          </Button>
        </div>
      </div>

      {/* 4 KPIs Financieros Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos Cobrados */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ingresos Cobrados
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(resumen?.ingresosTotales || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              <span>{resumen?.pagosCount || 0} abonos / pagos registrados</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Gastos Totales */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gastos del Taller
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(resumen?.gastosTotales || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{resumen?.gastosCount || 0} compras y egresos</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Utilidad Neta */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Utilidad Neta
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                (resumen?.utilidadNeta || 0) >= 0
                  ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}>
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              (resumen?.utilidadNeta || 0) >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(resumen?.utilidadNeta || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                (resumen?.margenUtilidad || 0) >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                {(resumen?.margenUtilidad || 0).toFixed(1)}% Margen
              </span>
              <span className="text-slate-400 text-[11px]">sobre ingresos</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Cuentas por Cobrar */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cuentas por Cobrar
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(resumen?.totalCuentasPorCobrar || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{resumen?.cuentasPorCobrarLista?.length || 0} órdenes con saldo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección Gráfica y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Gastos por Categoría */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-600" />
              Distribución de Gastos por Categoría
            </CardTitle>
            <span className="text-xs font-semibold text-slate-500">
              Total: {formatCurrency(resumen?.gastosTotales || 0)}
            </span>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {resumen?.gastosPorCategoria && resumen.gastosPorCategoria.length > 0 ? (
              resumen.gastosPorCategoria.map((cat: any) => {
                const conf = CATEGORIA_GASTO_CONFIG[cat.categoria] || CATEGORIA_GASTO_CONFIG.otros;
                return (
                  <div key={cat.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: conf.color }}
                        />
                        {conf.label}
                        <span className="text-slate-400 font-normal">({cat.count} compras)</span>
                      </span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatCurrency(cat.total)} ({cat.porcentaje.toFixed(1)}%)
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, cat.porcentaje)}%`,
                          backgroundColor: conf.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aún no hay gastos registrados para este período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Flujo de Caja Comparativo Mensual */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Flujo de Caja: Ingresos vs Egresos
            </CardTitle>
            <span className="text-xs text-slate-400">Historial Reciente</span>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {resumen?.flujoMensual && resumen.flujoMensual.length > 0 ? (
              resumen.flujoMensual.map((item: any) => {
                const maxVal = Math.max(item.ingresos, item.gastos, 1);
                const pctIngresos = Math.min(100, (item.ingresos / maxVal) * 100);
                const pctGastos = Math.min(100, (item.gastos / maxVal) * 100);

                return (
                  <div key={item.mes} className="p-3 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {item.mes}
                      </span>
                      <span className={`font-extrabold ${item.utilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        Utilidad: {formatCurrency(item.utilidad)}
                      </span>
                    </div>

                    {/* Barra Ingresos */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Ingresos</span>
                        <span>{formatCurrency(item.ingresos)}</span>
                      </div>
                      <div className="w-full bg-slate-200/70 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${pctIngresos}%` }}
                        />
                      </div>
                    </div>

                    {/* Barra Gastos */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        <span>Gastos</span>
                        <span>{formatCurrency(item.gastos)}</span>
                      </div>
                      <div className="w-full bg-slate-200/70 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${pctGastos}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Sin movimientos registrados aún.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('gastos')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'gastos'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          Registro de Gastos ({filteredGastos.length})
        </button>

        <button
          onClick={() => setActiveTab('cuentas')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'cuentas'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cuentas por Cobrar ({resumen?.cuentasPorCobrarLista?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('pagos')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pagos'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Historial de Cobros ({filteredPagos.length})
        </button>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'gastos' && (
        <div className="space-y-4">
          {/* Barra de Filtros para Gastos */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Buscar por concepto, orden OT o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            {/* Categorías Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCategoriaFilter('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  categoriaFilter === 'todos'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {Object.entries(CATEGORIA_GASTO_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setCategoriaFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    categoriaFilter === key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Gastos */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-darkBg/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto / Detalle</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Orden Vinculada</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredGastos.length > 0 ? (
                    filteredGastos.map((g) => {
                      const conf = CATEGORIA_GASTO_CONFIG[g.categoria || 'otros'] || CATEGORIA_GASTO_CONFIG.otros;
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {formatDate(g.fecha)}
                          </td>
                          <td className="py-3 px-4 max-w-xs sm:max-w-md">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-2">
                              {g.concepto}
                            </div>
                            {g.registrador && (
                              <div className="text-[11px] text-slate-400">
                                Por: {g.registrador.nombre}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={`${conf.badge} border text-[11px]`}>
                              {conf.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {g.orden ? (
                              <Link
                                to={`/ordenes/${g.orden_id}`}
                                className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 hover:underline"
                              >
                                {g.orden.numero}
                                <span className="text-[11px] font-normal text-slate-500">
                                  ({g.orden.cliente?.nombre})
                                </span>
                              </Link>
                            ) : (
                              <span className="text-slate-400 text-[11px]">General (Stock/Taller)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatCurrency(g.monto)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedGastoToEdit(g);
                                  setIsGastoModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors"
                                title="Editar Gasto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGasto(g.id, g.concepto)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors"
                                title="Eliminar Registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron registros de gastos coincidentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Pestaña: Cuentas por Cobrar */}
      {activeTab === 'cuentas' && (
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Clientes con Saldo Pendiente (Cuentas por Cobrar)
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Órdenes activas con saldo pendiente de pago. Envía recordatorios directos por WhatsApp con un solo clic.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Total Pendiente</span>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency(resumen?.totalCuentasPorCobrar || 0)}
                </span>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-darkBg/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Orden</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Ingreso</th>
                    <th className="py-3 px-4 text-right">Total Facturado</th>
                    <th className="py-3 px-4 text-right">Abonado</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Acción Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {resumen?.cuentasPorCobrarLista && resumen.cuentasPorCobrarLista.length > 0 ? (
                    resumen.cuentasPorCobrarLista.map((item: any) => (
                      <tr key={item.orden_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Link
                            to={`/ordenes/${item.orden_id}`}
                            className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            {item.numero}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.cliente}
                          </div>
                          {item.whatsapp && (
                            <div className="text-[11px] text-slate-400">
                              WA: +{item.whatsapp}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {formatDate(item.fecha_ingreso)}
                          <span className="block text-[10px] text-slate-400">
                            Hace {item.dias_transcurridos} días
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.pagado)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-sm text-amber-600 dark:text-amber-400">
                          {formatCurrency(item.saldo)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => handleOpenWhatsAppCobro(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            Recordar Saldo
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        ¡Excelente! No hay clientes con cuentas por cobrar pendientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Pestaña: Historial de Cobros */}
      {activeTab === 'pagos' && (
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-darkBg/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Orden de Trabajo</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Referencia / Comprobante</th>
                    <th className="py-3 px-4 text-right">Monto Cobrado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredPagos.length > 0 ? (
                    filteredPagos.map((p) => {
                      const metodoLabel = METODO_PAGO_CONFIG[p.metodo]?.label || p.metodo;
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            p.anulado ? 'opacity-60 bg-slate-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {formatDateTime(p.fecha)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Link
                              to={`/ordenes/${p.orden_id}`}
                              className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
                            >
                              {p.orden?.numero || 'OT'}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">
                            {p.orden?.cliente?.nombre || 'Cliente'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px]">
                              {metodoLabel}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {p.referencia || '—'}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.monto)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {p.anulado ? (
                              <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px]">
                                Anulado
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                                Válido
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No hay registros de cobros coincidentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Registrar o Editar Gasto */}
      <GastoFormModal
        isOpen={isGastoModalOpen}
        onClose={() => {
          setIsGastoModalOpen(false);
          setSelectedGastoToEdit(null);
        }}
        gastoToEdit={selectedGastoToEdit}
        onSuccess={loadData}
      />
    </div>
  );
}
