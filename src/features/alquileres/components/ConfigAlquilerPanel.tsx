import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Loading } from '@/components/ui';
import { Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sedeId: string;
}

export default function ConfigAlquilerPanel({ sedeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    } catch {
      toast.error('Error cargando configuración');
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
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" text="Cargando configuración..." />;
  }

  return (
    <div className="max-w-xl mx-auto sm:mx-0">
      <div className="space-y-5">
        {/* Requiere aprobación */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-light-text">Requiere aprobación</p>
              <p className="text-xs text-light-muted mt-0.5">
                Si está activado, las reservas quedan pendientes hasta que las confirmes manualmente.
              </p>
            </div>
            <button
              onClick={() => setRequiereAprobacion(!requiereAprobacion)}
              className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                requiereAprobacion ? 'bg-primary-500' : 'bg-dark-border'
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

        {/* Duración del turno */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-4">
          <label className="text-sm font-medium text-light-text block mb-1">Duración del turno (minutos)</label>
          <p className="text-xs text-light-muted mb-2">Cuánto dura cada turno de alquiler.</p>
          <input
            type="number"
            value={duracionSlotMinutos}
            onChange={(e) => setDuracionSlotMinutos(parseInt(e.target.value) || 90)}
            min="30"
            max="180"
            step="15"
            className="w-32 px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Anticipación máxima */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-4">
          <label className="text-sm font-medium text-light-text block mb-1">Anticipación máxima (días)</label>
          <p className="text-xs text-light-muted mb-2">Con cuántos días de anticipación se puede reservar.</p>
          <input
            type="number"
            value={anticipacionMaxDias}
            onChange={(e) => setAnticipacionMaxDias(parseInt(e.target.value) || 14)}
            min="1"
            max="90"
            className="w-32 px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Cancelación mínima */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-4">
          <label className="text-sm font-medium text-light-text block mb-1">Cancelación mínima (horas)</label>
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-light-muted">
              Si el usuario cancela con menos de estas horas de anticipación, queda con{' '}
              <span className="text-red-400 font-medium">compromiso de pago</span> — debe abonar el turno igualmente.
            </p>
          </div>
          <input
            type="number"
            value={cancelacionMinHoras}
            onChange={(e) => setCancelacionMinHoras(parseInt(e.target.value) || 4)}
            min="1"
            max="72"
            className="w-32 px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Mensaje de bienvenida */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-4">
          <label className="text-sm font-medium text-light-text block mb-1">Mensaje de bienvenida</label>
          <p className="text-xs text-light-muted mb-2">Se muestra a los usuarios en la página de tu sede.</p>
          <textarea
            value={mensajeBienvenida}
            onChange={(e) => setMensajeBienvenida(e.target.value)}
            rows={3}
            placeholder="Ej: Bienvenidos a nuestro club..."
            className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Save button */}
        <Button variant="primary" loading={saving} onClick={handleSave} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" />
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
