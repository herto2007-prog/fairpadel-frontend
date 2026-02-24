import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { X, Save } from 'lucide-react';
import type { AuspicianteEspecie } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    sponsorId?: string;
    nombre: string;
    descripcion: string;
    valorEstimado: number;
    fecha?: string;
    observaciones?: string;
  }) => Promise<void>;
  editData?: AuspicianteEspecie | null;
  sponsors?: { id: string; nombre: string; logoUrl: string }[];
}

export function AuspicianteFormModal({ isOpen, onClose, onSave, editData, sponsors = [] }: Props) {
  const [useExistingSponsor, setUseExistingSponsor] = useState(false);
  const [sponsorId, setSponsorId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setUseExistingSponsor(!!editData.sponsorId);
      setSponsorId(editData.sponsorId || '');
      setNombre(editData.nombre);
      setDescripcion(editData.descripcion);
      setValorEstimado(String(editData.valorEstimado));
      setFecha(editData.fecha ? new Date(editData.fecha).toISOString().split('T')[0] : '');
      setObservaciones(editData.observaciones || '');
    } else {
      setUseExistingSponsor(false);
      setSponsorId('');
      setNombre('');
      setDescripcion('');
      setValorEstimado('');
      setFecha('');
      setObservaciones('');
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNombre = useExistingSponsor && sponsorId
      ? sponsors.find(s => s.id === sponsorId)?.nombre || nombre
      : nombre;
    if (!finalNombre.trim() || !descripcion.trim() || !valorEstimado) return;
    setSaving(true);
    try {
      await onSave({
        sponsorId: useExistingSponsor && sponsorId ? sponsorId : undefined,
        nombre: finalNombre.trim(),
        descripcion: descripcion.trim(),
        valorEstimado: parseFloat(valorEstimado),
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
      <Card className="w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-light-secondary hover:text-light-text">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-4">
          {editData ? 'Editar' : 'Nuevo'} Auspicio en Especie
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sponsor selection */}
          {sponsors.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm text-light-secondary mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExistingSponsor}
                  onChange={(e) => { setUseExistingSponsor(e.target.checked); if (!e.target.checked) setSponsorId(''); }}
                  className="rounded border-dark-border"
                />
                Vincular a auspiciante existente
              </label>
              {useExistingSponsor && (
                <select
                  value={sponsorId}
                  onChange={(e) => {
                    setSponsorId(e.target.value);
                    const s = sponsors.find(sp => sp.id === e.target.value);
                    if (s) setNombre(s.nombre);
                  }}
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Seleccionar auspiciante...</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Nombre */}
          {!useExistingSponsor && (
            <div>
              <label className="block text-sm text-light-secondary mb-1">Nombre del Auspiciante</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la empresa o persona"
                required
                className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Descripción del aporte</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: 20 tubers de pelotas Head Pro"
              rows={3}
              required
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Valor Estimado */}
          <div>
            <label className="block text-sm text-light-secondary mb-1">Valor Estimado (Gs.)</label>
            <input
              type="number"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(e.target.value)}
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
            disabled={saving || !descripcion.trim() || !valorEstimado || (!useExistingSponsor && !nombre.trim())}
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
