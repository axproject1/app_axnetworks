import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface AprobacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenNumero: string;
  defaultClienteNombre?: string;
  onConfirm: (data: { aprobado_por: string; aprobado_via: string; nota?: string }) => Promise<void>;
}

export function AprobacionModal({
  isOpen,
  onClose,
  ordenNumero,
  defaultClienteNombre,
  onConfirm,
}: AprobacionModalProps) {
  const [aprobadoPor, setAprobadoPor] = useState(defaultClienteNombre || '');
  const [aprobadoVia, setAprobadoVia] = useState('WhatsApp');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aprobadoPor.trim()) {
      alert('Por favor indica el nombre de la persona que autorizó el presupuesto.');
      return;
    }

    try {
      setLoading(true);
      await onConfirm({
        aprobado_por: aprobadoPor.trim(),
        aprobado_via: aprobadoVia,
        nota: nota.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al registrar la aprobación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Aprobación de Presupuesto"
      description={`Autorización técnica requerida para la orden ${ordenNumero}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            Una vez registrada la aprobación, la orden podrá avanzar a los estados de <strong>En Reparación</strong>, <strong>Listo para Retiro</strong> y <strong>Entregado</strong>.
          </p>
        </div>

        <Input
          label="Nombre de Quien Autoriza"
          placeholder="Ej: Lic. Roberto Icaza"
          value={aprobadoPor}
          onChange={(e) => setAprobadoPor(e.target.value)}
          required
        />

        <Select
          label="Medio de Autorización"
          value={aprobadoVia}
          onChange={(e) => setAprobadoVia(e.target.value)}
        >
          <option value="WhatsApp">WhatsApp (Chat / Audio)</option>
          <option value="Llamada Telefónica">Llamada Telefónica</option>
          <option value="Firma Presencial">Firma Presencial en Taller</option>
          <option value="Correo Electrónico">Correo Electrónico</option>
          <option value="Verbal en Recepción">Verbal en Recepción</option>
        </Select>

        <Textarea
          label="Notas u Observaciones del Acuerdo"
          placeholder="Ej: Autorizó cambio de pasta térmica y limpieza. Máximo $50..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirmar Aprobación
          </Button>
        </div>
      </form>
    </Modal>
  );
}
