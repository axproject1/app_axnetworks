import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Cliente } from '@/types/database';
import { formatPanamaPhone, cleanWhatsAppNumber } from '@/lib/formatters';
import { User, Building2, Phone, MessageSquare, Mail, MapPin } from 'lucide-react';

const clienteSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  empresa: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email('Correo electrónico no válido').optional().or(z.literal('')).nullable(),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => Promise<void>;
  clienteToEdit?: Cliente | null;
  isLoading?: boolean;
}

export function ClienteFormModal({
  isOpen,
  onClose,
  onSubmit,
  clienteToEdit,
  isLoading = false,
}: ClienteFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      empresa: '',
      telefono: '',
      whatsapp: '',
      email: '',
      direccion: '',
      notas: '',
    },
  });

  useEffect(() => {
    if (clienteToEdit) {
      reset({
        nombre: clienteToEdit.nombre || '',
        empresa: clienteToEdit.empresa || '',
        telefono: formatPanamaPhone(clienteToEdit.telefono),
        whatsapp: formatPanamaPhone(clienteToEdit.whatsapp),
        email: clienteToEdit.email || '',
        direccion: clienteToEdit.direccion || '',
        notas: clienteToEdit.notas || '',
      });
    } else {
      reset({
        nombre: '',
        empresa: '',
        telefono: '',
        whatsapp: '',
        email: '',
        direccion: '',
        notas: '',
      });
    }
  }, [clienteToEdit, reset, isOpen]);

  const handlePhoneBlur = (field: 'telefono' | 'whatsapp') => {
    const current = watch(field);
    if (current) {
      setValue(field, formatPanamaPhone(current));
    }
  };

  const onFormSubmit = async (data: ClienteFormData) => {
    // Normalizar números antes de guardar
    const payload = {
      ...data,
      telefono: data.telefono ? formatPanamaPhone(data.telefono) : null,
      whatsapp: data.whatsapp ? cleanWhatsAppNumber(data.whatsapp) : null,
      empresa: data.empresa || null,
      email: data.email || null,
      direccion: data.direccion || null,
      notas: data.notas || null,
    };
    await onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clienteToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      description="Ingresa los datos de contacto y facturación del cliente en Panamá."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Nombre completo */}
        <Input
          label="Nombre Completo o Razón Social"
          placeholder="Ej: Lic. Roberto Icaza"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.nombre?.message}
          {...register('nombre')}
          required
        />

        {/* Empresa */}
        <Input
          label="Empresa / Organización (Opcional)"
          placeholder="Ej: Icaza & Asociados / Grupo Melo"
          leftIcon={<Building2 className="w-4 h-4" />}
          error={errors.empresa?.message}
          {...register('empresa')}
        />

        {/* Teléfono & WhatsApp (en columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Teléfono Principal"
            placeholder="+507 6XXX-XXXX"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors.telefono?.message}
            {...register('telefono')}
            onBlur={() => handlePhoneBlur('telefono')}
            helperText="Formato Panamá (+507)"
          />

          <Input
            label="WhatsApp para Avisos"
            placeholder="+507 6XXX-XXXX"
            leftIcon={<MessageSquare className="w-4 h-4 text-emerald-500" />}
            error={errors.whatsapp?.message}
            {...register('whatsapp')}
            onBlur={() => handlePhoneBlur('whatsapp')}
            helperText="Usado para enviar reportes y avisos"
          />
        </div>

        {/* Email */}
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="cliente@ejemplo.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Dirección */}
        <Input
          label="Dirección (Ciudad de Panamá, Distrito, Corregimiento)"
          placeholder="Ej: San Francisco, Calle 50, Torre Banistmo, Ofic. 12"
          leftIcon={<MapPin className="w-4 h-4" />}
          error={errors.direccion?.message}
          {...register('direccion')}
        />

        {/* Notas adicionales */}
        <Textarea
          label="Notas y Observaciones de Servicio"
          placeholder="Detalles sobre facturación, horarios de atención, preferencias..."
          error={errors.notas?.message}
          {...register('notas')}
        />

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {clienteToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
