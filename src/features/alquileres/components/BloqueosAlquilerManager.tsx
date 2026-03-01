import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Loader2, Plus, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AlquilerBloqueo } from '@/types';

interface Props {
  sedeId: string;
}

function formatFecha(f: string) {
  const d = new Date(f + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BloqueosAlquilerManager({ sedeId }: Props) {
  const [bloqueos, setBloqueos] = useState<AlquilerBloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sedeCanchaId, setSedeCanchaId] = useState('');
  const [motivo, setMotivo] = useState('');

  // Canchas for optional filter
  const [canchas, setCanchas] = useState<{ id: string; nombre: string }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bloqueosData, sedeData] = await Promise.all([
        alquileresService.getBloqueos(sedeId),
        alquileresService.getSedeDetalle(sedeId),
      ]);
      setBloqueos(Array.isArray(bloqueosData) ? bloqueosData : []);
      setCanchas(Array.isArray(sedeData.canchas) ? sedeData.canchas.map((c: any) => ({ id: c.id, nombre: c.nombre })) : []);
    } catch {
      toast.error('Error cargando bloqueos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [sedeId]);

  const handleCrear = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Ingres\u00e1 fecha inicio y fin');
      return;
    }
    setSaving(true);
    try {
      await alquileresService.crearBloqueo(sedeId, {
        fechaInicio,
        fechaFin,
        sedeCanchaId: sedeCanchaId || undefined,
        motivo: motivo || undefined,
      });
      toast.success('Bloqueo creado');
      setShowForm(false);
      setFechaInicio('');
      setFechaFin('');
      setSedeCanchaId('');
      setMotivo('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando bloqueo');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (bloqueoId: string) => {
    if (!confirm('\u00bfEliminar este bloqueo?')) return;
    setDeleting(bloqueoId);
    try {
      await alquileresService.eliminarBloqueo(sedeId, bloqueoId);
      toast.success('Bloqueo eliminado');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-text">Bloqueos de Canchas</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Bloqueo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-dark-card rounded-xl border border-dark-border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-muted block mb-1">Fecha Inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
              />
            </div>
            <div>
              <label className="text-xs text-dark-muted block mb-1">Fecha Fin *</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-dark-muted block mb-1">Cancha (opcional — dejar vac\u00edo para todas)</label>
            <select
              value={sedeCanchaId}
              onChange={(e) => setSedeCanchaId(e.target.value)}
              className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
            >
              <option value="">Todas las canchas</option>
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-muted block mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Mantenimiento, evento privado..."
              className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCrear}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear Bloqueo
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-dark-muted hover:text-dark-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {bloqueos.length === 0 ? (
        <div className="text-center py-12 text-dark-muted text-sm">
          <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No hay bloqueos activos.
        </div>
      ) : (
        <div className="space-y-2">
          {bloqueos.map((b: any) => (
            <div key={b.id} className="bg-dark-card rounded-lg border border-dark-border p-3 flex items-center gap-3">
              <Ban className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-dark-text">
                  {formatFecha(b.fechaInicio)} — {formatFecha(b.fechaFin)}
                </div>
                <div className="text-xs text-dark-muted">
                  {b.sedeCancha?.nombre || 'Todas las canchas'}
                  {b.motivo && ` — ${b.motivo}`}
                </div>
              </div>
              <button
                onClick={() => handleEliminar(b.id)}
                disabled={deleting === b.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
