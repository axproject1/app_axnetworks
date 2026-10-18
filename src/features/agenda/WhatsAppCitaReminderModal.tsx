import React, { useState, useEffect } from 'react';
import { Cita } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Send, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { CitasService } from '@/lib/storage';

interface WhatsAppCitaReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  onSent?: (updatedCita: Cita) => void;
}

const DEFAULT_TEMPLATE = `Hola {cliente}, le recordamos su cita técnica con AX Network Solutions para el {fecha} a las {hora}.

🔧 Modalidad: {tipo_servicio}
👨‍🔧 Técnico: {tecnico}
📍 {ubicacion_o_enlace}

Si necesita reprogramar o tiene consultas previas, por favor respóndanos a este mensaje. ¡Estamos a la orden!`;

export const WhatsAppCitaReminderModal: React.FC<WhatsAppCitaReminderModalProps> = ({
  isOpen,
  onClose,
  cita,
  onSent,
}) => {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [mensaje, setMensaje] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!cita) return;

    const fechaObj = new Date(cita.inicio);
    const fechaFormat = fechaObj.toLocaleDateString('es-PA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const horaFormat = fechaObj.toLocaleTimeString('es-PA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const tipoLabel =
      cita.tipo_servicio === 'remoto'
        ? 'Soporte Remoto (En línea)'
        : cita.tipo_servicio === 'domicilio'
        ? 'Visita Presencial a Domicilio / Oficina'
        : 'Atención en Taller Central';

    let ubicacion = '';
    if (cita.tipo_servicio === 'remoto') {
      ubicacion = cita.enlace_remoto ? `Conexión: ${cita.enlace_remoto}` : 'Conexión vía AnyDesk / WhatsApp';
    } else if (cita.tipo_servicio === 'domicilio') {
      ubicacion = `Dirección: ${cita.direccion || cita.cliente?.direccion || 'A coordinar'}`;
    } else {
      ubicacion = 'Lugar: Taller Central AX Network Solutions';
    }

    const compiled = template
      .replace(/{cliente}/g, cita.cliente?.nombre || 'Cliente')
      .replace(/{fecha}/g, fechaFormat)
      .replace(/{hora}/g, horaFormat)
      .replace(/{tecnico}/g, cita.tecnico?.nombre || 'Técnico asignado')
      .replace(/{tipo_servicio}/g, tipoLabel)
      .replace(/{ubicacion_o_enlace}/g, ubicacion);

    setMensaje(compiled);
  }, [cita, template]);

  if (!cita) return null;

  const rawPhone = cita.cliente?.whatsapp || cita.cliente?.telefono || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('507') ? cleanPhone : `507${cleanPhone}`;

  const handleSend = async () => {
    if (!cita) return;

    // Actualizar estado en storage
    const updated = await CitasService.setRecordatorioEnviado(cita.id, true);
    if (onSent) onSent(updated);

    const encoded = encodeURIComponent(mensaje);
    const waUrl = `https://wa.me/${finalPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mensaje);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar Recordatorio por WhatsApp" size="md">
      <div className="space-y-4">
        {/* Banner de cliente y destino */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-white rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {cita.cliente?.nombre || 'Cliente sin nombre'}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                WhatsApp: +{finalPhone}
              </p>
            </div>
          </div>
          {cita.recordatorio_enviado && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ya enviado antes
            </span>
          )}
        </div>

        {/* Textarea del mensaje con preview en tiempo real */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mensaje a enviar (personalizable antes de enviar):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
          </div>
          <textarea
            rows={7}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkBg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Guía de variables */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-darkCard rounded-md border border-slate-200 dark:border-slate-800">
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Plantilla predeterminada con variables automáticas:
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;cliente&#125;</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;fecha&#125;</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;hora&#125;</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;tecnico&#125;</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;tipo_servicio&#125;</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-darkBg rounded border border-slate-200 dark:border-slate-700">&#123;ubicacion_o_enlace&#125;</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Abrir WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  );
};
