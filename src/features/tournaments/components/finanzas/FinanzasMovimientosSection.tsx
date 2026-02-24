import { useState } from 'react';
import { Card } from '@/components/ui';
import { Plus, Edit3, Trash2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { MovimientoFormModal } from './MovimientoFormModal';
import { finanzasService } from '@/services/finanzasService';
import toast from 'react-hot-toast';
import type { Tournament, MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento } from '@/types';

const CATEGORIA_LABELS: Record<string, string> = {
  PREMIO: 'Premios',
  ARBITRAJE: 'Arbitraje',
  ALQUILER_CANCHA: 'Alquiler Cancha',
  PELOTAS: 'Pelotas',
  PUBLICIDAD: 'Publicidad',
  LOGISTICA: 'Logística',
  ALIMENTACION: 'Alimentación',
  AUSPICIO_EFECTIVO: 'Auspicio Efectivo',
  OTRO: 'Otro',
};

const CATEGORIA_COLORS: Record<string, string> = {
  PREMIO: 'bg-yellow-900/30 text-yellow-400',
  ARBITRAJE: 'bg-blue-900/30 text-blue-400',
  ALQUILER_CANCHA: 'bg-purple-900/30 text-purple-400',
  PELOTAS: 'bg-green-900/30 text-green-400',
  PUBLICIDAD: 'bg-pink-900/30 text-pink-400',
  LOGISTICA: 'bg-orange-900/30 text-orange-400',
  ALIMENTACION: 'bg-teal-900/30 text-teal-400',
  AUSPICIO_EFECTIVO: 'bg-emerald-900/30 text-emerald-400',
  OTRO: 'bg-dark-surface text-light-secondary',
};

interface Props {
  tournament: Tournament;
  movimientos: MovimientoFinanciero[];
  onRefresh: () => void;
}

export function FinanzasMovimientosSection({ tournament, movimientos, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoPreset, setTipoPreset] = useState<TipoMovimiento>('INGRESO');
  const [editItem, setEditItem] = useState<MovimientoFinanciero | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO');
  const egresos = movimientos.filter((m) => m.tipo === 'EGRESO');
  const totalIngresos = ingresos.reduce((sum, m) => sum + Number(m.monto), 0);
  const totalEgresos = egresos.reduce((sum, m) => sum + Number(m.monto), 0);
  const balance = totalIngresos - totalEgresos;

  const openNew = (tipo: TipoMovimiento) => {
    setEditItem(null);
    setTipoPreset(tipo);
    setModalOpen(true);
  };

  const openEdit = (mov: MovimientoFinanciero) => {
    setEditItem(mov);
    setTipoPreset(mov.tipo);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    tipo: TipoMovimiento;
    categoria: CategoriaMovimiento;
    concepto: string;
    monto: number;
    fecha?: string;
    observaciones?: string;
  }) => {
    try {
      if (editItem) {
        await finanzasService.updateMovimiento(tournament.id, editItem.id, data);
        toast.success('Movimiento actualizado');
      } else {
        await finanzasService.createMovimiento(tournament.id, data);
        toast.success('Movimiento registrado');
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    setDeletingId(id);
    try {
      await finanzasService.deleteMovimiento(tournament.id, id);
      toast.success('Movimiento eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const renderMovCard = (mov: MovimientoFinanciero) => (
    <div key={mov.id} className="flex items-start justify-between gap-3 p-3 bg-dark-surface/50 rounded-lg border border-dark-border/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORIA_COLORS[mov.categoria] || CATEGORIA_COLORS.OTRO}`}>
            {CATEGORIA_LABELS[mov.categoria] || mov.categoria}
          </span>
        </div>
        <p className="text-sm font-medium text-light-text truncate">{mov.concepto}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-sm font-bold ${mov.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
            {mov.tipo === 'INGRESO' ? '+' : '-'} {formatCurrency(Number(mov.monto))}
          </span>
          <span className="text-[10px] text-light-secondary">
            {new Date(mov.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        </div>
        {mov.observaciones && (
          <p className="text-[11px] text-light-secondary mt-1 truncate">{mov.observaciones}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => openEdit(mov)} className="p-1.5 text-light-secondary hover:text-light-text hover:bg-dark-hover rounded transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDelete(mov.id)}
          disabled={deletingId === mov.id}
          className="p-1.5 text-light-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => openNew('INGRESO')}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Ingreso
        </button>
        <button
          onClick={() => openNew('EGRESO')}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Egreso
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-base font-bold text-green-400">Ingresos</h3>
            <span className="text-xs text-light-secondary ml-auto">{ingresos.length} registros</span>
          </div>
          {ingresos.length === 0 ? (
            <p className="text-sm text-light-secondary text-center py-6">No hay ingresos registrados</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">{ingresos.map(renderMovCard)}</div>
          )}
        </Card>

        {/* Egresos */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-red-400">Egresos</h3>
            <span className="text-xs text-light-secondary ml-auto">{egresos.length} registros</span>
          </div>
          {egresos.length === 0 ? (
            <p className="text-sm text-light-secondary text-center py-6">No hay egresos registrados</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">{egresos.map(renderMovCard)}</div>
          )}
        </Card>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-400">{formatCurrency(totalIngresos)}</p>
          <p className="text-xs text-light-secondary">Total Ingresos</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalEgresos)}</p>
          <p className="text-xs text-light-secondary">Total Egresos</p>
        </Card>
        <Card className="p-4 text-center">
          <ArrowRightLeft className="w-5 h-5 text-primary-400 mx-auto mb-1" />
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </p>
          <p className="text-xs text-light-secondary">Balance</p>
        </Card>
      </div>

      {/* Modal */}
      <MovimientoFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={handleSave}
        tipoPreset={tipoPreset}
        editData={editItem}
      />
    </div>
  );
}
