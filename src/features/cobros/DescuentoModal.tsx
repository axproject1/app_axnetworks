import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TipoDescuento } from '@/types/database';
import { Percent, DollarSign, Tag, Check } from 'lucide-react';

interface DescuentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTipo: TipoDescuento;
  currentValor: number;
  currentMotivo: string | null;
  currentItbms: number;
  subtotal: number;
  onSave: (data: {
    descuento_tipo: TipoDescuento;
    descuento_valor: number;
    descuento_motivo: string | null;
    itbms_pct: number;
  }) => Promise<void>;
}

export function DescuentoModal({
  isOpen,
  onClose,
  currentTipo,
  currentValor,
  currentMotivo,
  currentItbms,
  subtotal,
  onSave,
}: DescuentoModalProps) {
  const [tipo, setTipo] = useState<TipoDescuento>(currentTipo);
  const [valor, setValor] = useState<number>(currentValor);
  const [motivo, setMotivo] = useState<string>(currentMotivo || '');
  const [itbms, setItbms] = useState<number>(currentItbms);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTipo(currentTipo);
      setValor(currentValor);
      setMotivo(currentMotivo || '');
      setItbms(currentItbms);
    }
  }, [isOpen, currentTipo, currentValor, currentMotivo, currentItbms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipo !== 'ninguno' && valor > 0 && !motivo.trim()) {
      alert('Debes indicar el motivo del descuento otorgado.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        descuento_tipo: tipo,
        descuento_valor: tipo === 'ninguno' ? 0 : Number(valor),
        descuento_motivo: tipo === 'ninguno' ? null : motivo.trim() || null,
        itbms_pct: Number(itbms),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar configuración económica');
    } finally {
      setLoading(false);
    }
  };

  // Preview de descuento calculado
  let calculatedDescuento = 0;
  if (tipo === 'porcentaje') {
    calculatedDescuento = Math.round((subtotal * Number(valor) / 100) * 100) / 100;
  } else if (tipo === 'monto') {
    calculatedDescuento = Math.min(Number(valor), subtotal);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de Descuentos e Impuestos"
      description="Aplica descuentos autorizados y configura la tasa de ITBMS de Panamá."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de tipo de descuento */}
        <Select
          label="Modalidad de Descuento"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDescuento)}
        >
          <option value="ninguno">Sin Descuento</option>
          <option value="porcentaje">Porcentaje de Descuento (%)</option>
          <option value="monto">Monto Fijo en Dólares ($)</option>
        </Select>

        {tipo !== 'ninguno' && (
          <>
            <Input
              label={tipo === 'porcentaje' ? 'Porcentaje de Descuento (%)' : 'Monto de Descuento ($ USD)'}
              type="number"
              step="0.01"
              min="0"
              max={tipo === 'porcentaje' ? 100 : subtotal}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              leftIcon={tipo === 'porcentaje' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              helperText={`Ahorro para el cliente: $${calculatedDescuento.toFixed(2)}`}
              required
            />

            <Input
              label="Motivo o Justificación del Descuento"
              placeholder="Ej: Convenio empresa, promoción aniversario, cliente frecuente..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              leftIcon={<Tag className="w-4 h-4" />}
              required
            />
          </>
        )}

        {/* Configuración de ITBMS */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Select
            label="Impuesto ITBMS (Panamá)"
            value={itbms}
            onChange={(e) => setItbms(Number(e.target.value))}
          >
            <option value={7}>7% — Tasa estándar de servicios en Panamá</option>
            <option value={0}>0% — Exento de ITBMS</option>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <Check className="w-4 h-4 mr-1.5" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
