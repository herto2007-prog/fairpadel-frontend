import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Loading } from '@/components/ui';
import { Plus, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AlquilerBloqueo } from '@/types';

interface Props {
  sedeId: string;
}

function formatFecha(f: string) {
  const dateStr = f.includes('T') ? f.split('T')[0] : f;
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BloqueosAlquilerManager({ sedeId }: Props) {
  const [bloqueos, setBloqueos] = useState<AlquilerBloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sedeCanchaId, setSedeCanchaId] = useState('');
  const [motivo, setMotivo] = useState('');
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
      toast.error('Ingresá fecha inicio y fin');
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
    if (!confirm('¿Eliminar este bloqueo?')) return;
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
    return <Loading size="lg" text="Cargando bloqueos..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-light-text">Bloqueos de canchas</h3>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo bloqueo
        </Button>
      </div>

      {showForm && (
        <div className="bg-dark-card rounded-lg border border-dark-border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-light-muted block mb-1">Fecha inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-light-muted block mb-1">Fecha fin *</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-light-muted block mb-1">Cancha (opcional — dejar vacío para todas)</label>
            <select
              value={sedeCanchaId}
              onChange={(e) => setSedeCanchaId(e.target.value)}
              className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las canchas</option>
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-light-muted block mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Mantenimiento, evento privado..."
              className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={handleCrear}>
              <Plus className="w-4 h-4 mr-1" /> Crear bloqueo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {bloqueos.length === 0 ? (
        <div className="text-center py-12 text-light-muted text-sm">
          <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No hay bloqueos activos.
        </div>
      ) : (
        <div className="space-y-2">
          {bloqueos.map((b: any) => (
            <div key={b.id} className="bg-dark-card rounded-lg border border-dark-border p-3 flex items-center gap-3">
              <Ban className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-light-text">
                  {formatFecha(b.fechaInicio)} — {formatFecha(b.fechaFin)}
                </div>
                <div className="text-xs text-light-muted">
                  {b.sedeCancha?.nombre || 'Todas las canchas'}
                  {b.motivo && ` — ${b.motivo}`}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={deleting === b.id}
                onClick={() => handleEliminar(b.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
