import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { OrdenesService } from '@/lib/storage';
import { Orden } from '@/types/database';
import { formatDate } from '@/lib/formatters';
import {
  QrCode,
  Search,
  Camera,
  Laptop,
  ArrowRight,
  AlertCircle,
  ScanLine,
  CheckCircle2,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const navigate = useNavigate();
  const [inputVal, setInputVal] = useState('');
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<Orden[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputVal('');
      setError(null);
      setIsCameraActive(false);
      OrdenesService.getAll().then((list) => {
        setOrdenes(list);
        setFilteredOrdenes(list.slice(0, 5));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!inputVal.trim()) {
      setFilteredOrdenes(ordenes.slice(0, 5));
      return;
    }

    const query = inputVal.trim().toLowerCase();
    const matches = ordenes.filter((o) => {
      return (
        o.numero.toLowerCase().includes(query) ||
        (o.cliente?.nombre && o.cliente.nombre.toLowerCase().includes(query)) ||
        (o.equipo?.tipo && o.equipo.tipo.toLowerCase().includes(query)) ||
        (o.equipo?.serie && o.equipo.serie.toLowerCase().includes(query)) ||
        o.id.toLowerCase().includes(query)
      );
    });
    setFilteredOrdenes(matches);
  }, [inputVal, ordenes]);

  const handleGoToOrder = (ordenId: string) => {
    onClose();
    navigate(`/ordenes/${ordenId}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = inputVal.trim();
    if (!val) return;

    // Si pegaron una URL completa
    if (val.includes('/ordenes/')) {
      const parts = val.split('/ordenes/');
      const possibleId = parts[1]?.split(/[?#]/)[0];
      if (possibleId) {
        handleGoToOrder(possibleId);
        return;
      }
    }

    // Buscar coincidencia exacta de número o id
    const found = ordenes.find(
      (o) =>
        o.numero.toLowerCase() === val.toLowerCase() ||
        o.id.toLowerCase() === val.toLowerCase()
    );

    if (found) {
      handleGoToOrder(found.id);
    } else if (filteredOrdenes.length === 1) {
      handleGoToOrder(filteredOrdenes[0].id);
    } else {
      setError(`No se encontró ninguna orden con el código o número "${val}".`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escanear Código QR o Buscar Orden de Servicio"
      size="md"
    >
      <div className="space-y-4">
        {/* Buscador / Lector de Código de Barras / QR */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Escanea con tu lector USB / Bluetooth o escribe el número de orden:
          </label>
          <div className="relative">
            <ScanLine className="w-4 h-4 absolute left-3 top-3 text-brand-600" />
            <Input
              autoFocus
              placeholder="Ej: OT-2026-0001, serie del equipo o pega URL..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="pl-9 font-mono text-xs sm:text-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1 h-7 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold"
            >
              Abrir
            </Button>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Simulación de Cámara / Escaneo Móvil */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkBg/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Escaneo instantáneo con teléfono móvil o lector de mostrador
          </div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Todas las etiquetas adhesivas de AX Network Solutions contienen un código QR estandarizado. Apunta la cámara de cualquier celular para abrir la orden sin instalar nada.
          </p>
        </div>

        {/* Órdenes Recientes / Coincidencias */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{inputVal ? 'Resultados Coincidentes' : 'Órdenes Recientes en Taller'}</span>
            <span className="text-[11px] font-normal text-slate-400">
              {filteredOrdenes.length} disponibles
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {filteredOrdenes.length > 0 ? (
              filteredOrdenes.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => handleGoToOrder(ord.id)}
                  className="p-3 rounded-xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 hover:shadow-card cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400 font-mono">
                        {ord.numero}
                      </span>
                      <Badge className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ord.estado}
                      </Badge>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ord.cliente?.nombre || 'Cliente'} — {ord.equipo?.tipo} ({ord.equipo?.marca})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ingreso: {formatDate(ord.fecha_ingreso)}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No se encontraron órdenes para la búsqueda ingresada.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
