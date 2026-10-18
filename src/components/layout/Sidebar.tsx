import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Laptop,
  Calendar,
  TicketCheck,
  CircleDollarSign,
  Settings,
  Headphones,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function Sidebar() {
  const { isDueno, isRecepcion, isTecnico, canViewFinances } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    // Dashboard adaptativo según el rol
    {
      name: isDueno ? 'Dashboard General' : isTecnico ? 'Mi Panel Técnico' : 'Panel Recepción',
      to: '/',
      icon: LayoutDashboard,
    },

    // Órdenes (Todos)
    {
      name: 'Órdenes de Trabajo',
      to: '/ordenes',
      icon: ClipboardList,
    },
    // Nueva Orden
    {
      name: 'Nueva Orden',
      to: '/ordenes/nueva',
      icon: PlusCircle,
      highlight: true,
    },
    // Clientes (Dueño y Recepción principalmente)
    {
      name: 'Clientes',
      to: '/clientes',
      icon: Users,
    },
    // Equipos
    {
      name: 'Equipos en Sistema',
      to: '/equipos',
      icon: Laptop,
    },
    // Agenda / Calendario (Todos)
    {
      name: 'Agenda & Citas',
      to: '/agenda',
      icon: Calendar,
    },
    // Tickets de soporte (Todos)
    {
      name: 'Tickets de Soporte',
      to: '/tickets',
      icon: TicketCheck,
    },
    // Finanzas (Solo Dueño)
    ...(canViewFinances
      ? [
          {
            name: 'Finanzas & Gastos',
            to: '/finanzas',
            icon: CircleDollarSign,
          },
        ]
      : []),
    // Configuración (Solo Dueño)
    ...(isDueno
      ? [
          {
            name: 'Configuración',
            to: '/configuracion',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-darkBg-card border-r border-slate-200/80 dark:border-slate-800 transition-colors shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <img
          src="/logo.svg"
          alt="AX Network Logo"
          className="w-9 h-9 rounded-xl shadow-sm object-cover"
        />
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
            AX <span className="text-brand-500">NETWORK</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Solutions Group
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Módulos Operativos
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 shadow-sm'
                  : item.highlight
                  ? 'text-brand-600 dark:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Support Card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Soporte Técnico AX</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">+507 6911-0901</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
