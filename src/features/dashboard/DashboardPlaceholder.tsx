import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientesService, EquiposService } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Laptop,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function DashboardPlaceholder() {
  const { user, role, isDueno } = useAuth();
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalEquipos, setTotalEquipos] = useState(0);

  useEffect(() => {
    Promise.all([ClientesService.getAll(), EquiposService.getAll()]).then(([c, e]) => {
      setTotalClientes(c.length);
      setTotalEquipos(e.length);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-darkBg text-white shadow-elevated border border-slate-800">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Sistema de Control AX Network Solutions
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Bienvenido, {user?.nombre || 'Administrador'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Fase 1 completada exitosamente: Proyecto configurado, autenticación por roles, layout responsivo y gestión completa de Clientes y Equipos en Panamá.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to="/clientes">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-bold">
                <Users className="w-4 h-4 mr-1.5 text-brand-600" />
                Explorar Clientes ({totalClientes})
              </Button>
            </Link>
            <Link to="/equipos">
              <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold backdrop-blur-sm">
                <Laptop className="w-4 h-4 mr-1.5 text-brand-300" />
                Ver Equipos ({totalEquipos})
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:border-brand-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Directorio</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalClientes} Clientes</p>
              <Link to="/clientes" className="text-xs font-semibold text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline">
                Gestionar clientes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventario</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalEquipos} Equipos</p>
              <Link to="/equipos" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline">
                Ver hardware registrado <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Laptop className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seguridad y Roles</span>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                Rol: {role || 'Técnico'}
              </p>
              <span className="text-xs text-slate-400">
                {isDueno ? 'Acceso administrativo total' : 'Acceso operativo asignado'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Phases Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de Desarrollo por Fases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Fase 1: Proyecto, Login, Roles, Layout, Clientes y Equipos
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Completada al 100%. Módulos activos, formularios validados con Zod y modo interactivo.
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">Completada</Badge>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-brand-500 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Fase 2: Órdenes de Servicio (Asistente de ingreso, estados, Kanban, fotos, historial)
                </p>
                <p className="text-[11px] text-slate-400">
                  Siguiente fase a desarrollar con validación de presupuestos y ubicaciones.
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm">Siguiente</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
