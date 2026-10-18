import React, { useState, useEffect } from 'react';
import { Orden, PlantillaClausula, Informe, OrdenItem, VOrdenTotales } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ClausulasService, InformesService, OrdenItemsService, OrdenesService } from '@/lib/storage';
import { SignatureCanvas } from './SignatureCanvas';
import { 
  FileText, 
  ShieldCheck, 
  PenTool, 
  AlertTriangle, 
  Check, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface GenerarInformeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: Orden;
  onInformeGenerado: (informe: Informe) => void;
}

export const GenerarInformeModal: React.FC<GenerarInformeModalProps> = ({
  isOpen,
  onClose,
  orden,
  onInformeGenerado,
}) => {
  const [clausulas, setClausulas] = useState<PlantillaClausula[]>([]);
  const [clausulasActivas, setClausulasActivas] = useState<Record<string, boolean>>({});
  const [garantiaDias, setGarantiaDias] = useState<number>(30);
  const [garantiaCubre, setGarantiaCubre] = useState(
    'Mano de obra del servicio técnico realizado y repuestos instalados detallados en este informe.'
  );
  const [garantiaExcluye, setGarantiaExcluye] = useState(
    'No cubre caídas, derrame de líquidos, variaciones eléctricas, desgaste natural, ni manipulación de software/hardware por terceros.'
  );

  const [firmaTecnico, setFirmaTecnico] = useState<string | null>(null);
  const [firmaCliente, setFirmaCliente] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadClausulas = async () => {
      try {
        const clsList = await ClausulasService.getAll();
        setClausulas(clsList);
        const map: Record<string, boolean> = {};
        clsList.forEach((c) => {
          map[c.id] = c.activa;
        });
        setClausulasActivas(map);
      } catch (err) {
        console.error('Error cargando cláusulas:', err);
      }
    };

    loadClausulas();
  }, [isOpen]);

  const toggleClausula = (id: string) => {
    setClausulasActivas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firmaTecnico && !firmaCliente) {
      if (!window.confirm('No has capturado firmas aún. ¿Deseas emitir el informe preliminar sin firmas?')) {
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Obtener items y totales de la orden para el snapshot permanente
      const [items, totales] = await Promise.all([
        OrdenItemsService.getByOrden(orden.id),
        OrdenesService.calculateTotales(orden),
      ]);

      // 2. Compilar cláusulas seleccionadas y reemplazar {garantia_dias}
      const selectedClausulas = clausulas
        .filter((c) => clausulasActivas[c.id])
        .map((c) => ({
          ...c,
          texto: c.texto.replace(/{garantia_dias}/g, String(garantiaDias)),
        }));

      // 3. Crear snapshot inmutable
      const snapshot = {
        orden: {
          numero: orden.numero,
          tipo_servicio: orden.tipo_servicio,
          prioridad: orden.prioridad,
          estado: orden.estado,
          fecha_ingreso: orden.fecha_ingreso,
          fecha_entrega: orden.fecha_entrega || new Date().toISOString(),
          falla_reportada: orden.falla_reportada,
          diagnostico: orden.diagnostico,
          trabajo_realizado: orden.trabajo_realizado,
          recomendaciones: orden.recomendaciones,
          descuento_tipo: orden.descuento_tipo,
          descuento_valor: orden.descuento_valor,
          itbms_pct: orden.itbms_pct,
        },
        cliente: orden.cliente,
        equipo: orden.equipo,
        tecnico: orden.tecnico,
        items,
        totales,
      };

      // 4. Guardar informe
      const nuevoInforme = await InformesService.create({
        orden_id: orden.id,
        garantia_dias: garantiaDias,
        garantia_cubre: garantiaCubre.trim(),
        garantia_excluye: garantiaExcluye.trim(),
        clausulas: selectedClausulas,
        snapshot,
        firma_tecnico: firmaTecnico,
        firma_cliente: firmaCliente,
        firmado_en: new Date().toISOString(),
      });

      onInformeGenerado(nuevoInforme);
      onClose();
    } catch (err: any) {
      console.error('Error al generar informe:', err);
      setErrorMsg(err.message || 'Error al emitir el informe técnico');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Emitir Informe Técnico · ${orden.numero}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Resumen de la Orden */}
        <div className="p-3 bg-slate-50 dark:bg-darkCard rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Cliente y Equipo
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {orden.cliente?.nombre || 'Cliente'} {orden.cliente?.empresa ? `(${orden.cliente.empresa})` : ''}
            </p>
            <p className="text-[11px] text-slate-500">
              {orden.equipo ? `${orden.equipo.tipo} ${orden.equipo.marca} ${orden.equipo.modelo} · S/N: ${orden.equipo.serie || 'S/N'}` : 'Sin equipo registrado'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Técnico a Cargo
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {orden.tecnico?.nombre || 'Técnico AX Network'}
            </p>
          </div>
        </div>

        {/* Términos de Garantía */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Términos de Garantía
            </h4>

            {/* Selector de días */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 mr-1">Vigencia:</span>
              {[15, 30, 60, 90].map((dias) => (
                <button
                  key={dias}
                  type="button"
                  onClick={() => setGarantiaDias(dias)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                    garantiaDias === dias
                      ? 'bg-axBlue text-white border-axBlue'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkBg'
                  }`}
                >
                  {dias}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                La Garantía Cubre:
              </label>
              <textarea
                rows={2}
                value={garantiaCubre}
                onChange={(e) => setGarantiaCubre(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Exclusiones de Garantía:
              </label>
              <textarea
                rows={2}
                value={garantiaExcluye}
                onChange={(e) => setGarantiaExcluye(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Cláusulas Legales y Condiciones */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
            Cláusulas del Taller Incluidas en el Documento:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {clausulas.map((cls) => {
              const active = clausulasActivas[cls.id] ?? cls.activa;
              return (
                <label
                  key={cls.id}
                  className={`p-2 rounded-lg border text-xs flex items-start gap-2 cursor-pointer transition-all ${
                    active
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-slate-800 dark:text-slate-100'
                      : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleClausula(cls.id)}
                    className="mt-0.5 rounded border-slate-300 text-axBlue focus:ring-axBlue"
                  />
                  <div>
                    <span className="font-semibold block">{cls.orden}. {cls.titulo}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-2">{cls.texto}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Doble Firma Digital Táctil */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-axBlue" />
              Firmas Digitales de Conformidad
            </h4>
            <span className="text-[10px] text-slate-400">
              Captura táctil en celular, tablet o con mouse
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Firma del Técnico */}
            <SignatureCanvas
              label="Firma del Técnico Responsable"
              name={orden.tecnico?.nombre || 'Técnico AX Network'}
              onChange={(data) => setFirmaTecnico(data)}
            />

            {/* Firma del Cliente */}
            <SignatureCanvas
              label="Firma de Conformidad del Cliente"
              name={orden.cliente?.nombre || 'Cliente'}
              onChange={(data) => setFirmaCliente(data)}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-axBlue hover:bg-axBlueHover text-white font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>{saving ? 'Generando Informe...' : 'Emitir y Guardar Informe Técnico'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
