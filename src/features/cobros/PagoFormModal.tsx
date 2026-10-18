import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatCurrency } from '@/lib/formatters';
import { MetodoPago } from '@/types/database';
import { DollarSign, CreditCard, Check, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface PagoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenId: string;
  ordenNumero: string;
  clienteNombre: string;
  saldoPendiente: number;
  totalOrden: number;
  onSubmit: (data: {
    monto: number;
    metodo: MetodoPago;
    referencia?: string | null;
    nota?: string | null;
  }) => Promise<void>;
}

export function PagoFormModal({
  isOpen,
  onClose,
  ordenId,
  ordenNumero,
  clienteNombre,
  saldoPendiente,
  totalOrden,
  onSubmit,
}: PagoFormModalProps) {
  const [monto, setMonto] = useState<number | ''>(saldoPendiente > 0 ? saldoPendiente : '');
  const [metodo, setMetodo] = useState<MetodoPago>('yappy');
  const [referencia, setReferencia] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  // Al abrirse con nuevo saldo
  React.useEffect(() => {
    if (isOpen) {
      setMonto(saldoPendiente > 0 ? saldoPendiente : '');
      setReferencia('');
      setNota('');
    }
  }, [isOpen, saldoPendiente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = Number(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      alert('Ingresa un monto válido mayor a $0.00');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        monto: numMonto,
        metodo,
        referencia: referencia.trim() || null,
        nota: nota.trim() || null,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Abono o Pago"
      description={`Orden ${ordenNumero} · Cliente: ${clienteNombre}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balances Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total de la Orden:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(totalOrden)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Saldo Pendiente Actual:</span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
              {formatCurrency(saldoPendiente)}
            </span>
          </div>

          {saldoPendiente > 0 && (
            <button
              type="button"
              onClick={() => setMonto(saldoPendiente)}
              className="w-full mt-1 py-1.5 px-3 rounded-xl text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-950/70 border border-brand-200 dark:border-brand-800 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Auto-llenar Saldo Completo ({formatCurrency(saldoPendiente)})
            </button>
          )}
        </div>

        {/* Monto Input */}
        <Input
          label="Monto a Abonar ($ USD)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
          leftIcon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          required
        />

        {/* Método de Pago */}
        <Select
          label="Método de Pago"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value as MetodoPago)}
        >
          <option value="yappy">Yappy (Banco General Panamá)</option>
          <option value="efectivo">Efectivo en Taller / Entrega</option>
          <option value="transferencia_ach">Transferencia Bancaria ACH</option>
          <option value="tarjeta">Tarjeta de Crédito / Débito (POS)</option>
          <option value="otro">Otro Método</option>
        </Select>

        {/* Referencia */}
        <Input
          label="Número de Referencia o Confirmación"
          placeholder="Ej: YAP-981240 / ACH-110293 / Transacción POS"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          helperText="Recomendado para auditoría en Yappy y transferencias bancarias"
        />

        {/* Nota */}
        <Textarea
          label="Observaciones del Pago (Opcional)"
          placeholder="Detalles adicionales sobre el recibo..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
        />

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <CreditCard className="w-4 h-4 mr-1.5" />
            Registrar Pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}
