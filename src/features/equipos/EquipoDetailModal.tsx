import React from 'react';
import { Equipo } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPanamaPhone, cleanWhatsAppNumber } from '@/lib/formatters';
import {
  Laptop,
  Cpu,
  HardDrive,
  User,
  Phone,
  MessageSquare,
  Tag,
  Package,
  Calendar,
  PlusCircle,
  Edit2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EquipoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo | null;
  onEdit: (equipo: Equipo) => void;
}

export function EquipoDetailModal({
  isOpen,
  onClose,
  equipo,
  onEdit,
}: EquipoDetailModalProps) {
  const navigate = useNavigate();

  if (!equipo) return null;

  const cliente = equipo.cliente;
  const waNumber = cliente ? cleanWhatsAppNumber(cliente.whatsapp || cliente.telefono) : null;
  const waUrl = waNumber ? `https://wa.me/${waNumber}` : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha Técnica del Dispositivo"
      description={`Registrado el ${formatDate(equipo.created_at)}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Hero Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {equipo.tipo}
                </h4>
                {equipo.marca && (
                  <Badge variant="primary" size="sm">
                    {equipo.marca}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {equipo.modelo || 'Modelo estándar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(equipo);
              }}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Editar Equipo
            </Button>
          </div>
        </div>

        {/* Número de Serie Destacado */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-darkBg-card">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Tag className="w-4 h-4 text-brand-500" />
            <span>Número de Serie (S/N):</span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {equipo.serie || 'NO ESPECIFICADO'}
          </span>
        </div>

        {/* Hardware Specs Grid */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-500" />
            Componentes de Hardware
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card">
              <span className="text-slate-400 block mb-0.5">Procesador</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {equipo.procesador || '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card">
              <span className="text-slate-400 block mb-0.5">Memoria RAM</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {equipo.ram || '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card">
              <span className="text-slate-400 block mb-0.5">Almacenamiento (Disco)</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {equipo.almacenamiento || '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card">
              <span className="text-slate-400 block mb-0.5">Sistema Operativo</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {equipo.sistema_operativo || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Accesorios y Notas */}
        {(equipo.accesorios || equipo.notas) && (
          <div className="space-y-3">
            {equipo.accesorios && (
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card text-xs">
                <span className="text-slate-400 flex items-center gap-1 mb-1 font-semibold">
                  <Package className="w-3.5 h-3.5" /> Accesorios Registrados
                </span>
                <p className="text-slate-700 dark:text-slate-300">{equipo.accesorios}</p>
              </div>
            )}

            {equipo.notas && (
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkBg-card text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">Notas Técnicas</span>
                <p className="text-slate-700 dark:text-slate-300">{equipo.notas}</p>
              </div>
            )}
          </div>
        )}

        {/* Cliente Propietario Card */}
        {cliente && (
          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Cliente Propietario
              </span>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Abrir WhatsApp
                </a>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{cliente.nombre}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {cliente.empresa ? `${cliente.empresa} · ` : ''}
              {formatPanamaPhone(cliente.telefono || cliente.whatsapp)}
            </p>
          </div>
        )}

        {/* Generar Orden para este equipo */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={() => {
              onClose();
              navigate(`/ordenes/nueva?clienteId=${equipo.cliente_id}&equipoId=${equipo.id}`);
            }}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Crear Orden para este Equipo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
