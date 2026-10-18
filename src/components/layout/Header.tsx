import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, LogOut, User, Search, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ROL_CONFIG } from '@/lib/formatters';
import { QRScannerModal } from './QRScannerModal';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);

  const roleInfo = role ? ROL_CONFIG[role] : null;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-darkBg-card/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: Mobile Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex md:hidden items-center gap-2">
            <img
              src="https://axnetworksolutions.vercel.app/img/logo-fondo.webp"
              alt="AX Network"
              className="w-8 h-8 rounded-lg shadow-sm"
            />
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              AX <span className="text-brand-500">NETWORK</span>
            </span>
          </div>
        </div>

        {/* Center: Quick Search Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Buscar orden, cliente o serie...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Theme toggle, User badge, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="p-2 md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* QR Scanner Shortcut Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Escanear código QR o buscar orden rápida"
            aria-label="Escanear QR"
          >
            <QrCode className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* User profile capsule */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
              {user?.nombre?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[140px]">
                {user?.nombre || 'Personal'}
              </p>
              {role && (
                <Badge variant="outline" size="sm" className="mt-0.5 text-[10px] py-0 px-1.5">
                  {roleInfo?.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Lector de QR / Búsqueda Rápida */}
      <QRScannerModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </header>
  );
}
