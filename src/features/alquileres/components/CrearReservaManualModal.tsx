import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Modal, Loading } from '@/components/ui';
import { User, Phone } from 'lucide-react';
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
      toast.error('Completá cancha, fecha y hora');
      return;
    }
    if (!nombreExterno.trim()) {
      toast.error('Ingresá el nombre del cliente');
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

  const horas: string[] = [];
  for (let h = 7; h <= 22; h++) {
    horas.push(`${String(h).padStart(2, '0')}:00`);
    horas.push(`${String(h).padStart(2, '0')}:30`);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reserva manual" size="md">
      {loading ? (
        <Loading size="md" text="Cargando canchas..." />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-light-muted block mb-1">Cancha *</label>
            <select
              value={sedeCanchaId}
              onChange={(e) => setSedeCanchaId(e.target.value)}
              className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-light-muted block mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-light-muted block mb-1">Hora inicio *</label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar</option>
                {horas.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-light-muted block mb-1">Nombre del cliente *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
              <input
                type="text"
                value={nombreExterno}
                onChange={(e) => setNombreExterno(e.target.value)}
                placeholder="Nombre completo"
                className="w-full pl-10 pr-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-light-muted block mb-1">Teléfono (opcional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
              <input
                type="text"
                value={telefonoExterno}
                onChange={(e) => setTelefonoExterno(e.target.value)}
                placeholder="0981..."
                className="w-full pl-10 pr-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-light-muted block mb-1">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" loading={saving || loading} onClick={handleSubmit} className="flex-1">
              Crear reserva
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
