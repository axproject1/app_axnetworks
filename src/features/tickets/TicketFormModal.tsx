import React, { useState, useEffect } from 'react';
import { Ticket, Cliente, Perfil, TipoServicio, Prioridad, EstadoTicket } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ClientesService, UsuariosService, TicketsService } from '@/lib/storage';
import { AlertTriangle, Tag, User, Wrench, Laptop, MapPin } from 'lucide-react';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit?: Ticket | null;
  onSaved: (ticket: Ticket) => void;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  ticketToEdit,
  onSaved,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>('remoto');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [estado, setEstado] = useState<EstadoTicket>('abierto');
  const [tecnicoId, setTecnicoId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [cliList, perfilesList] = await Promise.all([
          ClientesService.getAll(),
          UsuariosService.getAll(),
        ]);
        setClientes(cliList);
        setTecnicos(perfilesList.filter((p: Perfil) => p.rol === 'tecnico' || p.rol === 'dueno'));

        if (ticketToEdit) {
          setClienteId(ticketToEdit.cliente_id);
          setTitulo(ticketToEdit.titulo);
          setDescripcion(ticketToEdit.descripcion || '');
          setTipoServicio(ticketToEdit.tipo_servicio);
          setPrioridad(ticketToEdit.prioridad);
          setEstado(ticketToEdit.estado);
          setTecnicoId(ticketToEdit.tecnico_id || '');
        } else {
          if (cliList.length > 0) setClienteId(cliList[0].id);
          setTitulo('');
          setDescripcion('');
          setTipoServicio('remoto');
          setPrioridad('media');
          setEstado('abierto');
          setTecnicoId('');
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };

    loadData();
  }, [isOpen, ticketToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !titulo.trim()) {
      setErrorMsg('Cliente y título del ticket son requeridos.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (ticketToEdit) {
        const updated = await TicketsService.update(ticketToEdit.id, {
          cliente_id: clienteId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          tipo_servicio: tipoServicio,
          prioridad,
          estado,
          tecnico_id: tecnicoId || null,
        });
        onSaved(updated);
      } else {
        const created = await TicketsService.create({
          cliente_id: clienteId,
          orden_id: null,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          tipo_servicio: tipoServicio,
          prioridad,
          estado,
          tecnico_id: tecnicoId || null,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar ticket:', err);
      setErrorMsg(err.message || 'Error al guardar el ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticketToEdit ? 'Editar Ticket de Soporte' : 'Nuevo Ticket de Soporte'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cliente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cliente *
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            required
          >
            <option value="">Seleccione un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.empresa ? `(${c.empresa})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Título */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Asunto / Título del Ticket *
          </label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Falla en conexión VPN, pantalla azul o lentitud"
            required
          />
        </div>

        {/* Modalidad y Prioridad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Modalidad de Atención
            </label>
            <select
              value={tipoServicio}
              onChange={(e) => setTipoServicio(e.target.value as TipoServicio)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="remoto">Remoto (AnyDesk / En línea)</option>
              <option value="domicilio">Domicilio / Visita presencial</option>
              <option value="taller">Taller Central AX Network</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="baja">Baja (SLA estándar 48h)</option>
              <option value="media">Media (SLA 24h)</option>
              <option value="alta">Alta (SLA 8h)</option>
              <option value="urgente">Urgente (SLA 4h)</option>
            </select>
          </div>
        </div>

        {/* Técnico Asignado y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Técnico Asignado
            </label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="">Sin asignar (cola general)</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoTicket)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
            >
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        {/* Descripción detallada */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descripción Detallada del Problema
          </label>
          <textarea
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles reportados por el usuario, síntomas, mensajes de error..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-axBlue hover:bg-axBlueHover text-white font-semibold"
          >
            {saving ? 'Guardando...' : ticketToEdit ? 'Actualizar Ticket' : 'Crear Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
