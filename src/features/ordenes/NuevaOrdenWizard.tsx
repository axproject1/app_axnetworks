import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClientesService, EquiposService, OrdenesService, PerfilesService, UbicacionesService } from '@/lib/storage';
import { Cliente, Equipo, Perfil, Ubicacion, TipoServicio, Prioridad } from '@/types/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { ClienteFormModal } from '@/features/clientes/ClienteFormModal';
import { EquipoFormModal } from '@/features/equipos/EquipoFormModal';
import { HojaIngresoModal } from './HojaIngresoModal';
import { EtiquetaQRModal } from '@/features/etiquetas/EtiquetaQRModal';
import { compressImage } from '@/lib/imageUtils';
import { formatPanamaPhone } from '@/lib/formatters';
import {
  User,
  Laptop,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

export function NuevaOrdenWizard() {
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Data lists
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteEquipos, setClienteEquipos] = useState<Equipo[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  // Wizard form state
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');

  const [fallaReportada, setFallaReportada] = useState('');
  const [estadoFisico, setEstadoFisico] = useState('');
  const [accesorios, setAccesorios] = useState('');

  const [fotosIngreso, setFotosIngreso] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const [tipoServicio, setTipoServicio] = useState<TipoServicio>('taller');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [tecnicoId, setTecnicoId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });

  // Modals for creating new client/equipment inline
  const [isNewClienteModalOpen, setIsNewClienteModalOpen] = useState(false);
  const [isNewEquipoModalOpen, setIsNewEquipoModalOpen] = useState(false);

  // Success Hoja de Ingreso & Etiqueta modal
  const [createdOrden, setCreatedOrden] = useState<any>(null);
  const [isHojaModalOpen, setIsHojaModalOpen] = useState(false);
  const [isEtiquetaModalOpen, setIsEtiquetaModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    Promise.all([
      ClientesService.getAll(),
      PerfilesService.getTecnicos(),
      UbicacionesService.getAll(),
    ]).then(([clis, tecs, ubis]) => {
      setClientes(clis);
      setTecnicos(tecs);
      setUbicaciones(ubis);

      if (ubis.length > 0) {
        setUbicacionId(ubis[0].id);
      }
      if (tecs.length > 0) {
        setTecnicoId(tecs[0].id);
      }

      // Check URL query params (?clienteId=...&equipoId=...)
      const paramCliId = searchParams.get('clienteId');
      if (paramCliId) {
        const foundCli = clis.find((c) => c.id === paramCliId);
        if (foundCli) {
          setSelectedCliente(foundCli);
          EquiposService.getByCliente(foundCli.id).then((eqs) => {
            setClienteEquipos(eqs);
            const paramEqId = searchParams.get('equipoId');
            if (paramEqId) {
              const foundEq = eqs.find((e) => e.id === paramEqId);
              if (foundEq) setSelectedEquipo(foundEq);
            }
          });
        }
      }
    });
  }, [searchParams]);

  // Load equipment when client changes
  const handleSelectCliente = async (cli: Cliente) => {
    setSelectedCliente(cli);
    setSelectedEquipo(null);
    const eqs = await EquiposService.getByCliente(cli.id);
    setClienteEquipos(eqs);
  };

  // Image Upload handler with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCompressing(true);
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressedBase64 = await compressImage(files[i], 1280, 1280, 0.75);
        newImages.push(compressedBase64);
      }
      setFotosIngreso((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Error al procesar la imagen.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const removeFoto = (index: number) => {
    setFotosIngreso((prev) => prev.filter((_, i) => i !== index));
  };

  // Final submit
  const handleSaveOrden = async () => {
    if (!selectedCliente) {
      alert('Debes seleccionar un cliente.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cliente_id: selectedCliente.id,
        equipo_id: selectedEquipo?.id || null,
        tipo_servicio: tipoServicio,
        prioridad: prioridad,
        estado: 'recibido' as const,
        ubicacion_id: ubicacionId || null,
        tecnico_id: tecnicoId || null,
        falla_reportada: fallaReportada || null,
        estado_fisico_ingreso: estadoFisico || null,
        diagnostico: null,
        trabajo_realizado: null,
        recomendaciones: null,
        presupuesto_aprobado: false,
        aprobado_en: null,
        aprobado_por: null,
        aprobado_via: null,
        descuento_tipo: 'ninguno' as const,
        descuento_valor: 0,
        descuento_motivo: null,
        itbms_pct: 7,
        fecha_ingreso: new Date().toISOString(),
        fecha_estimada: fechaEstimada || null,
        fecha_entrega: null,
        created_by: null,
      };

      const newOrden = await OrdenesService.create(payload, fotosIngreso);
      setCreatedOrden(newOrden);
      setIsHojaModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Error al crear la orden de servicio');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter clients for step 1
  const filteredClientes = clientes.filter((c) => {
    const q = clienteSearch.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.empresa && c.empresa.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q))
    );
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          Asistente de Ingreso de Nueva Orden
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Flujo guiado para registrar cliente, dispositivo, fotos y generar la hoja de ingreso con QR.
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="grid grid-cols-5 gap-2 pb-2">
        {[
          { num: 1, label: 'Cliente' },
          { num: 2, label: 'Equipo' },
          { num: 3, label: 'Falla & Estado' },
          { num: 4, label: 'Fotos' },
          { num: 5, label: 'Servicio' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            disabled={s.num > step}
            className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
              step === s.num
                ? 'bg-brand-600 text-white shadow-sm'
                : step > s.num
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-xs font-bold">
              {step > s.num ? '✓' : `Paso ${s.num}`}
            </span>
            <span className="text-[10px] hidden sm:inline truncate max-w-[80px]">
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* WIZARD CONTAINER */}
      <Card>
        {/* STEP 1: CLIENTE */}
        {step === 1 && (
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 1: Seleccionar o Registrar Cliente
                </h3>
                <p className="text-xs text-slate-500">
                  Busca un cliente existente o regístralo al instante sin perder el avance.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewClienteModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Crear Cliente
              </Button>
            </div>

            <Input
              placeholder="Buscar por nombre, empresa o teléfono..."
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            {selectedCliente && (
              <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedCliente.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedCliente.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedCliente.empresa ? `${selectedCliente.empresa} · ` : ''}
                      {formatPanamaPhone(selectedCliente.telefono || selectedCliente.whatsapp)}
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="sm">
                  Seleccionado
                </Badge>
              </div>
            )}

            {/* Lista de clientes para seleccionar */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl">
              {filteredClientes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCliente(c)}
                  className={`w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    selectedCliente?.id === c.id
                      ? 'bg-brand-50/60 dark:bg-brand-950/20'
                      : ''
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {c.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {c.empresa ? `${c.empresa} · ` : ''}
                      {formatPanamaPhone(c.telefono || c.whatsapp) || 'Sin teléfono'}
                    </p>
                  </div>
                  {selectedCliente?.id === c.id && (
                    <Check className="w-4 h-4 text-brand-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        )}

        {/* STEP 2: EQUIPO */}
        {step === 2 && (
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 2: Dispositivo a Reparar / Optimizar
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong className="text-slate-800 dark:text-slate-200">{selectedCliente?.nombre}</strong>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewEquipoModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Registrar Nuevo Equipo
              </Button>
            </div>

            {clienteEquipos.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl space-y-3">
                <Laptop className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  Este cliente no tiene ningún equipo registrado previamente.
                </p>
                <Button size="sm" onClick={() => setIsNewEquipoModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Registrar Equipo Ahora
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clienteEquipos.map((eq) => (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEquipo(eq)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all text-left space-y-1.5 ${
                      selectedEquipo?.id === eq.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {eq.tipo}
                      </span>
                      {selectedEquipo?.id === eq.id ? (
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded-full">
                          Seleccionado
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400">
                          {eq.serie || 'S/N'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {eq.marca} {eq.modelo}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {[eq.procesador, eq.ram, eq.almacenamiento].filter(Boolean).join(' · ') || 'Sin hardware detallado'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}

        {/* STEP 3: FALLA Y ESTADO */}
        {step === 3 && (
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 3: Falla Reportada y Estado Físico
              </h3>
              <p className="text-xs text-slate-500">
                Documenta el motivo de ingreso y los detalles estéticos del equipo recibido.
              </p>
            </div>

            <Textarea
              label="Falla o Problema Reportado por el Cliente"
              placeholder="Ej: Se apaga al ejecutar programas pesados. Pantalla parpadea en azul. Derrame accidental de café hace 2 días..."
              value={fallaReportada}
              onChange={(e) => setFallaReportada(e.target.value)}
              required
              rows={3}
            />

            <Textarea
              label="Estado Físico al Ingreso (Rayones, Bisagras, Golpes)"
              placeholder="Ej: Rayón visible en tapa superior derecha, bisagra izquierda floja, pantalla sin roturas..."
              value={estadoFisico}
              onChange={(e) => setEstadoFisico(e.target.value)}
              rows={2}
            />

            <Input
              label="Accesorios Dejados (Cargador, bolso, mouse, cables)"
              placeholder="Ej: Cargador original Dell 65W tipo C, bolso negro"
              value={accesorios}
              onChange={(e) => setAccesorios(e.target.value)}
            />
          </CardContent>
        )}

        {/* STEP 4: FOTOS DE INGRESO */}
        {step === 4 && (
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 4: Fotos de Ingreso y Evidencia
                </h3>
                <p className="text-xs text-slate-500">
                  Captura o sube fotos del estado físico. Se comprimen automáticamente del lado del cliente.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30">
              <Camera className="w-8 h-8 text-brand-500 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {compressing ? 'Comprimiendo fotos...' : 'Tomar foto o subir desde la galería'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Formatos JPG, PNG, WebP (compresión automática)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={compressing}
              />
            </label>

            {/* Gallery Preview */}
            {fotosIngreso.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {fotosIngreso.map((src, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={src}
                      alt={`Foto ingreso ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFoto(index)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}

        {/* STEP 5: TIPO DE SERVICIO Y ASIGNACIÓN */}
        {step === 5 && (
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 5: Modalidad de Servicio y Asignación
              </h3>
              <p className="text-xs text-slate-500">
                Establece la prioridad, técnico responsable, ubicación física y fecha de entrega.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Modalidad del Servicio"
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value as TipoServicio)}
              >
                <option value="taller">En Taller (AX Network)</option>
                <option value="domicilio">A Domicilio / Oficina del Cliente</option>
                <option value="remoto">Soporte Técnico Remoto</option>
              </Select>

              <Select
                label="Nivel de Prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              >
                <option value="baja">Baja</option>
                <option value="media">Media (Normal)</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Select>

              <Select
                label="Técnico Responsable Asignado"
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
              >
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.rol})
                  </option>
                ))}
              </Select>

              <Select
                label="Ubicación Física en Taller"
                value={ubicacionId}
                onChange={(e) => setUbicacionId(e.target.value)}
              >
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </Select>

              <Input
                label="Fecha Estimada de Entrega"
                type="date"
                value={fechaEstimada}
                onChange={(e) => setFechaEstimada(e.target.value)}
                leftIcon={<Clock className="w-4 h-4" />}
              />
            </div>

            {/* Resumen Final Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Resumen de Ingreso
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-bold">
                Cliente: {selectedCliente?.nombre} · Equipo: {selectedEquipo ? `${selectedEquipo.tipo} ${selectedEquipo.marca}` : 'Sin equipo asociado'}
              </p>
              <p className="text-slate-500">
                Falla: {fallaReportada || 'Revisión técnica general'} · {fotosIngreso.length} foto(s) adjuntas
              </p>
            </div>
          </CardContent>
        )}

        {/* WIZARD NAVIGATION FOOTER */}
        <CardFooter className="flex items-center justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate('/ordenes'))}
            disabled={submitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (step === 1 && !selectedCliente) {
                  alert('Por favor selecciona un cliente antes de avanzar.');
                  return;
                }
                setStep(step + 1);
              }}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleSaveOrden}
              isLoading={submitting}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Generar Orden y Hoja de Ingreso
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Modal para Crear Cliente en el Paso 1 */}
      <ClienteFormModal
        isOpen={isNewClienteModalOpen}
        onClose={() => setIsNewClienteModalOpen(false)}
        onSubmit={async (data) => {
          const newCli = await ClientesService.create({
            nombre: data.nombre,
            empresa: data.empresa || null,
            telefono: data.telefono || null,
            whatsapp: data.whatsapp || null,
            email: data.email || null,
            direccion: data.direccion || null,
            notas: data.notas || null,
          });
          setClientes((prev) => [newCli, ...prev]);
          handleSelectCliente(newCli);
        }}
      />

      {/* Modal para Crear Equipo en el Paso 2 */}
      {selectedCliente && (
        <EquipoFormModal
          isOpen={isNewEquipoModalOpen}
          onClose={() => setIsNewEquipoModalOpen(false)}
          defaultClienteId={selectedCliente.id}
          onSuccess={(newEq) => {
            setClienteEquipos((prev) => [newEq, ...prev]);
            setSelectedEquipo(newEq);
          }}
        />
      )}

      {/* Modal de Hoja de Ingreso al Guardar con Éxito */}
      <HojaIngresoModal
        isOpen={isHojaModalOpen}
        onClose={() => {
          setIsHojaModalOpen(false);
          setIsEtiquetaModalOpen(true);
        }}
        orden={createdOrden}
      />

      {/* Modal de Etiqueta Térmica Adhesiva al Guardar con Éxito */}
      <EtiquetaQRModal
        isOpen={isEtiquetaModalOpen}
        onClose={() => {
          setIsEtiquetaModalOpen(false);
          navigate(`/ordenes/${createdOrden?.id || ''}`);
        }}
        orden={createdOrden}
      />
    </div>
  );
}
