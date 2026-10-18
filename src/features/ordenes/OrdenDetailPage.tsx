import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  OrdenesService,
  OrdenItemsService,
  FotosService,
  HistorialService,
  UbicacionesService,
  PerfilesService,
  CatalogoService,
  PagosService,
  InformesService,
} from '@/lib/storage';
import { Orden, OrdenItem, Foto, Ubicacion, Perfil, EstadoOrden, CatalogoServicio, MetodoPago, TipoDescuento, Informe } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPanamaPhone,
  cleanWhatsAppNumber,
  ESTADOS_ORDEN_CONFIG,
  PRIORIDAD_CONFIG,
  TIPO_SERVICIO_CONFIG,
  METODO_PAGO_CONFIG,
} from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { AprobacionModal } from './AprobacionModal';
import { HojaIngresoModal } from './HojaIngresoModal';
import { PagoFormModal } from '@/features/cobros/PagoFormModal';
import { ReciboPagoModal } from '@/features/cobros/ReciboPagoModal';
import { DescuentoModal } from '@/features/cobros/DescuentoModal';
import { GenerarInformeModal } from '@/features/informes/GenerarInformeModal';
import { InformeViewerModal } from '@/features/informes/InformeViewerModal';
import { EtiquetaQRModal } from '@/features/etiquetas/EtiquetaQRModal';
import { compressImage } from '@/lib/imageUtils';
import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  MessageSquare,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  History,
  MapPin,
  User,
  Laptop,
  Check,
  ChevronLeft,
  Camera,
  ShieldCheck,
  X,
  CreditCard,
  Ban,
  FileText,
  PenTool,
  Tag,
} from 'lucide-react';

export function OrdenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTecnico, canCreatePayments } = useAuth();

  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'diagnostico' | 'cobro' | 'pagos' | 'informe' | 'fotos' | 'historial'>('resumen');

  // Sub-data
  const [items, setItems] = useState<OrdenItem[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoServicio[]>([]);

  // Diagnostics editable fields
  const [diagnostico, setDiagnostico] = useState('');
  const [trabajoRealizado, setTrabajoRealizado] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [savingDiag, setSavingDiag] = useState(false);

  // New item modal / form
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedServicioId, setSelectedServicioId] = useState('');
  const [itemTipo, setItemTipo] = useState<'servicio' | 'repuesto' | 'otro'>('servicio');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCant, setItemCant] = useState(1);
  const [itemPrecio, setItemPrecio] = useState(0);
  const [itemCosto, setItemCosto] = useState(0);

  // Modals
  const [isAprobacionModalOpen, setIsAprobacionModalOpen] = useState(false);
  const [isHojaModalOpen, setIsHojaModalOpen] = useState(false);
  const [isEtiquetaModalOpen, setIsEtiquetaModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isDescuentoModalOpen, setIsDescuentoModalOpen] = useState(false);
  const [selectedPagoForRecibo, setSelectedPagoForRecibo] = useState<any | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [isGenerarInformeOpen, setIsGenerarInformeOpen] = useState(false);
  const [isInformeViewerOpen, setIsInformeViewerOpen] = useState(false);

  // Feedback message
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const loadOrdenData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ord, ubis, tecs, servs] = await Promise.all([
        OrdenesService.getById(id),
        UbicacionesService.getAll(),
        PerfilesService.getTecnicos(),
        CatalogoService.getAll(),
      ]);

      if (!ord) {
        navigate('/ordenes');
        return;
      }

      setOrden(ord);
      setUbicaciones(ubis);
      setTecnicos(tecs);
      setCatalogo(servs);

      setDiagnostico(ord.diagnostico || '');
      setTrabajoRealizado(ord.trabajo_realizado || '');
      setRecomendaciones(ord.recomendaciones || '');

      // Subcollections
      const [itms, fts, hist, pgs, inf] = await Promise.all([
        OrdenItemsService.getByOrden(ord.id),
        FotosService.getByOrden(ord.id),
        HistorialService.getByOrden(ord.id),
        PagosService.getByOrden(ord.id),
        InformesService.getByOrden(ord.id),
      ]);
      setItems(itms);
      setFotos(fts);
      setHistorial(hist);
      setPagos(pgs);
      setInforme(inf);
    } catch (err: any) {
      console.error(err);
      setFeedback({ text: err.message || 'Error cargando orden', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenData();
  }, [id]);

  // Cambiar estado con validación amable de aprobación
  const handleEstadoChange = async (nuevoEstado: EstadoOrden) => {
    if (!orden) return;
    try {
      setFeedback(null);
      // Validar regla de negocio si requiere aprobación
      if (['reparacion', 'listo', 'entregado'].includes(nuevoEstado) && !orden.presupuesto_aprobado) {
        setFeedback({
          text: `La orden no puede pasar a "${nuevoEstado}" porque el cliente aún no ha aprobado el presupuesto.`,
          type: 'warning',
        });
        setIsAprobacionModalOpen(true);
        return;
      }

      const updated = await OrdenesService.update(orden.id, { estado: nuevoEstado });
      setOrden(updated);
      setFeedback({ text: `Estado cambiado a "${ESTADOS_ORDEN_CONFIG[nuevoEstado].label}"`, type: 'success' });
      // Reload historial
      HistorialService.getByOrden(orden.id).then(setHistorial);
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Cambiar ubicación física
  const handleUbicacionChange = async (nuevaUbicacionId: string) => {
    if (!orden) return;
    try {
      const updated = await OrdenesService.update(orden.id, { ubicacion_id: nuevaUbicacionId });
      setOrden(updated);
      setFeedback({ text: 'Ubicación física actualizada', type: 'success' });
      HistorialService.getByOrden(orden.id).then(setHistorial);
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Guardar diagnósticos y trabajo realizado
  const handleSaveDiagnostico = async () => {
    if (!orden) return;
    try {
      setSavingDiag(true);
      const updated = await OrdenesService.update(orden.id, {
        diagnostico,
        trabajo_realizado: trabajoRealizado,
        recomendaciones,
      });
      setOrden(updated);
      setFeedback({ text: 'Diagnóstico y notas de trabajo guardadas', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setSavingDiag(false);
    }
  };

  // Agregar foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!orden) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1280, 1280, 0.75);
        await FotosService.addFoto(orden.id, {
          ruta: compressed,
          tipo: 'diagnostico',
          descripcion: 'Evidencia técnica de diagnóstico / trabajo',
        });
      }
      const updatedFotos = await FotosService.getByOrden(orden.id);
      setFotos(updatedFotos);
      setFeedback({ text: 'Foto(s) agregada(s) exitosamente', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al procesar foto', type: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  // Agregar ítem de cobro
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden || !itemDesc) return;
    try {
      await OrdenItemsService.addItem(orden.id, {
        tipo: itemTipo,
        servicio_id: selectedServicioId || null,
        descripcion: itemDesc,
        cantidad: Number(itemCant),
        precio_unitario: Number(itemPrecio),
        costo_unitario: Number(itemCosto) || 0,
      });

      const updatedItems = await OrdenItemsService.getByOrden(orden.id);
      setItems(updatedItems);
      // Recalcular totales
      const full = await OrdenesService.getById(orden.id);
      setOrden(full);

      setShowAddItem(false);
      setItemDesc('');
      setItemPrecio(0);
      setItemCosto(0);
      setItemCant(1);
      setSelectedServicioId('');
      setFeedback({ text: 'Ítem agregado a la cuenta', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Registrar abono o pago
  const handleCreatePago = async (pagoData: {
    monto: number;
    metodo: MetodoPago;
    referencia?: string | null;
    nota?: string | null;
  }) => {
    if (!orden) return;
    try {
      const nuevoPago = await PagosService.create({
        orden_id: orden.id,
        monto: pagoData.monto,
        metodo: pagoData.metodo,
        referencia: pagoData.referencia,
        recibido_por: user?.id || null,
        nota: pagoData.nota,
      });

      const [updatedPagos, fullOrden, hist] = await Promise.all([
        PagosService.getByOrden(orden.id),
        OrdenesService.getById(orden.id),
        HistorialService.getByOrden(orden.id),
      ]);

      setPagos(updatedPagos);
      setOrden(fullOrden);
      setHistorial(hist);

      setFeedback({ text: `Abono de ${formatCurrency(pagoData.monto)} registrado con éxito`, type: 'success' });
      // Abrir recibo automáticamente
      setSelectedPagoForRecibo(nuevoPago);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al procesar abono', type: 'error' });
    }
  };

  // Anular pago
  const handleAnularPago = async (pago: any) => {
    if (!orden) return;
    const motivo = window.prompt(
      `¿Deseas anular el pago de ${formatCurrency(pago.monto)}?\n\nPor favor indica el motivo de la anulación:`
    );
    if (!motivo || !motivo.trim()) return;

    try {
      await PagosService.anular(pago.id, motivo.trim());
      const [updatedPagos, fullOrden, hist] = await Promise.all([
        PagosService.getByOrden(orden.id),
        OrdenesService.getById(orden.id),
        HistorialService.getByOrden(orden.id),
      ]);

      setPagos(updatedPagos);
      setOrden(fullOrden);
      setHistorial(hist);
      setFeedback({ text: `Pago de ${formatCurrency(pago.monto)} anulado correctamente`, type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al anular pago', type: 'error' });
    }
  };

  // Guardar configuración de descuento e ITBMS
  const handleSaveDescuento = async (config: {
    descuento_tipo: TipoDescuento;
    descuento_valor: number;
    descuento_motivo: string | null;
    itbms_pct: number;
  }) => {
    if (!orden) return;
    try {
      await OrdenesService.update(orden.id, config, 'Modificación de descuentos / ITBMS');
      const [fullOrden, hist] = await Promise.all([
        OrdenesService.getById(orden.id),
        HistorialService.getByOrden(orden.id),
      ]);
      setOrden(fullOrden);
      setHistorial(hist);
      setFeedback({ text: 'Condiciones de cobro e ITBMS actualizadas', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al actualizar descuento', type: 'error' });
    }
  };

  // Eliminar ítem
  const handleDeleteItem = async (itemId: string) => {
    if (!orden) return;
    try {
      await OrdenItemsService.deleteItem(itemId);
      const updatedItems = await OrdenItemsService.getByOrden(orden.id);
      setItems(updatedItems);
      const full = await OrdenesService.getById(orden.id);
      setOrden(full);
      setFeedback({ text: 'Ítem eliminado', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Botón "Equipo listo" por WhatsApp prellenado
  const handleWhatsAppListo = () => {
    if (!orden || !orden.cliente) return;
    const wa = cleanWhatsAppNumber(orden.cliente.whatsapp || orden.cliente.telefono);
    if (!wa) {
      alert('El cliente no tiene un número de WhatsApp registrado.');
      return;
    }
    const saldoTxt = formatCurrency(orden.totales?.saldo || 0);
    const modeloTxt = `${orden.equipo?.marca || ''} ${orden.equipo?.modelo || orden.equipo?.tipo || 'equipo'}`.trim();
    const mensaje = `Hola ${orden.cliente.nombre}, tu equipo ${modeloTxt} (orden ${orden.numero}) está listo para retirar. Saldo pendiente: ${saldoTxt}. — AX Network Solutions`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (loading || !orden) {
    return <div className="p-12 text-center text-xs text-slate-400">Cargando orden de servicio...</div>;
  }

  const estadoCfg = ESTADOS_ORDEN_CONFIG[orden.estado];
  const prioridadCfg = PRIORIDAD_CONFIG[orden.prioridad];
  const totales = orden.totales;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Feedback */}
      <div className="flex items-center justify-between">
        <Link
          to="/ordenes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Órdenes
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'warning' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* HEADER HERO DE LA ORDEN */}
      <Card className="shadow-elevated border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {orden.numero}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${estadoCfg.bg} ${estadoCfg.text} ${estadoCfg.border}`}>
                  {estadoCfg.label}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${prioridadCfg.color}`}>
                  {prioridadCfg.label}
                </span>
                <Badge variant="outline" size="sm">
                  {TIPO_SERVICIO_CONFIG[orden.tipo_servicio]?.label || orden.tipo_servicio}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                <span>Ingreso: {formatDate(orden.fecha_ingreso)}</span>
                <span>•</span>
                <span>Técnico: <strong className="text-slate-700 dark:text-slate-300">{orden.tecnico?.nombre || 'Sin asignar'}</strong></span>
                <span>•</span>
                <span>Ubicación: <strong className="text-slate-700 dark:text-slate-300">{orden.ubicacion?.nombre || 'Recepción'}</strong></span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Botón WhatsApp Equipo Listo */}
              <button
                type="button"
                onClick={handleWhatsAppListo}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all"
                title="Avisar al cliente por WhatsApp que su equipo está listo"
              >
                <MessageSquare className="w-4 h-4" />
                Equipo Listo
              </button>

              {/* Botón Registrar Aprobación si no está aprobado */}
              {!orden.presupuesto_aprobado ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50"
                  onClick={() => setIsAprobacionModalOpen(true)}
                >
                  <ShieldCheck className="w-4 h-4 mr-1 text-amber-500" />
                  Registrar Aprobación
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  Aprobado ({orden.aprobado_via})
                </div>
              )}

              {/* Botón Hoja de Ingreso PDF & QR */}
              <Button size="sm" variant="outline" onClick={() => setIsHojaModalOpen(true)}>
                <Printer className="w-4 h-4 mr-1.5" />
                Hoja & QR
              </Button>

              {/* Botón Etiqueta Adhesiva Térmica QR */}
              <Button size="sm" variant="outline" onClick={() => setIsEtiquetaModalOpen(true)} title="Imprimir etiqueta adhesiva térmica para el equipo">
                <Tag className="w-4 h-4 mr-1.5 text-brand-600" />
                Etiqueta QR
              </Button>

              {/* Botón Informe Técnico en PDF */}
              {informe ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-400 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  onClick={() => setIsInformeViewerOpen(true)}
                  title="Ver informe técnico oficial emitido"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-axBlue" />
                  Ver Informe ({informe.numero})
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 hover:border-axBlue hover:text-axBlue"
                  onClick={() => setIsGenerarInformeOpen(true)}
                  title="Generar informe técnico con firmas digitales y garantía"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                  Informe Técnico
                </Button>
              )}
            </div>
          </div>

          {/* Inline Selectors para cambiar Estado y Ubicación con 1 Clic */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Cambiar Estado:</span>
              <select
                value={orden.estado}
                onChange={(e) => handleEstadoChange(e.target.value as EstadoOrden)}
                className="bg-slate-100 dark:bg-slate-800 border-none font-semibold rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(ESTADOS_ORDEN_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Ubicación Física:</span>
              <select
                value={orden.ubicacion_id || ''}
                onChange={(e) => handleUbicacionChange(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none font-semibold rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500"
              >
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'diagnostico', label: 'Diagnóstico y Trabajo' },
          ...(!isTecnico ? [{ id: 'cobro', label: 'Cobro' }] : []),
          ...(!isTecnico ? [{ id: 'pagos', label: 'Pagos' }] : []),
          { id: 'informe', label: informe ? `Informe (${informe.numero})` : 'Informe Técnico' },
          { id: 'fotos', label: `Fotos (${fotos.length})` },
          { id: 'historial', label: 'Historial' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PESTAÑA 1: RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Cliente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                <CardTitle className="text-sm">Datos del Cliente</CardTitle>
              </div>
              <Link to={`/clientes?id=${orden.cliente_id}`} className="text-xs text-brand-600 hover:underline">
                Ver ficha completa
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{orden.cliente?.nombre}</p>
              {orden.cliente?.empresa && (
                <p className="text-slate-500 font-medium">Empresa: {orden.cliente.empresa}</p>
              )}
              <p className="text-slate-700 dark:text-slate-300">
                Teléfono: {formatPanamaPhone(orden.cliente?.telefono || orden.cliente?.whatsapp)}
              </p>
              <p className="text-slate-500">Dirección: {orden.cliente?.direccion || 'Ciudad de Panamá'}</p>
            </CardContent>
          </Card>

          {/* Card Equipo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm">Dispositivo / Hardware</CardTitle>
              </div>
              {orden.equipo_id && (
                <Link to={`/equipos?id=${orden.equipo_id}`} className="text-xs text-brand-600 hover:underline">
                  Ver especificaciones
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {orden.equipo?.tipo} · {orden.equipo?.marca} {orden.equipo?.modelo}
              </p>
              <p className="font-mono text-slate-700 dark:text-slate-300">
                Serie (S/N): {orden.equipo?.serie || 'SIN SERIE'}
              </p>
              <p className="text-slate-500">
                Hardware: {[orden.equipo?.procesador, orden.equipo?.ram, orden.equipo?.almacenamiento].filter(Boolean).join(' · ') || 'No especificado'}
              </p>
              {orden.equipo?.accesorios && (
                <p className="text-slate-500">Accesorios: {orden.equipo.accesorios}</p>
              )}
            </CardContent>
          </Card>

          {/* Card Falla y Estado Físico */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Falla Reportada y Estado al Ingreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                  Problema Reportado
                </span>
                <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-slate-800 dark:text-slate-200">
                  {orden.falla_reportada || 'Revisión técnica'}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                  Estado Físico del Chasis y Componentes
                </span>
                <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-slate-700 dark:text-slate-300">
                  {orden.estado_fisico_ingreso || 'Sin detalles estéticos registrados'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PESTAÑA 2: DIAGNÓSTICO Y TRABAJO */}
      {activeTab === 'diagnostico' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bitácora Técnica de Reparación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Diagnóstico Técnico Realizado"
              placeholder="Explica la causa raíz detectada: componentes dañados, temperaturas, pruebas de estrés, voltajes..."
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows={3}
            />

            <Textarea
              label="Trabajo y Mantenimiento Realizado"
              placeholder="Detalla las acciones ejecutadas: cambio de pasta térmica, reinstalación SO, sustitución de disco SSD..."
              value={trabajoRealizado}
              onChange={(e) => setTrabajoRealizado(e.target.value)}
              rows={3}
            />

            <Textarea
              label="Recomendaciones para el Cliente"
              placeholder="Recomendaciones preventivas: ciclos de limpieza, ventilación, voltajes, respaldos..."
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              rows={2}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveDiagnostico} isLoading={savingDiag}>
                <Check className="w-4 h-4 mr-1.5" />
                Guardar Diagnóstico
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PESTAÑA 3: COBRO Y SERVICIOS (OCULTA PARA TÉCNICOS) */}
      {activeTab === 'cobro' && !isTecnico && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Detalle de Servicios y Repuestos</CardTitle>
                <p className="text-xs text-slate-500">Ítems que componen el presupuesto de la orden.</p>
              </div>
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agregar Ítem
              </Button>
            </CardHeader>

            {/* Modal / Acordeón para agregar ítem */}
            {showAddItem && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Agregar Ítem a la Orden
                  </span>
                  <button onClick={() => setShowAddItem(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Seleccionar del catálogo */}
                <Select
                  label="Elegir Servicio del Catálogo de AX Network"
                  value={selectedServicioId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedServicioId(sid);
                    const found = catalogo.find((c) => c.id === sid);
                    if (found) {
                      setItemDesc(found.nombre);
                      setItemPrecio(found.precio_base);
                      setItemTipo('servicio');
                    }
                  }}
                >
                  <option value="">-- O escribe un ítem personalizado abajo --</option>
                  {catalogo.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre} — {formatCurrency(cat.precio_base)}
                    </option>
                  ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <Select
                    label="Tipo de Ítem"
                    value={itemTipo}
                    onChange={(e) => setItemTipo(e.target.value as any)}
                  >
                    <option value="servicio">Servicio</option>
                    <option value="repuesto">Repuesto Físico</option>
                    <option value="otro">Otro</option>
                  </Select>

                  <div className="sm:col-span-2">
                    <Input
                      label="Descripción"
                      placeholder="Ej: Pasta Térmica Thermal Grizzly / SSD 1TB"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      required
                    />
                  </div>

                  <Input
                    label="Precio Venta ($)"
                    type="number"
                    step="0.01"
                    value={itemPrecio}
                    onChange={(e) => setItemPrecio(Number(e.target.value))}
                    required
                  />

                  <Input
                    label="Costo Unitario ($)"
                    type="number"
                    step="0.01"
                    value={itemCosto}
                    onChange={(e) => setItemCosto(Number(e.target.value))}
                    helperText="Costo de compra (repuestos)"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowAddItem(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAddItem}>
                    Agregar a la Orden
                  </Button>
                </div>
              </div>
            )}

            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Descripción</th>
                    <th className="py-2.5 px-4 text-center">Cant.</th>
                    <th className="py-2.5 px-4 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No hay ítems agregados a esta orden todavía.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {it.descripcion}
                          <span className="ml-2 text-[10px] text-slate-400 uppercase font-normal">
                            ({it.tipo})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{it.cantidad}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(it.precio_unitario)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(it.cantidad * it.precio_unitario)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Cuadro de Totales y Descuentos */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 max-w-md space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Condiciones Comerciales
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {orden.descuento_tipo !== 'ninguno' && orden.descuento_valor > 0
                  ? `Descuento del ${orden.descuento_tipo === 'porcentaje' ? `${orden.descuento_valor}%` : `$${orden.descuento_valor}`}${orden.descuento_motivo ? ` (${orden.descuento_motivo})` : ''}`
                  : 'Sin descuento aplicado.'}
                {' '}ITBMS: {orden.itbms_pct}% ({orden.itbms_pct > 0 ? 'Estándar Panamá' : 'Exento'}).
              </p>
              {canCreatePayments && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDescuentoModalOpen(true)}
                  className="text-xs"
                >
                  Configurar Descuento / ITBMS
                </Button>
              )}
            </div>

            <Card className="w-full sm:w-80 shadow-soft">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{formatCurrency(totales?.subtotal || 0)}</span>
                </div>
                {totales && totales.descuento > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento aplicado:</span>
                    <span className="font-mono font-bold">-{formatCurrency(totales.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>ITBMS ({orden.itbms_pct}%):</span>
                  <span className="font-mono font-bold">{formatCurrency(totales?.impuesto || 0)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">{formatCurrency(totales?.total || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Abonos Recibidos:</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(totales?.pagado || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between text-xs font-black">
                  <span>Saldo Pendiente:</span>
                  <span className={`font-mono ${(totales?.saldo || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(totales?.saldo || 0)}
                  </span>
                </div>

                {canCreatePayments && (totales?.saldo || 0) > 0 && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setIsPagoModalOpen(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Registrar Abono
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: PAGOS (OCULTA PARA TÉCNICOS) */}
      {activeTab === 'pagos' && !isTecnico && (
        <div className="space-y-6">
          {/* Header con resumen y botón de nuevo abono */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Presupuesto</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totales?.total || 0)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Total Abonado</span>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totales?.pagado || 0)}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Saldo Pendiente</span>
                <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totales?.saldo || 0)}</span>
              </div>
            </div>

            {canCreatePayments && (
              <Button size="sm" onClick={() => setIsPagoModalOpen(true)}>
                <CreditCard className="w-4 h-4 mr-1.5" />
                Registrar Abono / Pago
              </Button>
            )}
          </div>

          {/* Tabla de Pagos */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Fecha & Hora</th>
                    <th className="py-2.5 px-4">Método</th>
                    <th className="py-2.5 px-4">Referencia</th>
                    <th className="py-2.5 px-4 text-right">Monto ($)</th>
                    <th className="py-2.5 px-4">Recibido Por</th>
                    <th className="py-2.5 px-4">Estado</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No se han registrado abonos ni pagos para esta orden.
                      </td>
                    </tr>
                  ) : (
                    pagos.map((p) => {
                      const metodoLabel = METODO_PAGO_CONFIG[p.metodo as MetodoPago]?.label || p.metodo;

                      return (
                        <tr key={p.id} className={p.anulado ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''}>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {formatDateTime(p.fecha)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {metodoLabel}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {p.referencia || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(p.monto)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.recibido_por_perfil?.nombre || 'Recepción'}
                          </td>
                          <td className="py-3 px-4">
                            {p.anulado ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                Anulado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                Completado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedPagoForRecibo(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Ver comprobante de pago"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {!p.anulado && canCreatePayments && (
                                <button
                                  onClick={() => handleAnularPago(p)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Anular pago"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
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
        </div>
      )}

      {/* PESTAÑA INFORME TÉCNICO EN PDF */}
      {activeTab === 'informe' && (
        <div className="space-y-4">
          {informe ? (
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-axBlue px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      {informe.numero}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Informe Emitido
                    </span>
                  </div>
                  <CardTitle className="text-base">Informe Técnico Oficial</CardTitle>
                  <p className="text-xs text-slate-500">
                    Emitido el {formatDateTime(informe.created_at)} · Garantía vigente de {informe.garantia_dias} días
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsGenerarInformeOpen(true)}
                    className="text-xs h-8 px-2.5"
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Refirmar / Modificar
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setIsInformeViewerOpen(true)}
                    className="bg-axBlue hover:bg-axBlueHover text-white text-xs h-8 px-3 font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver / Descargar PDF</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Estado de Firmas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkCard space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Firma del Técnico Especialista
                      </span>
                      {informe.firma_tecnico ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Firmado
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-500">Pendiente</span>
                      )}
                    </div>
                    {informe.firma_tecnico ? (
                      <div className="h-16 p-1 rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <img src={informe.firma_tecnico} alt="Firma técnico" className="max-h-14 max-w-full object-contain" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No se registró firma del técnico</p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Técnico: <strong className="text-slate-700 dark:text-slate-300">{orden.tecnico?.nombre || 'Técnico'}</strong>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkCard space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Firma de Conformidad del Cliente
                      </span>
                      {informe.firma_cliente ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Firmado
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-500">Pendiente</span>
                      )}
                    </div>
                    {informe.firma_cliente ? (
                      <div className="h-16 p-1 rounded bg-white dark:bg-darkBg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <img src={informe.firma_cliente} alt="Firma cliente" className="max-h-14 max-w-full object-contain" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No se registró firma del cliente</p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Cliente: <strong className="text-slate-700 dark:text-slate-300">{orden.cliente?.nombre || 'Cliente'}</strong>
                    </p>
                  </div>
                </div>

                {/* Resumen de Garantía */}
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Garantía de Servicio: {informe.garantia_dias} Días Calendario</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Cubre:</strong> {informe.garantia_cubre}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Exclusiones:</strong> {informe.garantia_excluye}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-axBlue">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Informe Técnico Aún No Emitido
                </h4>
                <p className="text-xs text-slate-500">
                  Genera el informe técnico formal en PDF con membrete de AX Network, detalle de diagnóstico y repuestos, cláusulas de garantía y captura de doble firma digital del técnico y del cliente.
                </p>
              </div>
              <Button
                onClick={() => setIsGenerarInformeOpen(true)}
                className="bg-axBlue hover:bg-axBlueHover text-white text-xs font-semibold px-4 py-2"
              >
                <PenTool className="w-4 h-4 mr-1.5" />
                Generar Informe Técnico con Firmas
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* PESTAÑA 5: FOTOS */}
      {activeTab === 'fotos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Evidencia Fotográfica</h4>
              <p className="text-xs text-slate-500">Fotos de ingreso, daños encontrados y resultado final.</p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors">
              <Camera className="w-4 h-4" />
              Subir Foto
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          {fotos.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed text-xs text-slate-400">
              No se han subido fotos de evidencia para esta orden.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {fotos.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setPreviewPhoto(f.ruta)}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-soft"
                >
                  <img src={f.ruta} alt={f.descripcion || 'Foto'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white font-medium truncate">
                    {f.tipo.toUpperCase()} {f.descripcion ? `· ${f.descripcion}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 6: HISTORIAL */}
      {activeTab === 'historial' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Línea de Tiempo y Auditoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
              {historial.map((h, i) => (
                <div key={h.id || i} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-brand-500 bg-white dark:bg-darkBg" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {h.estado.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(h.created_at)}
                      </span>
                    </div>
                    {h.nota && <p className="text-xs text-slate-600 dark:text-slate-400">{h.nota}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Registrar Aprobación */}
      <AprobacionModal
        isOpen={isAprobacionModalOpen}
        onClose={() => setIsAprobacionModalOpen(false)}
        ordenNumero={orden.numero}
        defaultClienteNombre={orden.cliente?.nombre}
        onConfirm={async (data) => {
          const updated = await OrdenesService.registrarAprobacion(orden.id, data);
          setOrden(updated);
          setFeedback({ text: 'Aprobación del presupuesto registrada con éxito', type: 'success' });
          HistorialService.getByOrden(orden.id).then(setHistorial);
        }}
      />

      {/* Modal Hoja de Ingreso PDF y QR */}
      <HojaIngresoModal
        isOpen={isHojaModalOpen}
        onClose={() => setIsHojaModalOpen(false)}
        orden={orden}
      />

      {/* Modal Etiqueta Térmica Adhesiva con QR */}
      <EtiquetaQRModal
        isOpen={isEtiquetaModalOpen}
        onClose={() => setIsEtiquetaModalOpen(false)}
        orden={orden}
      />

      {/* Modal Registrar Abono / Pago */}
      <PagoFormModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        ordenId={orden.id}
        ordenNumero={orden.numero}
        clienteNombre={orden.cliente?.nombre || 'Cliente'}
        saldoPendiente={totales?.saldo || 0}
        totalOrden={totales?.total || 0}
        onSubmit={handleCreatePago}
      />

      {/* Modal Comprobante / Recibo de Pago */}
      <ReciboPagoModal
        isOpen={Boolean(selectedPagoForRecibo)}
        onClose={() => setSelectedPagoForRecibo(null)}
        pago={selectedPagoForRecibo}
        ordenNumero={orden.numero}
        clienteNombre={orden.cliente?.nombre || 'Cliente'}
        clienteTelefono={orden.cliente?.whatsapp || orden.cliente?.telefono}
        totalOrden={totales?.total || 0}
        saldoRestante={totales?.saldo || 0}
      />

      {/* Modal Configuración de Descuentos e ITBMS */}
      <DescuentoModal
        isOpen={isDescuentoModalOpen}
        onClose={() => setIsDescuentoModalOpen(false)}
        currentTipo={orden.descuento_tipo}
        currentValor={orden.descuento_valor}
        currentMotivo={orden.descuento_motivo}
        currentItbms={orden.itbms_pct}
        subtotal={totales?.subtotal || 0}
        onSave={handleSaveDescuento}
      />

      {/* Modal Generar Informe Técnico con Firmas */}
      {orden && (
        <GenerarInformeModal
          isOpen={isGenerarInformeOpen}
          onClose={() => setIsGenerarInformeOpen(false)}
          orden={orden}
          onInformeGenerado={(nuevoInforme) => {
            setInforme(nuevoInforme);
            setFeedback({ text: `Informe técnico ${nuevoInforme.numero} generado con éxito`, type: 'success' });
            setIsInformeViewerOpen(true);
            HistorialService.getByOrden(orden.id).then(setHistorial);
          }}
        />
      )}

      {/* Modal Visualizador y Descarga PDF del Informe Técnico */}
      <InformeViewerModal
        isOpen={isInformeViewerOpen}
        onClose={() => setIsInformeViewerOpen(false)}
        informe={informe}
        onRefirmar={() => {
          setIsInformeViewerOpen(false);
          setIsGenerarInformeOpen(true);
        }}
      />

      {/* Preview Foto ampliada */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewPhoto} alt="Foto ampliada" className="rounded-2xl max-w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
