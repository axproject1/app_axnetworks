import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Gasto, Orden } from '@/types/database';
import { OrdenesService, GastosService } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIA_GASTO_CONFIG } from '@/lib/formatters';
import { DollarSign, Tag, Calendar, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gastoToEdit?: Gasto | null;
  onSuccess: () => void;
}

export function GastoFormModal({
  isOpen,
  onClose,
  gastoToEdit,
  onSuccess,
}: GastoFormModalProps) {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<string>('repuestos');
  const [monto, setMonto] = useState<number | ''>('');
  const [ordenId, setOrdenId] = useState<string>('');
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      OrdenesService.getAll().then((list) => {
        // Mostrar órdenes no canceladas
        setOrdenes(list.filter((o) => o.estado !== 'cancelado'));
      });

      if (gastoToEdit) {
        setFecha(gastoToEdit.fecha || new Date().toISOString().slice(0, 10));
        setConcepto(gastoToEdit.concepto);
        setCategoria(gastoToEdit.categoria || 'repuestos');
        setMonto(gastoToEdit.monto);
        setOrdenId(gastoToEdit.orden_id || '');
      } else {
        setFecha(new Date().toISOString().slice(0, 10));
        setConcepto('');
        setCategoria('repuestos');
        setMonto('');
        setOrdenId('');
      }
      setError(null);
    }
  }, [isOpen, gastoToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!concepto.trim()) {
      setError('Por favor describe el concepto o descripción del gasto.');
      return;
    }

    const numMonto = Number(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setError('El monto debe ser una cifra numérica mayor a $0.00');
      return;
    }

    try {
      setLoading(true);
      if (gastoToEdit) {
        await GastosService.update(gastoToEdit.id, {
          fecha,
          concepto: concepto.trim(),
          categoria,
          monto: numMonto,
          orden_id: ordenId || null,
        });
      } else {
        await GastosService.create({
          fecha,
          concepto: concepto.trim(),
          categoria,
          monto: numMonto,
          orden_id: ordenId || null,
          registrado_por: user?.id || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gastoToEdit ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto / Egreso'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Fecha del Gasto
            </label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Categoría
            </label>
            <Select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              options={Object.entries(CATEGORIA_GASTO_CONFIG).map(([key, val]) => ({
                value: key,
                label: val.label,
              }))}
            />
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Monto del Gasto (USD $)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="pl-7 font-bold text-base"
              required
            />
          </div>
        </div>

        {/* Concepto / Descripción */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Concepto o Detalle
          </label>
          <Textarea
            rows={2}
            placeholder="Ej: Compra de disco SSD NVMe 1TB Kingston NV2 para repuesto de taller"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            required
          />
        </div>

        {/* Orden Vinculada (Opcional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-brand-600" />
            Vincular a Orden de Trabajo (Opcional)
          </label>
          <Select
            value={ordenId}
            onChange={(e) => setOrdenId(e.target.value)}
            options={[
              { value: '', label: 'Sin vincular a orden específica (Gasto general)' },
              ...ordenes.map((o) => ({
                value: o.id,
                label: `${o.numero} — ${o.cliente?.nombre || 'Cliente'} (${o.equipo?.tipo || 'Equipo'})`,
              })),
            ]}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Si el repuesto o viático fue destinado a un trabajo específico, vincúlalo para calcular la rentabilidad por orden.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold">
            {loading ? 'Guardando...' : gastoToEdit ? 'Actualizar Gasto' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
