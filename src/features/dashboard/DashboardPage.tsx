import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardService } from '@/lib/storage';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cleanWhatsAppNumber,
  ESTADOS_ORDEN_CONFIG,
  TIPO_SERVICIO_CONFIG,
  PRIORIDAD_CONFIG,
} from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Wrench,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Plus,
  MessageCircle,
  MapPin,
  Wifi,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileText,
  Activity,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';

export function DashboardPage() {
  const { user, role, isDueno, isTecnico, isRecepcion } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const data = await DashboardService.getMetrics(role || 'dueno', user?.id);
        setMetrics(data);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [role, user?.id]);

  const todayStr = new Intl.DateTimeFormat('es-PA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Formato para recordatorio de retiro por WhatsApp (Recepción)
  const handleAvisarRetiroWhatsApp = (orden: any) => {
    const cleanPhone = cleanWhatsAppNumber(orden.cliente?.whatsapp || orden.cliente?.telefono);
    if (!cleanPhone) {
      alert('El cliente no tiene un teléfono registrado.');
      return;
    }
    const msg = `Hola ${orden.cliente?.nombre}, le saludamos de AX Network Solutions. Le informamos con gusto que su equipo (${orden.equipo?.tipo || 'equipo'} ${orden.equipo?.marca || ''}) de la orden ${orden.numero} se encuentra completamente listo para entrega y retiro en nuestro taller. ¡Quedamos atentos a su visita!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Formato WhatsApp para cita de hoy (Técnico / Dueño)
  const handleAvisarCitaWhatsApp = (cita: any) => {
    const cleanPhone = cleanWhatsAppNumber(cita.cliente?.whatsapp || cita.cliente?.telefono);
    if (!cleanPhone) {
      alert('El cliente no tiene teléfono registrado.');
      return;
    }
    const hora = new Date(cita.inicio).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = `Hola ${cita.cliente?.nombre}, le saluda su técnico de AX Network Solutions. Le confirmo que hoy a las ${hora} tenemos agendada su atención de servicio (${cita.titulo}). En breve estaremos en contacto.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida Adaptativo */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-darkBg text-white shadow-elevated border border-slate-800">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold backdrop-blur-md border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              AX Network Solutions · Panel Operativo
            </span>
            <span className="text-xs text-slate-400 capitalize">
              {todayStr}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bienvenido, {user?.nombre || 'Administrador'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isDueno && 'Resumen integral de operaciones técnicas, balance de facturación del mes, flujo de ingresos y control de inventario en taller.'}
            {isTecnico && 'Panel técnico personalizado. Revisa tu agenda para hoy, tus órdenes asignadas en diagnóstico y los checklists pendientes de reparación.'}
            {isRecepcion && 'Control de recepción y entrega de equipos. Supervisa clientes en espera, citas agendadas y avisos de equipos listos para retiro.'}
          </p>

          {/* Botones de Acción Rápida */}
          <div className="pt-3 flex flex-wrap items-center gap-2.5">
            <Link to="/ordenes/nueva">
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Nueva Orden de Servicio
              </Button>
            </Link>
            <Link to="/agenda">
              <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold backdrop-blur-sm">
                <Calendar className="w-4 h-4 mr-1.5 text-brand-300" />
                Ver Agenda de Citas
              </Button>
            </Link>
            {isDueno && (
              <Link to="/finanzas">
                <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 mr-1.5 text-emerald-300" />
                  Módulo de Finanzas
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Gradiente decorativo de fondo */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* =================================================================== */}
      {/* VISTA DEL DUEÑO / ADMINISTRADOR                                      */}
      {/* =================================================================== */}
      {isDueno && (
        <>
          {/* 4 KPIs de Alto Nivel (Operacionales + Financieros) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Facturación / Ingresos del Mes */}
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
                  {formatCurrency(metrics?.finanzas?.ingresosTotales || 0)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {metrics?.finanzas?.pagosCount || 0} cobros realizados
                  </span>
                  <Link to="/finanzas" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                    Detalles <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 2. Utilidad Neta */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Utilidad Neta
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight">
                  {formatCurrency(metrics?.finanzas?.utilidadNeta || 0)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
                    +{(metrics?.finanzas?.margenUtilidad || 0).toFixed(1)}% margen
                  </span>
                  <span className="text-slate-400">libre</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Órdenes Activas en Taller */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Órdenes en Curso
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {metrics?.ordenesActivasCount || 0}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {metrics?.citasHoyCount || 0} visitas agendadas hoy
                  </span>
                  <Link to="/ordenes" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                    Ver Kanban <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 4. Equipos Atrasados o Cuentas por Cobrar */}
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
                  {formatCurrency(metrics?.finanzas?.totalCuentasPorCobrar || 0)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {metrics?.finanzas?.cuentasPorCobrarLista?.length || 0} órdenes pendientes
                  </span>
                  <Link to="/finanzas" className="font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                    Cobrar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas / Desglose de Estado y Productividad Técnica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* V_EQUIPOS_POR_ESTADO */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  Distribución de Equipos en Proceso (SQL: v_equipos_por_estado)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {metrics?.estadosCount && Object.keys(metrics.estadosCount).length > 0 ? (
                  Object.entries(metrics.estadosCount).map(([st, count]: any) => {
                    const conf = (ESTADOS_ORDEN_CONFIG as any)[st] || { label: st, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
                    return (
                      <div key={st} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-darkBg/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Badge className={`${conf.bg} ${conf.text} ${conf.border} border text-xs`}>
                            {conf.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {count}
                          </span>
                          <span className="text-xs text-slate-400">equipos</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No hay equipos activos en el taller en este momento.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* V_EQUIPOS_POR_TECNICO */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Carga de Trabajo por Técnico (SQL: v_equipos_por_tecnico)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {metrics?.tecnicosCount && Object.keys(metrics.tecnicosCount).length > 0 ? (
                  Object.entries(metrics.tecnicosCount).map(([tec, count]: any) => (
                    <div key={tec} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-darkBg/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                          {tec.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tec}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {count}
                        </span>
                        <span className="text-xs text-slate-400">órdenes asignadas</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Sin asignaciones activas registradas.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Citas de Hoy y Equipos Atrasados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Citas de Hoy */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Agenda de Citas y Visitas para Hoy ({metrics?.citasHoy?.length || 0})
                </CardTitle>
                <Link to="/agenda">
                  <Button size="sm" variant="ghost" className="text-xs font-semibold text-brand-600">
                    Ver Calendario
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {metrics?.citasHoy && metrics.citasHoy.length > 0 ? (
                  metrics.citasHoy.map((cita: any) => {
                    const horaInicio = new Date(cita.inicio).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const horaFin = new Date(cita.fin).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <div key={cita.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400">
                              {horaInicio} - {horaFin}
                            </span>
                            <Badge className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {cita.tipo_servicio.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {cita.titulo}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Cliente: {cita.cliente?.nombre || 'Cliente'}</span>
                            {cita.direccion && <span>• {cita.direccion}</span>}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAvisarCitaWhatsApp(cita)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5 shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No hay citas programadas para el día de hoy.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Equipos Atrasados (v_equipos_atrasados) */}
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Equipos que Requieren Atención (v_equipos_atrasados)
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs">
                  {metrics?.ordenesAtrasadasCount || 0} pendientes
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {metrics?.ordenesAtrasadas && metrics.ordenesAtrasadas.length > 0 ? (
                  metrics.ordenesAtrasadas.map((ord: any) => {
                    const dias = Math.floor((Date.now() - new Date(ord.fecha_ingreso).getTime()) / 86400000);
                    return (
                      <div key={ord.id} className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link to={`/ordenes/${ord.id}`} className="font-extrabold text-xs text-brand-600 hover:underline">
                              {ord.numero}
                            </Link>
                            <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                              {dias} días en taller
                            </Badge>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {ord.cliente?.nombre} ({ord.equipo?.tipo})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Estado: {ord.estado} • Estimada: {ord.fecha_estimada ? formatDate(ord.fecha_estimada) : 'Sin estimación'}
                          </div>
                        </div>

                        <Link to={`/ordenes/${ord.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 font-semibold border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300">
                            Revisar
                          </Button>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    ¡Excelente! No hay equipos con retraso o fechas estimadas vencidas.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* VISTA DEL TÉCNICO (PROTECCIÓN ESTRICTA: CERO MONTOS O FINANZAS)      */}
      {/* =================================================================== */}
      {isTecnico && (
        <>
          {/* 4 KPIs Técnicos (Sin montos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mis Órdenes Asignadas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600">
                    <Laptop className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.misOrdenesActivasCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Equipos en proceso bajo tu responsabilidad
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    En Reparación Activa
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600">
                    <Wrench className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                  {metrics?.misOrdenesReparacionCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Con presupuesto aprobado por cliente
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Listas para Entrega
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics?.misOrdenesListasCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Trabajo técnico concluido
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mis Citas de Hoy
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {metrics?.misCitasHoyCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Atenciones programadas para hoy
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agenda del Técnico para Hoy */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                Mi Hoja de Ruta de Hoy ({metrics?.misCitasHoy?.length || 0} Citas)
              </CardTitle>
              <Link to="/agenda">
                <Button size="sm" variant="ghost" className="text-xs font-semibold text-brand-600">
                  Ver Todo
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {metrics?.misCitasHoy && metrics.misCitasHoy.length > 0 ? (
                metrics.misCitasHoy.map((cita: any) => {
                  const horaInicio = new Date(cita.inicio).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const horaFin = new Date(cita.fin).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
                  return (
                    <div key={cita.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400">
                            {horaInicio} - {horaFin}
                          </span>
                          <Badge className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {cita.tipo_servicio.toUpperCase()}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cita.titulo}
                        </h4>
                        <div className="text-xs text-slate-500">
                          Cliente: <strong>{cita.cliente?.nombre}</strong>
                          {cita.direccion && ` • Dirección: ${cita.direccion}`}
                          {cita.enlace_remoto && ` • Conexión: ${cita.enlace_remoto}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cita.direccion && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(cita.direccion)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            GPS
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleAvisarCitaWhatsApp(cita)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No tienes citas asignadas para hoy. Revisa el tablero de órdenes activas.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mis Órdenes Asignadas Activas */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-600" />
                Mis Órdenes en Proceso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {metrics?.misOrdenesActivas && metrics.misOrdenesActivas.length > 0 ? (
                metrics.misOrdenesActivas.map((ord: any) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/ordenes/${ord.id}`} className="font-extrabold text-xs text-brand-600 hover:underline">
                          {ord.numero}
                        </Link>
                        <Badge className="text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {ord.estado}
                        </Badge>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {ord.cliente?.nombre} — {ord.equipo?.tipo} ({ord.equipo?.marca} {ord.equipo?.modelo})
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        Falla: {ord.falla_reportada || 'Sin falla especificada'}
                      </div>
                    </div>

                    <Link to={`/ordenes/${ord.id}`}>
                      <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs h-8 px-3">
                        Diagnosticar / Reparar
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No tienes órdenes activas asignadas.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* =================================================================== */}
      {/* VISTA DE RECEPCIÓN                                                  */}
      {/* =================================================================== */}
      {isRecepcion && (
        <>
          {/* 4 KPIs de Recepción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Equipos Recibidos Hoy
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                    <Laptop className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.recibidosHoyCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Ingresos nuevos en el día
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Listos para Retiro
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics?.listosParaEntregarCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Clientes listos para avisar y entregar
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Citas de Hoy en Local
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {metrics?.citasTallerHoyCount || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Atenciones en mostrador
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cobrado Hoy en Caja
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(metrics?.montoCobradoHoy || 0)}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Cobros y abonos recibidos hoy
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipos Listos para Entregar */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkCard shadow-card">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Equipos Listos para Notificar y Entregar ({metrics?.equiposListosParaEntregar?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {metrics?.equiposListosParaEntregar && metrics.equiposListosParaEntregar.length > 0 ? (
                metrics.equiposListosParaEntregar.map((ord: any) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/ordenes/${ord.id}`} className="font-extrabold text-xs text-brand-600 hover:underline">
                          {ord.numero}
                        </Link>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                          LISTO P/ RETIRO
                        </Badge>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {ord.cliente?.nombre} ({ord.equipo?.tipo} - {ord.equipo?.marca})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ord.cliente?.telefono ? `Tel: ${ord.cliente.telefono}` : 'Sin teléfono'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAvisarRetiroWhatsApp(ord)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                        Avisar Retiro
                      </Button>
                      <Link to={`/ordenes/${ord.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 font-semibold">
                          Entregar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No hay equipos en estado "Listo" pendientes de retiro.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
