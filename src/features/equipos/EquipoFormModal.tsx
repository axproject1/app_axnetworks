import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Equipo, Cliente } from '@/types/database';
import { ClientesService, EquiposService } from '@/lib/storage';
import { Laptop, Cpu, HardDrive, ShieldCheck, Tag, Info, User } from 'lucide-react';

const equipoSchema = z.object({
  cliente_id: z.string().min(1, 'Debes seleccionar el cliente propietario'),
  tipo: z.string().min(2, 'Especifica el tipo de equipo'),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  serie: z.string().optional().nullable(),
  procesador: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  almacenamiento: z.string().optional().nullable(),
  sistema_operativo: z.string().optional().nullable(),
  accesorios: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

type EquipoFormData = z.infer<typeof equipoSchema>;

interface EquipoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipoToEdit?: Equipo | null;
  defaultClienteId?: string | null;
  onSuccess?: (equipo: Equipo) => void;
}

const TIPOS_EQUIPO = [
  'Laptop / Portátil',
  'PC de Escritorio / Torre',
  'All-in-One (Todo en Uno)',
  'Servidor Físico / Rack',
  'Router / Firewall / Switch',
  'Impresora / Multifuncional',
  'Consola de Videojuegos',
  'MacBook / iMac / Mac mini',
  'Dispositivo de Almacenamiento NAS',
  'Otro Dispositivo',
];

const SISTEMAS_OPERATIVOS = [
  'Windows 11 Pro / Home',
  'Windows 10 Pro / Home',
  'Windows Server 2022 / 2019',
  'macOS Sequoia / Sonoma',
  'Linux (Ubuntu / Debian / CentOS)',
  'MikroTik RouterOS',
  'Firmware de Red Propietario',
  'Sin Sistema / Por Instalar',
];

export function EquipoFormModal({
  isOpen,
  onClose,
  equipoToEdit,
  defaultClienteId,
  onSuccess,
}: EquipoFormModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipoFormData>({
    resolver: zodResolver(equipoSchema),
    defaultValues: {
      cliente_id: defaultClienteId || '',
      tipo: 'Laptop / Portátil',
      marca: '',
      modelo: '',
      serie: '',
      procesador: '',
      ram: '',
      almacenamiento: '',
      sistema_operativo: 'Windows 11 Pro / Home',
      accesorios: '',
      notas: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      ClientesService.getAll().then(setClientes);
    }
  }, [isOpen]);

  useEffect(() => {
    if (equipoToEdit) {
      reset({
        cliente_id: equipoToEdit.cliente_id,
        tipo: equipoToEdit.tipo,
        marca: equipoToEdit.marca || '',
        modelo: equipoToEdit.modelo || '',
        serie: equipoToEdit.serie || '',
        procesador: equipoToEdit.procesador || '',
        ram: equipoToEdit.ram || '',
        almacenamiento: equipoToEdit.almacenamiento || '',
        sistema_operativo: equipoToEdit.sistema_operativo || '',
        accesorios: equipoToEdit.accesorios || '',
        notas: equipoToEdit.notas || '',
      });
    } else {
      reset({
        cliente_id: defaultClienteId || '',
        tipo: 'Laptop / Portátil',
        marca: '',
        modelo: '',
        serie: '',
        procesador: '',
        ram: '',
        almacenamiento: '',
        sistema_operativo: 'Windows 11 Pro / Home',
        accesorios: '',
        notas: '',
      });
    }
  }, [equipoToEdit, defaultClienteId, reset, isOpen]);

  const onFormSubmit = async (data: EquipoFormData) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        marca: data.marca || null,
        modelo: data.modelo || null,
        serie: data.serie || null,
        procesador: data.procesador || null,
        ram: data.ram || null,
        almacenamiento: data.almacenamiento || null,
        sistema_operativo: data.sistema_operativo || null,
        accesorios: data.accesorios || null,
        notas: data.notas || null,
        especificaciones: {},
      };

      let result: Equipo;
      if (equipoToEdit) {
        result = await EquiposService.update(equipoToEdit.id, payload);
      } else {
        result = await EquiposService.create(payload as any);
      }

      onSuccess?.(result);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipoToEdit ? 'Editar Equipo' : 'Registrar Equipo Técnico'}
      description="Registra especificaciones de hardware, accesorios y número de serie."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Selector de Cliente */}
        <div>
          <Select
            label="Cliente Propietario"
            error={errors.cliente_id?.message}
            {...register('cliente_id')}
            required
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.empresa ? `(${c.empresa})` : ''} - {c.telefono || c.email || ''}
              </option>
            ))}
          </Select>
        </div>

        {/* Tipo y Marca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Tipo de Dispositivo" error={errors.tipo?.message} {...register('tipo')} required>
            {TIPOS_EQUIPO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Input
            label="Marca"
            placeholder="Ej: Dell, HP, Lenovo, Apple, MikroTik..."
            error={errors.marca?.message}
            {...register('marca')}
          />
        </div>

        {/* Modelo y Número de Serie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Modelo Comercial"
            placeholder="Ej: Latitude 5420 / Legion 5 Pro"
            error={errors.modelo?.message}
            {...register('modelo')}
          />

          <Input
            label="Número de Serie (S/N o Service Tag)"
            placeholder="Ej: DL5420-89KLP / MT-9812"
            leftIcon={<Tag className="w-4 h-4" />}
            error={errors.serie?.message}
            {...register('serie')}
            helperText="Indispensable para seguimiento y etiquetas QR"
          />
        </div>

        {/* Especificaciones de Rendimiento: Procesador, RAM, Almacenamiento */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-500" />
            Especificaciones Técnicas Internas
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Procesador (CPU)"
              placeholder="Ej: i7-1185G7 / Ryzen 7"
              error={errors.procesador?.message}
              {...register('procesador')}
            />

            <Input
              label="Memoria RAM"
              placeholder="Ej: 16 GB DDR4"
              error={errors.ram?.message}
              {...register('ram')}
            />

            <Input
              label="Almacenamiento"
              placeholder="Ej: SSD 512 GB NVMe"
              error={errors.almacenamiento?.message}
              {...register('almacenamiento')}
            />
          </div>

          <Select
            label="Sistema Operativo Instalado"
            error={errors.sistema_operativo?.message}
            {...register('sistema_operativo')}
          >
            <option value="">-- No especificado --</option>
            {SISTEMAS_OPERATIVOS.map((so) => (
              <option key={so} value={so}>
                {so}
              </option>
            ))}
          </Select>
        </div>

        {/* Accesorios y Notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Textarea
            label="Accesorios Entregados por el Cliente"
            placeholder="Ej: Cargador original 65W, cable HDMI, bolso protector..."
            error={errors.accesorios?.message}
            {...register('accesorios')}
            rows={2}
          />

          <Textarea
            label="Notas Internas del Equipo"
            placeholder="Detalles sobre licencias, estado estético, historial previo..."
            error={errors.notas?.message}
            {...register('notas')}
            rows={2}
          />
        </div>

        {/* Nota de Privacidad AX Network */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>Privacidad garantizada:</strong> Por política de seguridad de AX Network Solutions, no almacenamos contraseñas personales de equipos en la plataforma.
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading}>
            {equipoToEdit ? 'Guardar Cambios' : 'Registrar Equipo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
