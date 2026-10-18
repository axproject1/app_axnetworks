import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Orden } from '@/types/database';
import { generateQRCode } from '@/lib/imageUtils';
import { formatDate, formatDateTime, formatPanamaPhone } from '@/lib/formatters';
import { Printer, Download, QrCode, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface HojaIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: Orden | null;
}

export function HojaIngresoModal({ isOpen, onClose, orden }: HojaIngresoModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orden && isOpen) {
      // Generar QR que apunta a la orden
      const orderUrl = `${window.location.origin}/ordenes/${orden.id}`;
      generateQRCode(orderUrl).then(setQrDataUrl);
    }
  }, [orden, isOpen]);

  if (!orden) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Fondo y cabecera
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AX NETWORK SOLUTIONS GROUP', 14, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Soporte Técnico Especializado · Panamá · WhatsApp: +507 6911-0901', 14, 18);
    doc.text('https://axnetworksolutions.vercel.app', 14, 23);

    // Número de orden a la derecha
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(orden.numero, 196, 15, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ingreso: ${formatDate(orden.fecha_ingreso)}`, 196, 22, { align: 'right' });

    // Sección Cliente y Equipo
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 14, 38);
    doc.text('DATOS DEL EQUIPO', 110, 38);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 40, 95, 40);
    doc.line(110, 40, 196, 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    // Cliente
    doc.text(`Nombre: ${orden.cliente?.nombre || '—'}`, 14, 46);
    doc.text(`Empresa: ${orden.cliente?.empresa || 'Particular'}`, 14, 52);
    doc.text(`Tel / WhatsApp: ${formatPanamaPhone(orden.cliente?.whatsapp || orden.cliente?.telefono) || '—'}`, 14, 58);
    doc.text(`Dirección: ${orden.cliente?.direccion || 'Ciudad de Panamá'}`, 14, 64);

    // Equipo
    doc.text(`Tipo: ${orden.equipo?.tipo || 'Dispositivo'}`, 110, 46);
    doc.text(`Marca / Modelo: ${orden.equipo?.marca || ''} ${orden.equipo?.modelo || ''}`, 110, 52);
    doc.setFont('helvetica', 'bold');
    doc.text(`Serie (S/N): ${orden.equipo?.serie || 'S/N'}`, 110, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(`Accesorios: ${orden.equipo?.accesorios || 'Ninguno'}`, 110, 64);

    // Falla y Estado Físico
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MOTIVO DE INGRESO Y FALLA REPORTADA', 14, 76);
    doc.line(14, 78, 196, 78);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fallaLines = doc.splitTextToSize(orden.falla_reportada || 'Revisión técnica general.', 182);
    doc.text(fallaLines, 14, 84);

    const nextY = 86 + fallaLines.length * 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO FÍSICO AL RECIBIR', 14, nextY);
    doc.line(14, nextY + 2, 196, nextY + 2);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const estadoLines = doc.splitTextToSize(orden.estado_fisico_ingreso || 'Sin daños visibles exteriores aparentes.', 182);
    doc.text(estadoLines, 14, nextY + 8);

    // Servicio y Asignación
    const infoY = nextY + 12 + estadoLines.length * 5;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, infoY, 182, 22, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tipo de Servicio: ${orden.tipo_servicio.toUpperCase()}`, 18, infoY + 7);
    doc.text(`Prioridad: ${orden.prioridad.toUpperCase()}`, 75, infoY + 7);
    doc.text(`Ubicación: ${orden.ubicacion?.nombre || 'Recepción'}`, 130, infoY + 7);
    doc.text(`Técnico Asignado: ${orden.tecnico?.nombre || 'Por asignar'}`, 18, infoY + 15);
    doc.text(`Entrega Estimada: ${orden.fecha_estimada ? formatDate(orden.fecha_estimada) : 'Por definir'}`, 110, infoY + 15);

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 14, infoY + 28, 30, 30);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea este código QR para', 48, infoY + 38);
      doc.text('consultar el estado en vivo de tu orden.', 48, infoY + 43);
    }

    // Cláusulas resumen
    const clausulasY = infoY + 62;
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('CONDICIONES GENERALES DE INGRESO:', 14, clausulasY);
    doc.text('1. El cliente es responsable del respaldo de su información. AX Network no se responsabiliza por pérdida de datos.', 14, clausulasY + 4);
    doc.text('2. Todo trabajo adicional requerirá autorización previa del cliente.', 14, clausulasY + 8);
    doc.text('3. Pasados los 30 días de notificación de retiro, el taller podrá aplicar cobro por almacenamiento.', 14, clausulasY + 12);

    // Espacio para firmas
    doc.setDrawColor(148, 163, 184);
    doc.line(20, clausulasY + 36, 85, clausulasY + 36);
    doc.line(125, clausulasY + 36, 190, clausulasY + 36);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Firma del Cliente', 52, clausulasY + 41, { align: 'center' });
    doc.text('Firma / Sello AX Network', 157, clausulasY + 41, { align: 'center' });

    doc.save(`Hoja_Ingreso_${orden.numero}.pdf`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Ingreso y Etiqueta QR"
      description={`Orden ${orden.numero} generada con éxito`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Paper Preview Card */}
        <div
          ref={printRef}
          className="p-6 sm:p-8 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft space-y-6 text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="AX Network"
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                  AX NETWORK SOLUTIONS GROUP
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Soporte Técnico Especializado · Panamá · WA: +507 6911-0901
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="font-mono text-base font-black text-brand-600 dark:text-brand-400">
                {orden.numero}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatDateTime(orden.fecha_ingreso)}
              </span>
            </div>
          </div>

          {/* Grid Cliente y Dispositivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Cliente
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {orden.cliente?.nombre}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {orden.cliente?.empresa ? `${orden.cliente.empresa} · ` : ''}
                {formatPanamaPhone(orden.cliente?.whatsapp || orden.cliente?.telefono)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Equipo / Dispositivo
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {orden.equipo?.tipo} · {orden.equipo?.marca} {orden.equipo?.modelo}
              </p>
              <p className="font-mono text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                S/N: {orden.equipo?.serie || 'SIN SERIE'}
              </p>
            </div>
          </div>

          {/* Falla y Estado */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Falla Reportada por el Cliente
              </span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                {orden.falla_reportada || 'Revisión técnica general.'}
              </p>
            </div>

            {orden.estado_fisico_ingreso && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Estado Físico al Ingreso
                </span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {orden.estado_fisico_ingreso}
                </p>
              </div>
            )}
          </div>

          {/* QR & Entrega Estimada */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Seguimiento en Línea
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Escanea para consultar el progreso
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fecha estimada: {orden.fecha_estimada ? formatDate(orden.fecha_estimada) : 'Por definir'}
              </p>
            </div>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR de Orden"
                className="w-20 h-20 rounded-lg border border-slate-200 bg-white p-1"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-1.5" />
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
