import React, { useRef, useState } from 'react';
import { Informe } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import { 
  Printer, 
  Download, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  User, 
  Laptop, 
  Wrench, 
  FileText,
  Clock,
  Sparkles,
  Edit
} from 'lucide-react';

interface InformeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  informe: Informe | null;
  onRefirmar?: () => void;
}

export const InformeViewerModal: React.FC<InformeViewerModalProps> = ({
  isOpen,
  onClose,
  informe,
  onRefirmar,
}) => {
  const { isTecnico } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!informe) return null;

  const { snapshot } = informe;
  const cliente = snapshot?.cliente;
  const equipo = snapshot?.equipo;
  const orden = snapshot?.orden;
  const tecnico = snapshot?.tecnico;
  const items = snapshot?.items || [];
  const totales = snapshot?.totales || { subtotal: 0, descuento: 0, impuesto: 0, total: 0 };

  const rawPhone = cliente?.whatsapp || cliente?.telefono || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('507') ? cleanPhone : `507${cleanPhone}`;

  // Descarga en PDF profesional con jsPDF
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [0, 102, 255]; // AX Blue
      const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
      const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500

      // Margins
      const marginX = 14;
      let y = 14;

      // Encabezado
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(marginX, y, 4, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('AX NETWORK SOLUTIONS GROUP', marginX + 8, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('Soporte Técnico Especializado · Redes y Computadoras · Ciudad de Panamá', marginX + 8, y + 11);
      doc.text('RUC: 155702314-2-2023 DV 45 · Tel / WhatsApp: +507 6911-0901', marginX + 8, y + 16);

      // Bloque del Número de Informe
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(140, y, 56, 18, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('INFORME TÉCNICO', 144, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(informe.numero, 144, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Orden: ${orden?.numero || 'N/A'}`, 144, y + 16);

      y += 24;

      // Línea divisoria
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y, 196, y);
      y += 5;

      // Grid de Cliente y Equipo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('DATOS DEL CLIENTE', marginX, y);
      doc.text('DATOS DEL EQUIPO', 110, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

      // Cliente
      doc.text(`Cliente: ${cliente?.nombre || 'N/A'}`, marginX, y);
      if (cliente?.empresa) doc.text(`Empresa: ${cliente.empresa}`, marginX, y + 4);
      doc.text(`Teléfono / WA: ${cliente?.telefono || cliente?.whatsapp || 'N/A'}`, marginX, y + (cliente?.empresa ? 8 : 4));
      doc.text(`Dirección: ${(cliente?.direccion || 'Ciudad de Panamá').slice(0, 50)}`, marginX, y + (cliente?.empresa ? 12 : 8));

      // Equipo
      doc.text(`Tipo / Marca: ${equipo?.tipo || 'Equipo'} ${equipo?.marca || ''}`, 110, y);
      doc.text(`Modelo: ${equipo?.modelo || 'N/A'}`, 110, y + 4);
      doc.text(`N.º Serie: ${equipo?.serie || 'S/N'}`, 110, y + 8);
      doc.text(`Especificaciones: ${[equipo?.procesador, equipo?.ram, equipo?.almacenamiento].filter(Boolean).join(' · ') || 'Estándar'}`, 110, y + 12);

      y += cliente?.empresa ? 18 : 15;

      // Sección Técnica
      const printTechSection = (title: string, content: string | null) => {
        if (!content) return;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(marginX, y, 182, 14, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title.toUpperCase(), marginX + 3, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        const splitText = doc.splitTextToSize(content, 175);
        doc.text(splitText.slice(0, 2), marginX + 3, y + 9);
        y += 16;
      };

      printTechSection('Falla Reportada por el Cliente', orden?.falla_reportada);
      printTechSection('Diagnóstico Técnico Realizado', orden?.diagnostico);
      printTechSection('Trabajo Técnico Efectuado', orden?.trabajo_realizado);
      printTechSection('Recomendaciones Técnicas al Cliente', orden?.recomendaciones);

      // Tabla de Servicios y Repuestos
      if (items.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SERVICIOS Y REPUESTOS APLICADOS', marginX, y);
        y += 4;

        // Header tabla
        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, y, 182, 6, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('DESCRIPCIÓN', marginX + 2, y + 4);
        doc.text('CANT', 125, y + 4);
        doc.text('P. UNIT', 145, y + 4);
        doc.text('TOTAL', 175, y + 4);
        y += 6.5;

        // Rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        items.forEach((it: any) => {
          doc.text(it.descripcion.slice(0, 60), marginX + 2, y + 4);
          doc.text(String(it.cantidad), 127, y + 4);
          doc.text(`$${Number(it.precio_unitario).toFixed(2)}`, 145, y + 4);
          doc.text(`$${(Number(it.cantidad) * Number(it.precio_unitario)).toFixed(2)}`, 175, y + 4);
          y += 5.5;
        });

        // Totales a la derecha
        y += 1;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`Total Cancelado: $${Number(totales.total).toFixed(2)}`, 150, y + 4);
        y += 8;
      }

      // Términos de Garantía
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(marginX, y, 182, 13, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52); // green 800
      doc.text(`GARANTÍA OTORGADA: ${informe.garantia_dias} DÍAS CALENDARIO`, marginX + 3, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Cubre: ${(informe.garantia_cubre || '').slice(0, 110)}`, marginX + 3, y + 8.5);
      doc.text(`Excluye: ${(informe.garantia_excluye || '').slice(0, 110)}`, marginX + 3, y + 12);
      y += 17;

      // Firmas Digitales
      const signatureY = y;
      const signatureBoxW = 86;
      const signatureBoxH = 26;

      // Cuadro Técnico
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(marginX, signatureY, signatureBoxW, signatureBoxH, 1.5, 1.5, 'D');
      if (informe.firma_tecnico) {
        try {
          doc.addImage(informe.firma_tecnico, 'PNG', marginX + 10, signatureY + 2, 65, 16);
        } catch {}
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`Téc: ${tecnico?.nombre || 'Técnico Responsable'}`, marginX + 4, signatureY + 21);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Firma del Técnico Especialista AX Network', marginX + 4, signatureY + 24.5);

      // Cuadro Cliente
      doc.roundedRect(110, signatureY, signatureBoxW, signatureBoxH, 1.5, 1.5, 'D');
      if (informe.firma_cliente) {
        try {
          doc.addImage(informe.firma_cliente, 'PNG', 110 + 10, signatureY + 2, 65, 16);
        } catch {}
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`Cliente: ${cliente?.nombre || 'Cliente'}`, 114, signatureY + 21);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Firma de Conformidad y Recepción a Satisfacción', 114, signatureY + 24.5);

      // Pie de página
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(
        `Emitido el ${new Date(informe.created_at).toLocaleString('es-PA')} · AX Network Solutions Group · Sistema de Control Interno`,
        marginX,
        287
      );

      // Guardar PDF
      doc.save(`Informe_Tecnico_${informe.numero}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const equipNom = equipo ? `${equipo.tipo} ${equipo.marca} ${equipo.modelo}` : 'equipo';
    const msg = `Hola ${cliente?.nombre || 'estimado(a)'}, le saludamos de *AX Network Solutions Group*.

Le informamos que el *Informe Técnico N.º ${informe.numero}* correspondiente a su ${equipNom} ha sido emitido formalmente con su correspondiente garantía de *${informe.garantia_dias} días*.

🔧 *Orden de Trabajo:* ${orden?.numero || 'N/A'}
✅ *Trabajo Realizado:* ${orden?.trabajo_realizado || 'Mantenimiento y reparación técnica'}
🛡️ *Garantía:* ${informe.garantia_dias} días

¡Muchas gracias por su confianza en nuestros servicios técnicos!`;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Informe Técnico · ${informe.numero}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra superior de acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-axBlue px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              {informe.numero}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Vigencia: <strong className="text-emerald-600">{informe.garantia_dias} días</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onRefirmar && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefirmar}
                className="text-xs h-8 px-2.5"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                Refirmar
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleSendWhatsApp}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs h-8 px-2.5 flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="bg-axBlue hover:bg-axBlueHover text-white text-xs h-8 px-3 font-semibold flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Hoja de Documento Membretada (Vista Previa Idéntica al PDF) */}
        <div
          ref={printRef}
          className="p-5 sm:p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm space-y-4 font-sans text-xs"
        >
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-14 bg-axBlue rounded-full" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  AX NETWORK SOLUTIONS GROUP
                </h2>
                <p className="text-[11px] text-slate-500">
                  Soporte Técnico Especializado · Redes y Computadoras · Panamá
                </p>
                <p className="text-[10px] text-slate-400">
                  RUC: 155702314-2-2023 DV 45 · Tel: +507 6911-0901 · soporte@axnetwork.com
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right sm:min-w-44">
              <span className="text-[10px] font-bold text-axBlue uppercase tracking-wider block">
                INFORME TÉCNICO OFICIAL
              </span>
              <p className="text-sm font-bold font-mono text-slate-900">
                {informe.numero}
              </p>
              <p className="text-[10px] text-slate-500">
                Orden: <span className="font-semibold">{orden?.numero || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Datos de Cliente y Equipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-[11px]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Datos del Cliente
              </span>
              <p className="font-bold text-slate-800">{cliente?.nombre || 'Cliente'}</p>
              {cliente?.empresa && <p className="text-slate-600">{cliente.empresa}</p>}
              <p className="text-slate-600">Tel: {cliente?.telefono || cliente?.whatsapp || 'N/A'}</p>
              <p className="text-slate-500 line-clamp-1">{cliente?.direccion || 'Ciudad de Panamá'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Datos del Equipo
              </span>
              <p className="font-bold text-slate-800">
                {equipo?.tipo || 'Equipo'} {equipo?.marca} {equipo?.modelo}
              </p>
              <p className="text-slate-600 font-mono">S/N: {equipo?.serie || 'S/N'}</p>
              <p className="text-slate-500">
                {[equipo?.procesador, equipo?.ram, equipo?.almacenamiento, equipo?.sistema_operativo]
                  .filter(Boolean)
                  .join(' · ') || 'Configuración estándar'}
              </p>
            </div>
          </div>

          {/* Resumen Técnico */}
          <div className="space-y-2 text-[11px]">
            {orden?.falla_reportada && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 block mb-0.5 text-[10px] uppercase tracking-wider">
                  Falla Reportada por el Cliente
                </span>
                <p className="text-slate-600">{orden.falla_reportada}</p>
              </div>
            )}

            {orden?.diagnostico && (
              <div className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-100">
                <span className="font-bold text-axBlue block mb-0.5 text-[10px] uppercase tracking-wider">
                  Diagnóstico Técnico
                </span>
                <p className="text-slate-700">{orden.diagnostico}</p>
              </div>
            )}

            {orden?.trabajo_realizado && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 block mb-0.5 text-[10px] uppercase tracking-wider">
                  Trabajo Técnico Efectuado
                </span>
                <p className="text-slate-600">{orden.trabajo_realizado}</p>
              </div>
            )}

            {orden?.recomendaciones && (
              <div className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-100">
                <span className="font-bold text-amber-800 block mb-0.5 text-[10px] uppercase tracking-wider">
                  Recomendaciones Técnicas
                </span>
                <p className="text-slate-700">{orden.recomendaciones}</p>
              </div>
            )}
          </div>

          {/* Detalle de Partes / Servicios */}
          {items.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Servicios y Componentes Instalados
              </span>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px]">
                    <th className="py-1 px-2 text-left">Descripción</th>
                    <th className="py-1 px-2 text-center w-14">Cant.</th>
                    <th className="py-1 px-2 text-right w-20">P. Unit</th>
                    <th className="py-1 px-2 text-right w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1 px-2 text-slate-700">{it.descripcion}</td>
                      <td className="py-1 px-2 text-center text-slate-600">{it.cantidad}</td>
                      <td className="py-1 px-2 text-right text-slate-600">${Number(it.precio_unitario).toFixed(2)}</td>
                      <td className="py-1 px-2 text-right font-semibold text-slate-800">
                        ${(Number(it.cantidad) * Number(it.precio_unitario)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales si no es técnico o si es visualizador formal */}
              <div className="flex justify-end pt-2 text-xs">
                <div className="text-right space-y-0.5 min-w-40 font-semibold">
                  <p className="text-slate-500 text-[11px]">Subtotal: ${Number(totales.subtotal).toFixed(2)}</p>
                  {totales.descuento > 0 && (
                    <p className="text-emerald-600 text-[11px]">Descuento: -${Number(totales.descuento).toFixed(2)}</p>
                  )}
                  <p className="text-slate-500 text-[11px]">ITBMS (7%): ${Number(totales.impuesto).toFixed(2)}</p>
                  <p className="text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                    Total: ${Number(totales.total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Términos de Garantía */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantía Otorgada: {informe.garantia_dias} Días Calendario</span>
            </div>
            <p><span className="font-semibold">Cubre:</span> {informe.garantia_cubre}</p>
            <p><span className="font-semibold">Exclusiones:</span> {informe.garantia_excluye}</p>
          </div>

          {/* Cláusulas Legales */}
          {informe.clausulas && informe.clausulas.length > 0 && (
            <div className="space-y-1 text-[10px] text-slate-500 border-t border-slate-100 pt-2">
              <span className="font-bold text-slate-600 block uppercase tracking-wider">
                Condiciones y Términos Generales
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 leading-tight">
                {informe.clausulas.map((c: any, i: number) => (
                  <p key={i}>
                    <strong>{c.titulo || `Cláusula ${i + 1}`}:</strong> {c.texto}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Cuadro de Doble Firma Digital Estampada */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            {/* Firma Técnico */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between h-28">
              <div className="h-16 flex items-center justify-center">
                {informe.firma_tecnico ? (
                  <img
                    src={informe.firma_tecnico}
                    alt="Firma del Técnico"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Sin firma registrada</span>
                )}
              </div>
              <div className="border-t border-slate-300 pt-1 text-center">
                <p className="font-bold text-[10px] text-slate-800">{tecnico?.nombre || 'Técnico Responsable'}</p>
                <p className="text-[9px] text-slate-400">Técnico Especialista · AX Network</p>
              </div>
            </div>

            {/* Firma Cliente */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between h-28">
              <div className="h-16 flex items-center justify-center">
                {informe.firma_cliente ? (
                  <img
                    src={informe.firma_cliente}
                    alt="Firma del Cliente"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Sin firma registrada</span>
                )}
              </div>
              <div className="border-t border-slate-300 pt-1 text-center">
                <p className="font-bold text-[10px] text-slate-800">{cliente?.nombre || 'Cliente'}</p>
                <p className="text-[9px] text-slate-400">Firma de Conformidad y Recepción</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="bg-axBlue hover:bg-axBlueHover text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Documento PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
