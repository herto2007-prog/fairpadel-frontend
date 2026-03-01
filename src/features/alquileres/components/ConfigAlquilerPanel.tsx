import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Loader2, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sedeId: string;
}

export default function ConfigAlquilerPanel({ sedeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config fields
  const [requiereAprobacion, setRequiereAprobacion] = useState(true);
  const [duracionSlotMinutos, setDuracionSlotMinutos] = useState(90);
  const [anticipacionMaxDias, setAnticipacionMaxDias] = useState(14);
  const [cancelacionMinHoras, setCancelacionMinHoras] = useState(4);
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');

  useEffect(() => {
    loadConfig();
  }, [sedeId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await alquileresService.getConfig(sedeId);
      if (data) {
        setRequiereAprobacion(data.requiereAprobacion ?? true);
        setDuracionSlotMinutos(data.duracionSlotMinutos ?? 90);
        setAnticipacionMaxDias(data.anticipacionMaxDias ?? 14);
        setCancelacionMinHoras(data.cancelacionMinHoras ?? 4);
        setMensajeBienvenida(data.mensajeBienvenida || '');
      }
    } catch (err: any) {
      toast.error('Error cargando configuraci\u00f3n');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await alquileresService.actualizarConfig(sedeId, {
        requiereAprobacion,
        duracionSlotMinutos,
        anticipacionMaxDias,
        cancelacionMinHoras,
        mensajeBienvenida: mensajeBienvenida || undefined,
      });
      toast.success('Configuraci\u00f3n guardada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaving(false);
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
    <div className="max-w-xl">
      <div className="space-y-5">
        {/* Requiere aprobaci\u00f3n */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-text">Requiere Aprobaci\u00f3n</p>
              <p className="text-xs text-dark-muted mt-0.5">
                Si est\u00e1 activado, las reservas quedan pendientes hasta que las confirmes manualmente.
              </p>
            </div>
            <button
              onClick={() => setRequiereAprobacion(!requiereAprobacion)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                requiereAprobacion ? 'bg-primary' : 'bg-dark-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  requiereAprobacion ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Duraci\u00f3n del turno */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <label className="text-sm font-medium text-dark-text block mb-1">Duraci\u00f3n del Turno (minutos)</label>
          <p className="text-xs text-dark-muted mb-2">Cu\u00e1nto dura cada turno de alquiler.</p>
          <input
            type="number"
            value={duracionSlotMinutos}
            onChange={(e) => setDuracionSlotMinutos(parseInt(e.target.value) || 90)}
            min="30"
            max="180"
            step="15"
            className="w-32 px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text font-mono"
          />
        </div>

        {/* Anticipaci\u00f3n m\u00e1xima */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <label className="text-sm font-medium text-dark-text block mb-1">Anticipaci\u00f3n M\u00e1xima (d\u00edas)</label>
          <p className="text-xs text-dark-muted mb-2">Con cu\u00e1ntos d\u00edas de anticipaci\u00f3n se puede reservar.</p>
          <input
            type="number"
            value={anticipacionMaxDias}
            onChange={(e) => setAnticipacionMaxDias(parseInt(e.target.value) || 14)}
            min="1"
            max="90"
            className="w-32 px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text font-mono"
          />
        </div>

        {/* Cancelaci\u00f3n m\u00ednima */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <label className="text-sm font-medium text-dark-text block mb-1">Cancelaci\u00f3n M\u00ednima (horas)</label>
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-dark-muted">
              Si el usuario cancela con menos de estas horas de anticipaci\u00f3n, queda con <span className="text-red-400 font-medium">compromiso de pago</span> — debe abonar el turno igualmente.
            </p>
          </div>
          <input
            type="number"
            value={cancelacionMinHoras}
            onChange={(e) => setCancelacionMinHoras(parseInt(e.target.value) || 4)}
            min="1"
            max="72"
            className="w-32 px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text font-mono"
          />
        </div>

        {/* Mensaje de bienvenida */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <label className="text-sm font-medium text-dark-text block mb-1">Mensaje de Bienvenida</label>
          <p className="text-xs text-dark-muted mb-2">Se muestra a los usuarios en la p\u00e1gina de tu sede.</p>
          <textarea
            value={mensajeBienvenida}
            onChange={(e) => setMensajeBienvenida(e.target.value)}
            rows={3}
            placeholder="Ej: Bienvenidos a nuestro club..."
            className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted resize-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Configuraci\u00f3n
        </button>
      </div>
    </div>
  );
}
