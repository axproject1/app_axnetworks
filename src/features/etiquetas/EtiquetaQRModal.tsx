import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Orden } from '@/types/database';
import { generateQRCode } from '@/lib/imageUtils';
import { formatDate } from '@/lib/formatters';
import { Printer, Download, QrCode, Tag, Sparkles, Check, Copy } from 'lucide-react';
import jsPDF from 'jspdf';

interface EtiquetaQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: Orden | null;
}

export function EtiquetaQRModal({ isOpen, onClose, orden }: EtiquetaQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [tamano, setTamano] = useState<'50x30' | '60x40'>('60x40');
  const [copied, setCopied] = useState(false);
  const etiquetaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orden && isOpen) {
      // URL para acceso rápido al escanear con la cámara del celular
      const orderUrl = `${window.location.origin}/ordenes/${orden.id}`;
      generateQRCode(orderUrl).then(setQrDataUrl);
    }
  }, [orden, isOpen]);

  if (!orden) return null;

  const handlePrint = () => {
    const printContent = etiquetaRef.current;
    if (!printContent) return;

    const widthMm = tamano === '50x30' ? '50mm' : '60mm';
    const heightMm = tamano === '50x30' ? '30mm' : '40mm';

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta_${orden.numero}</title>
          <style>
            @page {
              size: ${widthMm} ${heightMm};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .etiqueta-print {
              width: ${widthMm};
              height: ${heightMm};
              padding: 2mm 2.5mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              color: #000;
              overflow: hidden;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
            }
            .brand-name {
              font-size: 7pt;
              font-weight: 900;
              letter-spacing: 0.3px;
            }
            .ot-num {
              font-size: 9pt;
              font-weight: 900;
            }
            .content-row {
              display: flex;
              gap: 2mm;
              align-items: center;
              flex: 1;
            }
            .qr-col img {
              width: ${tamano === '50x30' ? '18mm' : '22mm'};
              height: ${tamano === '50x30' ? '18mm' : '22mm'};
              display: block;
            }
            .info-col {
              flex: 1;
              font-size: ${tamano === '50x30' ? '5.5pt' : '6.5pt'};
              line-height: 1.25;
            }
            .info-line {
              margin-bottom: 0.8mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .bold {
              font-weight: bold;
            }
            .footer-bar {
              border-top: 0.5px solid #000;
              padding-top: 0.8mm;
              display: flex;
              justify-content: space-between;
              font-size: 5pt;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta-print">
            <div class="header-bar">
              <span class="brand-name">AX NETWORK SOLUTIONS</span>
              <span class="ot-num">${orden.numero}</span>
            </div>
            <div class="content-row">
              <div class="qr-col">
                <img src="${qrDataUrl}" alt="QR" />
              </div>
              <div class="info-col">
                <div class="info-line"><span class="bold">CLI:</span> ${orden.cliente?.nombre || 'Cliente'}</div>
                <div class="info-line"><span class="bold">EQ:</span> ${orden.equipo?.tipo || 'Equipo'} ${orden.equipo?.marca || ''} ${orden.equipo?.modelo || ''}</div>
                ${orden.equipo?.serie ? `<div class="info-line"><span class="bold">S/N:</span> ${orden.equipo.serie}</div>` : ''}
                <div class="info-line"><span class="bold">ING:</span> ${formatDate(orden.fecha_ingreso)}</div>
                ${orden.falla_reportada ? `<div class="info-line"><span class="bold">FAL:</span> ${orden.falla_reportada.slice(0, 30)}...</div>` : ''}
              </div>
            </div>
            <div class="footer-bar">
              <span>Soporte Técnico Panamá</span>
              <span>axnetworksolutions.vercel.app</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const isSmall = tamano === '50x30';
    const width = isSmall ? 50 : 60;
    const height = isSmall ? 30 : 40;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [width, height],
    });

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, 'F');

    // Header bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isSmall ? 6.5 : 7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('AX NETWORK SOLUTIONS', 2, 4);

    doc.setFontSize(isSmall ? 8 : 9.5);
    doc.text(orden.numero, width - 2, 4, { align: 'right' });

    doc.setLineWidth(0.3);
    doc.line(2, 5.5, width - 2, 5.5);

    // QR Image
    if (qrDataUrl) {
      const qrSize = isSmall ? 18 : 22;
      doc.addImage(qrDataUrl, 'PNG', 2, 6.5, qrSize, qrSize);
    }

    // Texto de información
    const textX = isSmall ? 22 : 26;
    doc.setFontSize(isSmall ? 5.5 : 6.5);
    let y = 9;

    doc.setFont('helvetica', 'bold');
    doc.text('CLI:', textX, y);
    doc.setFont('helvetica', 'normal');
    doc.text((orden.cliente?.nombre || 'Cliente').slice(0, 22), textX + 5, y);

    y += 3.5;
    doc.setFont('helvetica', 'bold');
    doc.text('EQ:', textX, y);
    doc.setFont('helvetica', 'normal');
    const equipoStr = `${orden.equipo?.tipo || ''} ${orden.equipo?.marca || ''}`.trim();
    doc.text(equipoStr.slice(0, 22), textX + 5, y);

    if (orden.equipo?.serie) {
      y += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.text('S/N:', textX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(orden.equipo.serie.slice(0, 18), textX + 5, y);
    }

    y += 3.5;
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', textX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(orden.fecha_ingreso), textX + 8, y);

    // Footer
    doc.setLineWidth(0.2);
    doc.line(2, height - 3.5, width - 2, height - 3.5);
    doc.setFontSize(4.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Soporte Técnico Panamá', 2, height - 1.5);
    doc.text('axnetworksolutions.vercel.app', width - 2, height - 1.5, { align: 'right' });

    doc.save(`Etiqueta_${orden.numero}.pdf`);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/ordenes/${orden.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Etiqueta Adhesiva Térmica con Código QR"
      size="md"
    >
      <div className="space-y-4">
        {/* Selector de Tamaño de Etiqueta */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-600" />
            <span>Formato de Papel / Rollo Adhesivo:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTamano('60x40')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                tamano === '60x40'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-darkCard text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              60 × 40 mm (Recomendado)
            </button>
            <button
              onClick={() => setTamano('50x30')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                tamano === '50x30'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-darkCard text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              50 × 30 mm (Compacto)
            </button>
          </div>
        </div>

        {/* Vista Previa de la Etiqueta (Efecto Adhesivo Realista) */}
        <div className="p-6 bg-slate-200/70 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-300/80 dark:border-slate-800">
          <div
            ref={etiquetaRef}
            className={`bg-white text-slate-900 rounded-lg shadow-elevated border border-slate-400/60 p-3.5 flex flex-col justify-between transition-all select-none ${
              tamano === '60x40' ? 'w-80 h-48' : 'w-72 h-40'
            }`}
          >
            {/* Cabecera de la Etiqueta */}
            <div className="flex items-center justify-between pb-1.5 border-b border-black">
              <span className="text-[10px] font-black tracking-wider uppercase">
                AX NETWORK SOLUTIONS
              </span>
              <span className="text-xs font-black bg-black text-white px-1.5 py-0.5 rounded">
                {orden.numero}
              </span>
            </div>

            {/* Contenido Central con QR y Datos */}
            <div className="flex items-center gap-3 py-1.5">
              {/* Código QR */}
              <div className="shrink-0 bg-white p-1 rounded border border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR de ${orden.numero}`}
                    className={tamano === '60x40' ? 'w-20 h-20' : 'w-16 h-16'}
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Información del Equipo */}
              <div className="flex-1 min-w-0 text-[11px] leading-tight space-y-1 font-medium">
                <div className="truncate">
                  <span className="font-bold">Cliente:</span> {orden.cliente?.nombre || 'Cliente'}
                </div>
                <div className="truncate">
                  <span className="font-bold">Equipo:</span> {orden.equipo?.tipo} {orden.equipo?.marca}
                </div>
                {orden.equipo?.serie && (
                  <div className="truncate font-mono text-[10px]">
                    <span className="font-bold">S/N:</span> {orden.equipo.serie}
                  </div>
                )}
                <div>
                  <span className="font-bold">Ingreso:</span> {formatDate(orden.fecha_ingreso)}
                </div>
                {orden.falla_reportada && (
                  <div className="text-[10px] text-slate-600 line-clamp-1 italic">
                    "{orden.falla_reportada}"
                  </div>
                )}
              </div>
            </div>

            {/* Pie de Etiqueta */}
            <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
              <span>Soporte Técnico Panamá</span>
              <span>axnetworksolutions.vercel.app</span>
            </div>
          </div>
        </div>

        {/* Instrucciones de Adhesivo */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Pega esta etiqueta térmica en el chasis, cargador o bolsa del equipo al momento de la recepción. Cualquier técnico o el cliente podrá escanear el QR con la cámara de su celular para abrir la orden de inmediato.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full sm:w-auto text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ¡Enlace copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copiar Enlace QR
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Descargar PDF
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Imprimir Etiqueta
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
