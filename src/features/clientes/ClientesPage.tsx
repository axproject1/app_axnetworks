import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClientesService } from '@/lib/storage';
import { Cliente } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { formatPanamaPhone, cleanWhatsAppNumber, formatDate } from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ClienteFormModal } from './ClienteFormModal';
import { ClienteDetailModal } from './ClienteDetailModal';
import { EquipoFormModal } from '@/features/equipos/EquipoFormModal';
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Equipo modal state (para agregar desde la ficha del cliente)
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [selectedClienteIdForEquipo, setSelectedClienteIdForEquipo] = useState<string | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const { canManageClients } = useAuth();

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await ClientesService.getAll();
      setClientes(data);

      // Si viene un id por URL (?id=cli-001)
      const urlId = searchParams.get('id');
      if (urlId) {
        const found = data.find((c) => c.id === urlId);
        if (found) {
          setSelectedCliente(found);
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
    loadClientes();
  }, [searchParams]);

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (clienteToEdit) {
        const updated = await ClientesService.update(clienteToEdit.id, formData);
        setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setFeedbackMsg({ text: 'Cliente actualizado exitosamente', type: 'success' });
      } else {
        const created = await ClientesService.create(formData);
        setClientes((prev) => [created, ...prev]);
        setFeedbackMsg({ text: 'Cliente registrado exitosamente', type: 'success' });
      }
      setIsFormOpen(false);
      setClienteToEdit(null);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al guardar cliente', type: 'error' });
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"?`)) {
      return;
    }
    try {
      await ClientesService.delete(id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
      setFeedbackMsg({ text: 'Cliente eliminado correctamente', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'No se pudo eliminar el cliente', type: 'error' });
    }
  };

  const exportToCSV = () => {
    if (clientes.length === 0) return;
    const headers = ['ID', 'Nombre', 'Empresa', 'Telefono', 'WhatsApp', 'Email', 'Direccion', 'Fecha_Registro'];
    const rows = clientes.map((c) => [
      c.id,
      `"${c.nombre.replace(/"/g, '""')}"`,
      `"${(c.empresa || '').replace(/"/g, '""')}"`,
      `"${c.telefono || ''}"`,
      `"${c.whatsapp || ''}"`,
      `"${c.email || ''}"`,
      `"${(c.direccion || '').replace(/"/g, '""')}"`,
      `"${formatDate(c.created_at)}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_ax_network_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.empresa && c.empresa.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión centralizada de contactos, empresas, historiales y equipos en Panamá.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} title="Descargar reporte en formato CSV">
            <Download className="w-4 h-4 mr-1.5" />
            Exportar CSV
          </Button>

          {canManageClients && (
            <Button
              size="sm"
              onClick={() => {
                setClienteToEdit(null);
                setIsFormOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Nuevo Cliente
            </Button>
          )}
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

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clientes</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{clientes.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Corporativos</span>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {clientes.filter((c) => c.empresa).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Con WhatsApp</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {clientes.filter((c) => c.whatsapp || c.telefono).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En la Ciudad</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {clientes.filter((c) => c.direccion).length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Input
              placeholder="Buscar cliente por nombre, empresa, teléfono o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table / List Container */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 sm:px-6">Cliente / Razón Social</th>
                <th className="py-3 px-4 hidden sm:table-cell">Empresa</th>
                <th className="py-3 px-4">Contacto (PA)</th>
                <th className="py-3 px-4 hidden md:table-cell">Dirección</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Cargando directorio de clientes...
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {search ? 'No se encontraron clientes con ese criterio de búsqueda.' : 'No hay clientes registrados aún.'}
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => {
                  const waNumber = cleanWhatsAppNumber(c.whatsapp || c.telefono);
                  const waUrl = waNumber ? `https://wa.me/${waNumber}` : null;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedCliente(c);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Nombre & avatar */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {c.nombre}
                            </span>
                            <p className="text-[11px] text-slate-400 sm:hidden">
                              {c.empresa || 'Particular'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {c.empresa ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.empresa}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Particular</span>
                        )}
                      </td>

                      {/* Teléfono & WhatsApp */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="space-y-0.5">
                            <p className="font-mono text-slate-700 dark:text-slate-300">
                              {formatPanamaPhone(c.telefono || c.whatsapp) || '—'}
                            </p>
                            {c.email && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {c.email}
                              </p>
                            )}
                          </div>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Abrir chat de WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Dirección */}
                      <td className="py-3 px-4 hidden md:table-cell text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {c.direccion || '—'}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedCliente(c);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                            title="Ver ficha"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManageClients && (
                            <>
                              <button
                                onClick={() => {
                                  setClienteToEdit(c);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.nombre)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Formulario Cliente */}
      <ClienteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setClienteToEdit(null);
        }}
        onSubmit={handleCreateOrUpdate}
        clienteToEdit={clienteToEdit}
      />

      {/* Modal Ficha Detalle Cliente */}
      <ClienteDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCliente(null);
          searchParams.delete('id');
          setSearchParams(searchParams);
        }}
        cliente={selectedCliente}
        onEdit={(cli) => {
          setClienteToEdit(cli);
          setIsFormOpen(true);
        }}
        onAddEquipo={(cliId) => {
          setSelectedClienteIdForEquipo(cliId);
          setIsEquipoModalOpen(true);
        }}
      />

      {/* Modal Registrar Equipo directo para este cliente */}
      <EquipoFormModal
        isOpen={isEquipoModalOpen}
        onClose={() => {
          setIsEquipoModalOpen(false);
          setSelectedClienteIdForEquipo(null);
        }}
        defaultClienteId={selectedClienteIdForEquipo}
        onSuccess={() => {
          // Reabrir detalle para reflejar el nuevo equipo
          if (selectedCliente) {
            setIsDetailOpen(true);
          }
        }}
      />
    </div>
  );
}
