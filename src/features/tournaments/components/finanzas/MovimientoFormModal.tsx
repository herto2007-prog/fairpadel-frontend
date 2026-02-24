import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { X, Save } from 'lucide-react';
import type { MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento } from '@/types';

const CATEGORIAS: { value: CategoriaMovimiento; label: string }[] = [
  { value: 'PREMIO', label: 'Premios' },
  { value: 'ARBITRAJE', label: 'Arbitraje' },
  { value: 'ALQUILER_CANCHA', label: 'Alquiler de Cancha' },
  { value: 'PELOTAS', label: 'Pelotas' },
  { value: 'PUBLICIDAD', label: 'Publicidad' },
  { value: 'LOGISTICA', label: 'Logística' },
  { value: 'ALIMENTACION', label: 'Alimentación' },
  { value: 'AUSPICIO_EFECTIVO', label: 'Auspicio en Efectivo' },
  { value: 'OTRO', label: 'Otro' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    tipo: TipoMovimiento;
    categoria: CategoriaMovimiento;
    concepto: string;
    monto: number;
    fecha?: string;
    observaciones?: string;
  }) => Promise<void>;
  tipoPreset?: TipoMovimiento;
  editData?: MovimientoFinanciero | null;
}

export function MovimientoFormModal({ isOpen, onClose, onSave, tipoPreset, editData }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoPreset || 'INGRESO');
  const [categoria, setCategoria] = useState<CategoriaMovimiento>('OTRO');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setTipo(editData.tipo);
      setCategoria(editData.categoria);
      setConcepto(editData.concepto);
      setMonto(String(editData.monto));
      setFecha(editData.fecha ? new Date(editData.fecha).toISOString().split('T')[0] : '');
      setObservaciones(editData.observaciones || '');
    } else {
      setTipo(tipoPreset || 'INGRESO');
      setCategoria('OTRO');
      setConcepto('');
      setMonto('');
      setFecha('');
      setObservaciones('');
    }
  }, [editData, tipoPreset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !monto) return;
    setSaving(true);
    try {
      await onSave({
        tipo,
        categoria,
        concepto: concepto.trim(),
        monto: parseFloat(monto),
        fecha: fecha || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-light-secondary hover:text-light-text">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-4">
          {editData ? 'Editar' : 'Nuevo'} {tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo toggle */}
          {!tipoPreset && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('INGRESO')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipo === 'INGRESO' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' : 'bg-dark-surface text-light-secondary'
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setTipo('EGRESO')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipo === 'EGRESO' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'bg-dark-surface text-light-secondary'
                }`}
              >
                Egreso
              </button>
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaMovimiento)}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Concepto</label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción del movimiento"
              maxLength={300}
              required
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Monto (Gs.)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              required
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !concepto.trim() || !monto}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : editData ? 'Actualizar' : 'Guardar'}
          </button>
        </form>
      </Card>
    </div>
  );
}
