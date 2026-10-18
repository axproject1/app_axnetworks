import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Package,
  FileText,
  MapPin,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Shield,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Wrench,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  Globe,
} from 'lucide-react';
import {
  CatalogoService,
  ClausulasService,
  UbicacionesService,
  PerfilesService,
} from '@/lib/storage';
import { useEmpresa } from '@/contexts/EmpresaContext';
import type {
  CatalogoServicio,
  PlantillaClausula,
  Ubicacion,
  Perfil,
  RolUsuario,
  EmpresaConfig,
} from '@/types/database';
import { formatCurrency, ROL_CONFIG } from '@/lib/formatters';

type ConfigTab = 'empresa' | 'servicios' | 'clausulas' | 'ubicaciones' | 'usuarios';

const TABS: { key: ConfigTab; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'empresa', label: 'Datos de la Empresa', icon: Building2, description: 'RUC, contacto, dirección y web' },
  { key: 'servicios', label: 'Catálogo de Servicios', icon: Package, description: 'Servicios y precios base' },
  { key: 'clausulas', label: 'Cláusulas Legales', icon: FileText, description: 'Plantillas de informes' },
  { key: 'ubicaciones', label: 'Ubicaciones Físicas', icon: MapPin, description: 'Ubicaciones del taller' },
  { key: 'usuarios', label: 'Usuarios del Sistema', icon: Users, description: 'Roles y accesos' },
];

// ============================================================================
// MAIN CONFIGURATION PAGE
// ============================================================================
export function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('empresa');

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white shadow-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Configuración del Sistema
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestiona los parámetros operativos de la empresa y taller
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-white dark:bg-darkBg-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'empresa' && <EmpresaTab />}
        {activeTab === 'servicios' && <ServiciosTab />}
        {activeTab === 'clausulas' && <ClausulasTab />}
        {activeTab === 'ubicaciones' && <UbicacionesTab />}
        {activeTab === 'usuarios' && <UsuariosTab />}
      </div>
    </div>
  );
}

// ============================================================================
// EMPRESA TAB
// ============================================================================
function EmpresaTab() {
  const { empresa, updateEmpresa, resetEmpresa } = useEmpresa();
  const [formData, setFormData] = useState<EmpresaConfig>(empresa);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(empresa);
  }, [empresa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmpresa(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer los datos de la empresa a los valores iniciales predeterminados?')) {
      resetEmpresa();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Información de la empresa guardada exitosamente. Se aplicará de inmediato en Hojas de Ingreso, Informes Técnicos, Comprobantes de Pago y Etiquetas.</span>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Configuración */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Identidad y Datos Comerciales
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta información se imprime en todas las hojas de servicio, comprobantes y reportes
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Comercial / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. AX NETWORK SOLUTIONS GROUP"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eslogan / Subtítulo Comercial
                </label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. Soporte Técnico Especializado · Redes y Computadoras"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    RUC / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej. 155702314-2-2023 DV 45"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp de Atención / Clientes
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej. +507 6911-0901"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Fijo / Central
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej. +507 6911-0901"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Oficial
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej. contacto@axnetwork.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sitio Web o Portal en Línea
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.sitio_web}
                    onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej. https://axnetworksolutions.vercel.app"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Física / Ubicación del Taller
                </label>
                <textarea
                  rows={2}
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Ej. Ciudad de Panamá, Panamá"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Restablecer predeterminados
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Vista Previa en Vivo */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-brand-500" />
              Vista Previa en Documentos
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Así se verá el encabezado de tus Hojas de Ingreso, Informes y Comprobantes de Pago:
            </p>

            {/* Simulación Hoja Impresa */}
            <div className="bg-white dark:bg-slate-950 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start gap-3">
                <div className="w-2 h-12 bg-brand-500 rounded-full shrink-0" />
                <div className="min-w-0 flex-1">
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {formData.nombre || 'NOMBRE DE TU EMPRESA'}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {formData.subtitulo || 'Soporte Técnico Especializado'} · {formData.direccion || 'Panamá'}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                    {formData.ruc ? `RUC: ${formData.ruc} · ` : ''}WA: {formData.whatsapp || '+507 0000-0000'} {formData.email ? `· ${formData.email}` : ''}
                  </p>
                  {formData.sitio_web && (
                    <p className="text-[9px] text-brand-600 dark:text-brand-400 truncate mt-0.5">
                      {formData.sitio_web}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between items-center px-1">
                <span>Ejemplo de Orden: OT-2026-0001</span>
                <span>Panamá</span>
              </div>
            </div>

            <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/30 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-brand-700 dark:text-brand-300">
                ✓ Cambios automáticos:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li>Los PDFs generados mostrarán estos datos actualizados.</li>
                <li>Los comprobantes de caja y recibos incluirán tu RUC y contacto.</li>
                <li>Las etiquetas adhesivas incluirán tu sitio web.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SERVICIOS TAB
// ============================================================================
function ServiciosTab() {
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    garantia_dias: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CatalogoService.getAll(showInactive);
      setServicios(data);
    } catch (err) {
      setError('Error cargando servicios');
    }
    setLoading(false);
  }, [showInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', precio_base: '', garantia_dias: '' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (srv: CatalogoServicio) => {
    setFormData({
      nombre: srv.nombre,
      descripcion: srv.descripcion || '',
      precio_base: String(srv.precio_base),
      garantia_dias: String(srv.garantia_dias),
    });
    setEditingId(srv.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del servicio es obligatorio');
      return;
    }
    if (!formData.precio_base || Number(formData.precio_base) < 0) {
      setError('Ingrese un precio válido');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await CatalogoService.update(editingId, {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          precio_base: Number(formData.precio_base),
          garantia_dias: Number(formData.garantia_dias) || 0,
        });
      } else {
        await CatalogoService.create({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          precio_base: Number(formData.precio_base),
          garantia_dias: Number(formData.garantia_dias) || 0,
          activo: true,
        });
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const toggleActive = async (srv: CatalogoServicio) => {
    try {
      await CatalogoService.update(srv.id, { activo: !srv.activo });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (srv: CatalogoServicio) => {
    if (!confirm(`¿Eliminar permanentemente el servicio "${srv.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await CatalogoService.delete(srv.id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            {showInactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showInactive ? 'Mostrando inactivos' : 'Ocultos: solo activos'}
          </button>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-brand-200 dark:border-brand-800 p-5 shadow-lg shadow-brand-500/5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-500" />
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre del servicio *</label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: Optimización Avanzada Pro"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Detalle del servicio..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Precio base (USD) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_base}
                  onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="25.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Garantía (días)</label>
              <input
                type="number"
                min="0"
                value={formData.garantia_dias}
                onChange={(e) => setFormData({ ...formData, garantia_dias: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="15"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Servicio'}
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando servicios...</div>
      ) : servicios.length === 0 ? (
        <EmptyState message="No hay servicios registrados" />
      ) : (
        <div className="space-y-2">
          {servicios.map((srv) => (
            <div
              key={srv.id}
              className={`bg-white dark:bg-darkBg-card rounded-xl border p-4 transition-all hover:shadow-md ${
                srv.activo
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-slate-200/50 dark:border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{srv.nombre}</h4>
                    {!srv.activo && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                        INACTIVO
                      </span>
                    )}
                  </div>
                  {srv.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{srv.descripcion}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(srv.precio_base)}</span>
                    {srv.garantia_dias > 0 && (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Shield className="w-3 h-3" />
                        {srv.garantia_dias} días garantía
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(srv)}
                    title={srv.activo ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      srv.activo
                        ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {srv.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => startEdit(srv)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(srv)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLÁUSULAS TAB
// ============================================================================
function ClausulasTab() {
  const [clausulas, setClausulas] = useState<PlantillaClausula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: '', texto: '', orden: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ClausulasService.getAll(true);
      setClausulas(data.sort((a, b) => a.orden - b.orden));
    } catch {
      setError('Error cargando cláusulas');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({ titulo: '', texto: '', orden: '' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (cls: PlantillaClausula) => {
    setFormData({
      titulo: cls.titulo,
      texto: cls.texto,
      orden: String(cls.orden),
    });
    setEditingId(cls.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.texto.trim()) {
      setError('El título y el texto son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const nextOrder = editingId
        ? Number(formData.orden) || 1
        : clausulas.length + 1;

      if (editingId) {
        await ClausulasService.update(editingId, {
          titulo: formData.titulo.trim(),
          texto: formData.texto.trim(),
          orden: Number(formData.orden) || nextOrder,
        });
      } else {
        await ClausulasService.create({
          titulo: formData.titulo.trim(),
          texto: formData.texto.trim(),
          orden: nextOrder,
          activa: true,
        });
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const toggleActive = async (cls: PlantillaClausula) => {
    try {
      await ClausulasService.update(cls.id, { activa: !cls.activa });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveClause = async (id: string, direction: 'up' | 'down') => {
    const idx = clausulas.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= clausulas.length) return;

    try {
      const currentOrden = clausulas[idx].orden;
      const swapOrden = clausulas[swapIdx].orden;
      await ClausulasService.update(clausulas[idx].id, { orden: swapOrden });
      await ClausulasService.update(clausulas[swapIdx].id, { orden: currentOrden });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estas cláusulas aparecen en los Informes Técnicos entregados al cliente
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Cláusula
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-brand-200 dark:border-brand-800 p-5 shadow-lg shadow-brand-500/5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" />
              {editingId ? 'Editar Cláusula' : 'Nueva Cláusula'}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Título *</label>
                <input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: Garantía"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Orden #</label>
                <input
                  type="number"
                  min="1"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder={String(clausulas.length + 1)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Texto de la cláusula * <span className="font-normal text-slate-400">(usa {'{garantia_dias}'} como variable)</span>
              </label>
              <textarea
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Texto legal de la cláusula..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Cláusula'}
            </button>
          </div>
        </div>
      )}

      {/* Clausulas List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando cláusulas...</div>
      ) : clausulas.length === 0 ? (
        <EmptyState message="No hay cláusulas registradas" />
      ) : (
        <div className="space-y-2">
          {clausulas.map((cls, idx) => (
            <div
              key={cls.id}
              className={`bg-white dark:bg-darkBg-card rounded-xl border p-4 transition-all ${
                cls.activa
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-slate-200/50 dark:border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    onClick={() => moveClause(cls.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded text-slate-400 hover:text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-5 text-center">{cls.orden}</span>
                  <button
                    onClick={() => moveClause(cls.id, 'down')}
                    disabled={idx === clausulas.length - 1}
                    className="p-0.5 rounded text-slate-400 hover:text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{cls.titulo}</h4>
                    {!cls.activa && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                        INACTIVA
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs text-slate-500 dark:text-slate-400 mt-1 cursor-pointer ${
                      expandedId === cls.id ? '' : 'line-clamp-2'
                    }`}
                    onClick={() => setExpandedId(expandedId === cls.id ? null : cls.id)}
                  >
                    {cls.texto}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(cls)}
                    title={cls.activa ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      cls.activa
                        ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cls.activa ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => startEdit(cls)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UBICACIONES TAB
// ============================================================================
function UbicacionesTab() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNombre, setNewNombre] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UbicacionesService.getAll(true);
      setUbicaciones(data);
    } catch {
      setError('Error cargando ubicaciones');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!newNombre.trim()) return;
    try {
      await UbicacionesService.create({ nombre: newNombre.trim() });
      setNewNombre('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editNombre.trim()) return;
    try {
      await UbicacionesService.update(id, { nombre: editNombre.trim() });
      setEditingId(null);
      setEditNombre('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActive = async (ubi: Ubicacion) => {
    try {
      await UbicacionesService.update(ubi.id, { activa: !ubi.activa });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (ubi: Ubicacion) => {
    if (!confirm(`¿Eliminar la ubicación "${ubi.nombre}"?`)) return;
    try {
      await UbicacionesService.delete(ubi.id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Define dónde se encuentran los equipos dentro del taller o en campo
      </p>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            placeholder="Nombre de la nueva ubicación..."
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!newNombre.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando ubicaciones...</div>
      ) : ubicaciones.length === 0 ? (
        <EmptyState message="No hay ubicaciones registradas" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ubicaciones.map((ubi) => (
            <div
              key={ubi.id}
              className={`bg-white dark:bg-darkBg-card rounded-xl border p-3.5 flex items-center gap-3 transition-all group ${
                ubi.activa
                  ? 'border-slate-200 dark:border-slate-700 hover:shadow-md'
                  : 'border-slate-200/50 dark:border-slate-700/50 opacity-60'
              }`}
            >
              <div className={`p-2 rounded-lg ${ubi.activa ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === ubi.id ? (
                  <div className="flex gap-1.5">
                    <input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(ubi.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 rounded text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                    <button
                      onClick={() => handleUpdate(ubi.id)}
                      className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">{ubi.nombre}</span>
                    {!ubi.activa && (
                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full">OFF</span>
                    )}
                  </div>
                )}
              </div>

              {editingId !== ubi.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(ubi)}
                    title={ubi.activa ? 'Desactivar' : 'Activar'}
                    className={`p-1 rounded transition-colors ${
                      ubi.activa ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {ubi.activa ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingId(ubi.id); setEditNombre(ubi.nombre); }}
                    className="p-1 rounded text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ubi)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USUARIOS TAB
// ============================================================================
function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'tecnico' as RolUsuario,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PerfilesService.getAll(true);
      setUsuarios(data);
    } catch {
      setError('Error cargando usuarios');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({ nombre: '', email: '', telefono: '', rol: 'tecnico' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (usr: Perfil) => {
    setFormData({
      nombre: usr.nombre,
      email: usr.email || '',
      telefono: usr.telefono || '',
      rol: usr.rol,
    });
    setEditingId(usr.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del usuario es obligatorio');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await PerfilesService.update(editingId, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim() || undefined,
          telefono: formData.telefono.trim() || null,
          rol: formData.rol,
        });
      } else {
        await PerfilesService.create({
          nombre: formData.nombre.trim(),
          email: formData.email.trim() || undefined,
          telefono: formData.telefono.trim() || null,
          rol: formData.rol,
        });
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const toggleActive = async (usr: Perfil) => {
    try {
      await PerfilesService.toggleActive(usr.id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleIcon = (rol: RolUsuario) => {
    switch (rol) {
      case 'dueno': return <Shield className="w-3.5 h-3.5" />;
      case 'tecnico': return <Wrench className="w-3.5 h-3.5" />;
      case 'recepcion': return <User className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gestiona los usuarios que acceden al sistema
          <span className="text-[10px] ml-1 text-amber-500">(con Supabase Auth activo, estos perfiles se sincronizan)</span>
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-brand-200 dark:border-brand-800 p-5 shadow-lg shadow-brand-500/5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre completo *</label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: Juan Pérez (Técnico)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="usuario@axnetwork.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="+507 6XXX-XXXX"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Rol en el sistema</label>
              <div className="grid grid-cols-3 gap-2">
                {(['dueno', 'tecnico', 'recepcion'] as RolUsuario[]).map((rol) => (
                  <button
                    key={rol}
                    type="button"
                    onClick={() => setFormData({ ...formData, rol })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      formData.rol === rol
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {getRoleIcon(rol)}
                    {ROL_CONFIG[rol].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <EmptyState message="No hay usuarios registrados" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {usuarios.map((usr) => (
            <div
              key={usr.id}
              className={`bg-white dark:bg-darkBg-card rounded-xl border p-4 transition-all hover:shadow-md group ${
                usr.activo
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-slate-200/50 dark:border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                    usr.rol === 'dueno' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                    usr.rol === 'tecnico' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                  }`}>
                    {usr.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{usr.nombre}</h4>
                    <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROL_CONFIG[usr.rol].badge}`}>
                      {getRoleIcon(usr.rol)}
                      {ROL_CONFIG[usr.rol].label}
                    </span>
                  </div>
                </div>

                {!usr.activo && (
                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full">
                    INACTIVO
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {usr.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{usr.email}</span>
                  </div>
                )}
                {usr.telefono && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{usr.telefono}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleActive(usr)}
                  title={usr.activo ? 'Desactivar' : 'Activar'}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    usr.activo
                      ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {usr.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {usr.activo ? 'Activo' : 'Inactivo'}
                </button>
                <button
                  onClick={() => startEdit(usr)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <Settings className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Usa el botón de arriba para agregar uno nuevo</p>
    </div>
  );
}
