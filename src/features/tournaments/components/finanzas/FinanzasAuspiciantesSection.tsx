import { useState } from 'react';
import { Card } from '@/components/ui';
import { Plus, Edit3, Trash2, Handshake, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AuspicianteFormModal } from './AuspicianteFormModal';
import { finanzasService } from '@/services/finanzasService';
import toast from 'react-hot-toast';
import type { Tournament, AuspicianteEspecie } from '@/types';

interface Props {
  tournament: Tournament;
  auspiciantes: AuspicianteEspecie[];
  sponsors: { id: string; nombre: string; logoUrl: string }[];
  onRefresh: () => void;
}

export function FinanzasAuspiciantesSection({ tournament, auspiciantes, sponsors, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuspicianteEspecie | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalEstimado = auspiciantes.reduce((sum, a) => sum + Number(a.valorEstimado), 0);

  const handleSave = async (data: {
    sponsorId?: string;
    nombre: string;
    descripcion: string;
    valorEstimado: number;
    fecha?: string;
    observaciones?: string;
  }) => {
    try {
      if (editItem) {
        await finanzasService.updateAuspicianteEspecie(tournament.id, editItem.id, data);
        toast.success('Auspicio actualizado');
      } else {
        await finanzasService.createAuspicianteEspecie(tournament.id, data);
        toast.success('Auspicio registrado');
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este auspicio?')) return;
    setDeletingId(id);
    try {
      await finanzasService.deleteAuspicianteEspecie(tournament.id, id);
      toast.success('Auspicio eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold">Aportes en Especie</h3>
        </div>
        <button
          onClick={() => { setEditItem(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Auspicio
        </button>
      </div>

      {/* List */}
      {auspiciantes.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-10 h-10 text-light-secondary mx-auto mb-3 opacity-50" />
          <p className="text-light-secondary text-sm">No hay aportes en especie registrados</p>
          <p className="text-light-secondary text-xs mt-1">Los aportes en especie son contribuciones no monetarias como pelotas, equipamiento, servicios, etc.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {auspiciantes.map((ausp) => (
            <Card key={ausp.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Logo or icon */}
                {ausp.sponsor?.logoUrl ? (
                  <img src={ausp.sponsor.logoUrl} alt={ausp.nombre} className="w-12 h-12 rounded-lg object-cover border border-dark-border flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-purple-400" />
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-light-text">{ausp.nombre}</h4>
                    {ausp.sponsor && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded-full">Vinculado</span>
                    )}
                  </div>
                  <p className="text-sm text-light-secondary mt-1">{ausp.descripcion}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-bold text-purple-400">{formatCurrency(Number(ausp.valorEstimado))}</span>
                    <span className="text-[10px] text-light-secondary">
                      {new Date(ausp.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                  {ausp.observaciones && (
                    <p className="text-[11px] text-light-secondary mt-1 italic">{ausp.observaciones}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditItem(ausp); setModalOpen(true); }}
                    className="p-1.5 text-light-secondary hover:text-light-text hover:bg-dark-hover rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ausp.id)}
                    disabled={deletingId === ausp.id}
                    className="p-1.5 text-light-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Total */}
      {auspiciantes.length > 0 && (
        <Card className="p-4 text-center bg-purple-500/5 border-purple-500/20">
          <p className="text-xs text-light-secondary mb-1">Valor Total Estimado en Especie</p>
          <p className="text-xl font-bold text-purple-400">{formatCurrency(totalEstimado)}</p>
          <p className="text-[10px] text-light-secondary mt-1">{auspiciantes.length} aporte{auspiciantes.length !== 1 ? 's' : ''} registrado{auspiciantes.length !== 1 ? 's' : ''}</p>
        </Card>
      )}

      {/* Modal */}
      <AuspicianteFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={handleSave}
        editData={editItem}
        sponsors={sponsors}
      />
    </div>
  );
}
