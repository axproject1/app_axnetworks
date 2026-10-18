import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, formatDateTime, formatPanamaPhone } from '@/lib/formatters';
import { Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReciboPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: any | null;
  ordenNumero: string;
  clienteNombre: string;
  clienteTelefono?: string | null;
  totalOrden: number;
  saldoRestante: number;
}

export function ReciboPagoModal({
  isOpen,
  onClose,
  pago,
  ordenNumero,
  clienteNombre,
  clienteTelefono,
  totalOrden,
  saldoRestante,
}: ReciboPagoModalProps) {
  if (!pago) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210], // Tamaño A5 compacto ideal para recibos
    });

    // Cabecera oscura
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 148, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('AX NETWORK SOLUTIONS GROUP', 10, 11);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante Oficial de Abono / Pago · Ciudad de Panamá', 10, 17);
    doc.text('+507 6911-0901 · https://axnetworksolutions.vercel.app', 10, 21);

    // Número de recibo y fecha
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recibo: ${pago.id.toUpperCase()}`, 10, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatDateTime(pago.fecha)}`, 138, 32, { align: 'right' });

    // Línea divisoria
    doc.setDrawColor(226, 232, 240);
    doc.line(10, 35, 138, 35);

    // Cliente y Orden
    doc.setFontSize(8.5);
    doc.text(`Cliente: ${clienteNombre}`, 10, 42);
    if (clienteTelefono) {
      doc.text(`Teléfono: ${formatPanamaPhone(clienteTelefono)}`, 10, 47);
    }
    doc.text(`Orden Asociada: ${ordenNumero}`, 10, 52);

    // Cuadro de Resumen Económico
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, 58, 128, 48, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Total Presupuesto:', 14, 66);
    doc.text('Método de Pago:', 14, 73);
    doc.text('Referencia:', 14, 80);
    doc.text('Recibido por:', 14, 87);
    doc.text('Saldo Pendiente Actual:', 14, 94);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalOrden), 134, 66, { align: 'right' });
    doc.text(String(pago.metodo).toUpperCase(), 134, 73, { align: 'right' });
    doc.text(pago.referencia || 'Sin referencia', 134, 80, { align: 'right' });
    doc.text(pago.recibido_por_perfil?.nombre || 'Recepción AX Network', 134, 87, { align: 'right' });
    doc.text(formatCurrency(saldoRestante), 134, 94, { align: 'right' });

    // Cuadro Destacado del Monto Pagado
    doc.setFillColor(14, 165, 233); // Brand color cyan-sky
    doc.roundedRect(10, 112, 128, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('MONTO ABONADO:', 16, 123);
    doc.setFontSize(14);
    doc.text(formatCurrency(pago.monto), 132, 124, { align: 'right' });

    // Notas
    if (pago.nota) {
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Nota: ${pago.nota}`, 10, 138);
    }

    // Pie de página
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Este documento certifica el abono recibido por AX Network Solutions Group.', 74, 175, { align: 'center' });
    doc.text('Gracias por su preferencia.', 74, 180, { align: 'center' });

    doc.save(`Recibo_Pago_${ordenNumero}_${pago.id}.pdf`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Pago / Abono"
      description={`Orden ${ordenNumero} · ${formatDate(pago.fecha)}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Paper Receipt Box */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                AX NETWORK SOLUTIONS GROUP
              </p>
              <p className="text-[11px] text-slate-400">Recibo de Caja Oficial</p>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-400">
              {pago.id}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-slate-800 dark:text-slate-200">
              <strong>Cliente:</strong> {clienteNombre}
            </p>
            <p className="text-slate-800 dark:text-slate-200">
              <strong>Orden Asociada:</strong> {ordenNumero}
            </p>
            <p className="text-slate-500">
              <strong>Fecha:</strong> {formatDateTime(pago.fecha)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-darkBg-card border space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Método de Pago:</span>
              <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{pago.metodo}</span>
            </div>
            {pago.referencia && (
              <div className="flex justify-between">
                <span className="text-slate-400">Referencia:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pago.referencia}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t">
              <span className="text-slate-500 font-bold">Monto Pagado:</span>
              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(pago.monto)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Saldo Restante de la Orden:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(saldoRestante)}
            </span>
          </div>

          {pago.nota && (
            <p className="text-[11px] text-slate-500 italic bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
              &ldquo;{pago.nota}&rdquo;
            </p>
          )}

          {pago.anulado && (
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-center font-bold">
              ESTE PAGO HA SIDO ANULADO
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-1.5" />
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
