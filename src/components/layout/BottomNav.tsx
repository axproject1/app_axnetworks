import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardList,
  PlusCircle,
  Users,
  Calendar,
  Menu,
  X,
  LayoutDashboard,
  Laptop,
  TicketCheck,
  CircleDollarSign,
  Settings,
} from 'lucide-react';

export function BottomNav() {
  const { isDueno, canViewFinances } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    {
      name: 'Órdenes',
      to: '/ordenes',
      icon: ClipboardList,
    },
    {
      name: 'Clientes',
      to: '/clientes',
      icon: Users,
    },
    {
      name: 'Nueva',
      to: '/ordenes/nueva',
      icon: PlusCircle,
      isAction: true,
    },
    {
      name: 'Agenda',
      to: '/agenda',
      icon: Calendar,
    },
  ];

  const secondaryTabs = [
    { name: isDueno ? 'Dashboard' : 'Mi Panel', to: '/', icon: LayoutDashboard },
    { name: 'Equipos', to: '/equipos', icon: Laptop },
    { name: 'Tickets', to: '/tickets', icon: TicketCheck },
    ...(canViewFinances ? [{ name: 'Finanzas', to: '/finanzas', icon: CircleDollarSign }] : []),
    ...(isDueno ? [{ name: 'Configuración', to: '/configuracion', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Mobile Drawer for extra menu options */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white dark:bg-darkBg-card border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Más herramientas
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {secondaryTabs.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMoreMenu(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 rounded-2xl text-center text-xs font-semibold gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-darkBg-card/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 py-1 px-2 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {mainTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  tab.isAction
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : isActive
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`
              }
            >
              {tab.isAction ? (
                <div className="w-10 h-10 -mt-5 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <tab.icon className="w-6 h-6" />
                </div>
              ) : (
                <tab.icon className="w-5 h-5" />
              )}
              <span className={`text-[10px] mt-1 ${tab.isAction ? 'font-bold' : ''}`}>
                {tab.name}
              </span>
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 dark:text-slate-500 transition-colors ${
              showMoreMenu ? 'text-brand-600 dark:text-brand-400' : ''
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
