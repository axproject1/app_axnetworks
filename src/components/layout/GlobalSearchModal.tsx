import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Laptop, ClipboardList, ArrowRight } from 'lucide-react';
import { ClientesService, EquiposService } from '@/lib/storage';
import { Cliente, Equipo } from '@/types/database';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setLoading(true);
      Promise.all([ClientesService.getAll(), EquiposService.getAll()])
        .then(([c, e]) => {
          setClientes(c);
          setEquipos(e);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredClientes = q
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.empresa && c.empresa.toLowerCase().includes(q)) ||
          (c.telefono && c.telefono.includes(q))
      )
    : [];

  const filteredEquipos = q
    ? equipos.filter(
        (e) =>
          (e.serie && e.serie.toLowerCase().includes(q)) ||
          (e.modelo && e.modelo.toLowerCase().includes(q)) ||
          (e.marca && e.marca.toLowerCase().includes(q)) ||
          e.tipo.toLowerCase().includes(q)
      )
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-xl bg-white dark:bg-darkBg-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Input bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, serie, equipo o número de orden..."
            className="w-full py-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="p-8 text-center text-xs text-slate-400">Cargando base de datos...</div>
          )}

          {!loading && q && filteredClientes.length === 0 && filteredEquipos.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron coincidencias para &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !q && (
            <div className="p-6 text-center text-xs text-slate-400">
              Escribe el nombre de un cliente, número de serie o modelo para buscar rápidamente.
            </div>
          )}

          {/* Clientes */}
          {filteredClientes.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Clientes ({filteredClientes.length})
              </p>
              {filteredClientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(`/clientes?id=${c.id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300 rounded-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.nombre}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.empresa ? `${c.empresa} · ` : ''}
                        {c.telefono || c.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Equipos */}
          {filteredEquipos.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Equipos ({filteredEquipos.length})
              </p>
              {filteredEquipos.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleSelect(`/equipos?id=${e.id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {e.tipo} · {e.marca} {e.modelo}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        Serie: {e.serie || 'S/N'} {e.cliente ? `· Cliente: ${e.cliente.nombre}` : ''}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
