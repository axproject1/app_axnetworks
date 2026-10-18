import React, { useState, useEffect } from 'react';
import { Cliente, Equipo } from '@/types/database';
import { EquiposService } from '@/lib/storage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPanamaPhone, cleanWhatsAppNumber, formatDate } from '@/lib/formatters';
import {
  User,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Laptop,
  Plus,
  FileText,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClienteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEdit: (cliente: Cliente) => void;
  onAddEquipo: (clienteId: string) => void;
}

export function ClienteDetailModal({
  isOpen,
  onClose,
  cliente,
  onEdit,
  onAddEquipo,
}: ClienteDetailModalProps) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (cliente?.id && isOpen) {
      setLoading(true);
      EquiposService.getByCliente(cliente.id)
        .then(setEquipos)
        .finally(() => setLoading(false));
    }
  }, [cliente?.id, isOpen]);

  if (!cliente) return null;

  const waNumber = cleanWhatsAppNumber(cliente.whatsapp || cliente.telefono);
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=Hola%20${encodeURIComponent(
        cliente.nombre
      )},%20te%20saludamos%20de%20AX%20Network%20Solutions%20Group.`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha del Cliente"
      description={`ID: ${cliente.id} · Registrado el ${formatDate(cliente.created_at)}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Hero Profile Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
              {cliente.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {cliente.nombre}
                {cliente.empresa && (
                  <Badge variant="primary" size="sm">
                    Empresa
                  </Badge>
                )}
              </h4>
              {cliente.empresa && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {cliente.empresa}
                </p>
              )}
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex items-center gap-2">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            {cliente.telefono && (
              <a
                href={`tel:${cliente.telefono.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Llamar
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(cliente);
              }}
            >
              Editar Ficha
            </Button>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-darkBg-card space-y-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {formatPanamaPhone(cliente.telefono) || 'No registrado'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-darkBg-card space-y-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Correo
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {cliente.email ? (
                <a href={`mailto:${cliente.email}`} className="text-brand-600 hover:underline">
                  {cliente.email}
                </a>
              ) : (
                'No registrado'
              )}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-darkBg-card space-y-1 sm:col-span-2">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Dirección en Panamá
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {cliente.direccion || 'Sin dirección física registrada'}
            </p>
          </div>

          {cliente.notas && (
            <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-1 sm:col-span-2">
              <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Notas Internas
              </span>
              <p className="text-amber-900 dark:text-amber-200">{cliente.notas}</p>
            </div>
          )}
        </div>

        {/* Equipos Asociados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-brand-500" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Equipos Registrados ({equipos.length})
              </h5>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onAddEquipo(cliente.id);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nuevo Equipo
            </Button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Cargando equipos...</div>
          ) : equipos.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Este cliente aún no tiene equipos registrados en el sistema.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {equipos.map((eq) => (
                <div
                  key={eq.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkBg-card hover:border-brand-500/50 transition-colors text-left space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {eq.tipo}
                    </span>
                    <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                      {eq.serie || 'S/N'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {eq.marca} {eq.modelo}
                  </p>
                  {(eq.procesador || eq.ram || eq.almacenamiento) && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {[eq.procesador, eq.ram, eq.almacenamiento].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick action: Generar nueva orden */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={() => {
              onClose();
              navigate(`/ordenes/nueva?clienteId=${cliente.id}`);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Crear Orden para este Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
