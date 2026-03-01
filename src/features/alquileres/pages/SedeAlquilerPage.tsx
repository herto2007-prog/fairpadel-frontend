import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import CalendarioAlquiler from '../components/CalendarioAlquiler';
import ReservarCanchaModal from '../components/ReservarCanchaModal';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { TipoCancha } from '@/types';
import type { SlotAlquiler, AlquilerPrecio } from '@/types';

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const franjaLabel: Record<string, string> = {
  MANANA: 'Manana (06-12)',
  TARDE: 'Tarde (12-18)',
  NOCHE: 'Noche (18-23)',
};


function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

export default function SedeAlquilerPage() {
  const { sedeId } = useParams<{ sedeId: string }>();
  const { isAuthenticated } = useAuthStore();
  const [sede, setSede] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCanchaId, setSelectedCanchaId] = useState('');
  const [selectedCanchaNombre, setSelectedCanchaNombre] = useState('');
  const [selectedCanchaTipo, setSelectedCanchaTipo] = useState<TipoCancha>(TipoCancha.OUTDOOR);
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotAlquiler | null>(null);

  useEffect(() => {
    if (!sedeId) return;
    const fetchSede = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await alquileresService.getSedeDetalle(sedeId);
        setSede(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error cargando sede');
      } finally {
        setLoading(false);
      }
    };
    fetchSede();
  }, [sedeId]);

  const handleSelectSlot = (canchaId: string, canchaNombre: string, canchaTipo: TipoCancha, fecha: string, slot: SlotAlquiler) => {
    if (!isAuthenticated) {
      toast.error('Inicia sesion para reservar');
      return;
    }
    setSelectedCanchaId(canchaId);
    setSelectedCanchaNombre(canchaNombre);
    setSelectedCanchaTipo(canchaTipo);
    setSelectedFecha(fecha);
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sede) {
    return <div className="text-center py-20 text-red-400">{error || 'Sede no encontrada'}</div>;
  }

  const config = sede.alquilerConfig;
  const precios: AlquilerPrecio[] = Array.isArray(sede.alquilerPrecios) ? sede.alquilerPrecios : [];
  const canchas = Array.isArray(sede.canchas) ? sede.canchas : [];

  // Group prices by tipoCancha
  const preciosByTipo = precios.reduce((acc: Record<string, AlquilerPrecio[]>, p: AlquilerPrecio) => {
    if (!acc[p.tipoCancha]) acc[p.tipoCancha] = [];
    acc[p.tipoCancha].push(p);
    return acc;
  }, {} as Record<string, AlquilerPrecio[]>);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden mb-6">
        {sede.imagenFondo && (
          <div className="h-48 overflow-hidden">
            <img src={sede.imagenFondo} alt={sede.nombre} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {sede.logoUrl && (
              <img src={sede.logoUrl} alt="" className="w-16 h-16 rounded-lg object-contain bg-dark-hover" />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-dark-text">{sede.nombre}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-dark-muted">
                {sede.ciudad && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {sede.ciudad}
                    {sede.direccion && ` — ${sede.direccion}`}
                  </span>
                )}
                {sede.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {sede.telefono}
                  </span>
                )}
                {sede.horarioAtencion && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {sede.horarioAtencion}
                  </span>
                )}
              </div>
              {sede.mapsUrl && (
                <a
                  href={sede.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver en Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Welcome message */}
          {config?.mensajeBienvenida && (
            <div className="mt-4 p-3 bg-dark-hover rounded-lg text-sm text-dark-muted">
              {config.mensajeBienvenida}
            </div>
          )}
        </div>
      </div>

      {/* Canchas + Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Courts */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <h2 className="font-semibold text-dark-text mb-3">Canchas Disponibles</h2>
          <div className="space-y-2">
            {canchas.map((cancha: any) => (
              <div key={cancha.id} className="flex items-center justify-between py-2 px-3 bg-dark-hover rounded-lg">
                <span className="text-sm text-dark-text">{cancha.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  cancha.tipo === 'INDOOR' ? 'bg-blue-500/20 text-blue-400' :
                  cancha.tipo === 'OUTDOOR' ? 'bg-green-500/20 text-green-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {tipoCanchaLabel[cancha.tipo as TipoCancha]}
                </span>
              </div>
            ))}
            {canchas.length === 0 && (
              <p className="text-sm text-dark-muted text-center py-4">Sin canchas disponibles</p>
            )}
          </div>
          {config && (
            <p className="text-xs text-dark-muted mt-3">
              Turnos de {config.duracionSlotMinutos} minutos
              {config.requiereAprobacion ? ' — Requiere aprobacion' : ' — Confirmacion inmediata'}
            </p>
          )}
        </div>

        {/* Price table */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-4">
          <h2 className="font-semibold text-dark-text mb-3">Precios por Turno</h2>
          {Object.keys(preciosByTipo).length === 0 ? (
            <p className="text-sm text-dark-muted text-center py-4">Precios no configurados</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(preciosByTipo).map(([tipo, items]) => (
                <div key={tipo}>
                  <h3 className="text-xs text-dark-muted mb-1.5 font-medium">
                    {tipoCanchaLabel[tipo as TipoCancha]}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-dark-muted">
                          <th className="text-left py-1 pr-2"></th>
                          <th className="text-center py-1 px-2">Lun-Vie</th>
                          <th className="text-center py-1 px-2">Sab-Dom</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(['MANANA', 'TARDE', 'NOCHE'] as const).map((franja) => (
                          <tr key={franja} className="border-t border-dark-border/50">
                            <td className="py-1.5 pr-2 text-dark-muted">{franjaLabel[franja]}</td>
                            {(['SEMANA', 'FIN_DE_SEMANA'] as const).map((tipoDia) => {
                              const p = (items as AlquilerPrecio[]).find(
                                (i) => i.franja === franja && i.tipoDia === tipoDia,
                              );
                              return (
                                <td key={tipoDia} className="py-1.5 px-2 text-center font-mono text-dark-text">
                                  {p ? formatPrecio(p.precio) : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-4">
        <h2 className="font-semibold text-dark-text mb-4">Disponibilidad y Reservas</h2>
        {sedeId && (
          <CalendarioAlquiler
            key={refreshKey}
            sedeId={sedeId}
            onSelectSlot={handleSelectSlot}
          />
        )}
        {!isAuthenticated && (
          <p className="text-sm text-dark-muted text-center mt-4">
            Inicia sesion para poder reservar una cancha.
          </p>
        )}
      </div>

      {/* Reservation modal */}
      {selectedSlot && (
        <ReservarCanchaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onReserved={() => setRefreshKey((k) => k + 1)}
          sedeId={sedeId!}
          sedeName={sede.nombre}
          canchaId={selectedCanchaId}
          canchaNombre={selectedCanchaNombre}
          canchaTipo={selectedCanchaTipo}
          fecha={selectedFecha}
          slot={selectedSlot}
          requiereAprobacion={config?.requiereAprobacion ?? true}
          duracionMinutos={config?.duracionSlotMinutos ?? 90}
        />
      )}
    </div>
  );
}
