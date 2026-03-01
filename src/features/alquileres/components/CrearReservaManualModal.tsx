import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { X, Loader2, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sedeId: string;
}

export default function CrearReservaManualModal({ isOpen, onClose, onCreated, sedeId }: Props) {
  const [canchas, setCanchas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [sedeCanchaId, setSedeCanchaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [nombreExterno, setNombreExterno] = useState('');
  const [telefonoExterno, setTelefonoExterno] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const loadCanchas = async () => {
      setLoading(true);
      try {
        const data = await alquileresService.getSedeDetalle(sedeId);
        const c = Array.isArray(data.canchas) ? data.canchas.map((x: any) => ({ id: x.id, nombre: x.nombre })) : [];
        setCanchas(c);
        if (c.length > 0 && !sedeCanchaId) setSedeCanchaId(c[0].id);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    loadCanchas();
  }, [isOpen, sedeId]);

  const handleSubmit = async () => {
    if (!sedeCanchaId || !fecha || !horaInicio) {
      toast.error('Complet\u00e1 cancha, fecha y hora');
      return;
    }
    if (!nombreExterno.trim()) {
      toast.error('Ingres\u00e1 el nombre del cliente');
      return;
    }
    setSaving(true);
    try {
      await alquileresService.crearReservaManual(sedeId, {
        sedeCanchaId,
        fecha,
        horaInicio,
        nombreExterno: nombreExterno.trim(),
        telefonoExterno: telefonoExterno.trim() || undefined,
        notas: notas.trim() || undefined,
      });
      toast.success('Reserva manual creada');
      onCreated();
      onClose();
      // Reset
      setFecha('');
      setHoraInicio('');
      setNombreExterno('');
      setTelefonoExterno('');
      setNotas('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando reserva');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Generate hour options
  const horas: string[] = [];
  for (let h = 7; h <= 22; h++) {
    horas.push(`${String(h).padStart(2, '0')}:00`);
    horas.push(`${String(h).padStart(2, '0')}:30`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-dark-text">Reserva Manual</h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-hover rounded-lg transition-colors">
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-dark-muted block mb-1">Cancha *</label>
                <select
                  value={sedeCanchaId}
                  onChange={(e) => setSedeCanchaId(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
                >
                  {canchas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-muted block mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-muted block mb-1">Hora Inicio *</label>
                  <select
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text"
                  >
                    <option value="">Seleccionar</option>
                    {horas.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-muted block mb-1">Nombre del Cliente *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input
                    type="text"
                    value={nombreExterno}
                    onChange={(e) => setNombreExterno(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full pl-10 pr-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-muted block mb-1">Tel\u00e9fono (opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input
                    type="text"
                    value={telefonoExterno}
                    onChange={(e) => setTelefonoExterno(e.target.value)}
                    placeholder="0981..."
                    className="w-full pl-10 pr-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-muted block mb-1">Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-dark-hover text-dark-muted hover:text-dark-text transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Crear Reserva
          </button>
        </div>
      </div>
    </div>
  );
}
