import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EquiposService } from '@/lib/storage';
import { Equipo } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EquipoFormModal } from './EquipoFormModal';
import { EquipoDetailModal } from './EquipoDetailModal';
import {
  Laptop,
  Plus,
  Search,
  Tag,
  Cpu,
  User,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  Filter,
} from 'lucide-react';

export function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [equipoToEdit, setEquipoToEdit] = useState<Equipo | null>(null);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const loadEquipos = async () => {
    try {
      setLoading(true);
      const data = await EquiposService.getAll();
      setEquipos(data);

      const urlId = searchParams.get('id');
      if (urlId) {
        const found = data.find((e) => e.id === urlId);
        if (found) {
          setSelectedEquipo(found);
          setIsDetailOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipos();
  }, [searchParams]);

  const handleDelete = async (id: string, modelo: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el equipo "${modelo}"?`)) {
      return;
    }
    try {
      await EquiposService.delete(id);
      setEquipos((prev) => prev.filter((e) => e.id !== id));
      setFeedbackMsg({ text: 'Equipo eliminado correctamente', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'No se pudo eliminar el equipo', type: 'error' });
    }
  };

  const exportToCSV = () => {
    if (equipos.length === 0) return;
    const headers = ['ID', 'Cliente', 'Tipo', 'Marca', 'Modelo', 'Serie', 'CPU', 'RAM', 'Disco', 'SO'];
    const rows = equipos.map((e) => [
      e.id,
      `"${(e.cliente?.nombre || '').replace(/"/g, '""')}"`,
      `"${e.tipo}"`,
      `"${e.marca || ''}"`,
      `"${e.modelo || ''}"`,
      `"${e.serie || ''}"`,
      `"${e.procesador || ''}"`,
      `"${e.ram || ''}"`,
      `"${e.almacenamiento || ''}"`,
      `"${e.sistema_operativo || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `equipos_ax_network_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEquipos = equipos.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.tipo.toLowerCase().includes(q) ||
      (e.marca && e.marca.toLowerCase().includes(q)) ||
      (e.modelo && e.modelo.toLowerCase().includes(q)) ||
      (e.serie && e.serie.toLowerCase().includes(q)) ||
      (e.cliente?.nombre && e.cliente.nombre.toLowerCase().includes(q));

    const matchesType =
      typeFilter === 'todos' ||
      e.tipo.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Laptop className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Control de Equipos y Dispositivos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inventario técnico, especificaciones de hardware y número de serie por cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Exportar CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEquipoToEdit(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Equipo
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Summary Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Equipos</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{equipos.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Laptops / Mac</span>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {equipos.filter((e) => e.tipo.toLowerCase().includes('laptop') || e.tipo.toLowerCase().includes('mac')).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Torres / PC</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {equipos.filter((e) => e.tipo.toLowerCase().includes('pc') || e.tipo.toLowerCase().includes('torre')).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Redes & Servidores</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {equipos.filter((e) => e.tipo.toLowerCase().includes('router') || e.tipo.toLowerCase().includes('servidor')).length}
          </p>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número de serie, modelo, marca o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'laptop', label: 'Laptops' },
              { id: 'pc', label: 'PCs' },
              { id: 'router', label: 'Redes' },
              { id: 'servidor', label: 'Servidores' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTypeFilter(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  typeFilter === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 sm:px-6">Dispositivo & Modelo</th>
                <th className="py-3 px-4">Número de Serie</th>
                <th className="py-3 px-4 hidden md:table-cell">Cliente Propietario</th>
                <th className="py-3 px-4 hidden lg:table-cell">Hardware (CPU / RAM)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Cargando inventario de equipos...
                  </td>
                </tr>
              ) : filteredEquipos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {search || typeFilter !== 'todos'
                      ? 'No se encontraron equipos con los filtros seleccionados.'
                      : 'No hay equipos registrados aún.'}
                  </td>
                </tr>
              ) : (
                filteredEquipos.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedEquipo(e);
                      setIsDetailOpen(true);
                    }}
                  >
                    {/* Dispositivo y Modelo */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {e.tipo}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {e.marca} {e.modelo}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Número de Serie */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                        {e.serie || 'S/N'}
                      </span>
                    </td>

                    {/* Cliente Propietario */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      {e.cliente ? (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{e.cliente.nombre}</p>
                          <p className="text-[11px] text-slate-400">{e.cliente.empresa || e.cliente.telefono}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No asignado</span>
                      )}
                    </td>

                    {/* Hardware */}
                    <td className="py-3 px-4 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                      {[e.procesador, e.ram, e.almacenamiento].filter(Boolean).join(' · ') || '—'}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedEquipo(e);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                          title="Ver ficha técnica"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEquipoToEdit(e);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id, `${e.marca || ''} ${e.modelo || e.tipo}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Formulario Equipo */}
      <EquipoFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEquipoToEdit(null);
        }}
        equipoToEdit={equipoToEdit}
        onSuccess={() => {
          loadEquipos();
          setFeedbackMsg({ text: 'Equipo guardado correctamente', type: 'success' });
        }}
      />

      {/* Modal Ficha Detalle Equipo */}
      <EquipoDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEquipo(null);
          searchParams.delete('id');
          setSearchParams(searchParams);
        }}
        equipo={selectedEquipo}
        onEdit={(eq) => {
          setEquipoToEdit(eq);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
