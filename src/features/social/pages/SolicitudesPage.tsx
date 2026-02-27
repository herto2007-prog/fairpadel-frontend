import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/services/socialService';
import { Loading, Card, CardContent, Button, Badge } from '@/components/ui';
import {
  Gamepad2,
  Inbox,
  Send,
  Check,
  X,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Crown,
} from 'lucide-react';
import type { SolicitudJugar } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'recibidas' | 'enviadas';

const estadoBadge: Record<string, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  PENDIENTE: { variant: 'warning', label: 'Pendiente' },
  APROBADA: { variant: 'success', label: 'Aceptada' },
  RECHAZADA: { variant: 'danger', label: 'Rechazada' },
};

const SolicitudesPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('recibidas');
  const [recibidas, setRecibidas] = useState<SolicitudJugar[]>([]);
  const [enviadas, setEnviadas] = useState<SolicitudJugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'recibidas') {
        const data = await socialService.getSolicitudesRecibidas();
        setRecibidas(data);
      } else {
        const data = await socialService.getSolicitudesEnviadas();
        setEnviadas(data);
      }
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (user?.esPremium) loadData();
  }, [loadData, user?.esPremium]);

  const handleAceptar = async (id: string) => {
    setActionLoading(id);
    try {
      await socialService.aceptarSolicitud(id);
      toast.success('Solicitud aceptada');
      setRecibidas(prev => prev.map(s => s.id === id ? { ...s, estado: 'APROBADA' as const } : s));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id: string) => {
    setActionLoading(id);
    try {
      await socialService.rechazarSolicitud(id);
      toast.success('Solicitud rechazada');
      setRecibidas(prev => prev.map(s => s.id === id ? { ...s, estado: 'RECHAZADA' as const } : s));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return fecha;
    }
  };

  // Premium gate
  if (!user?.esPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-16">
            <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Match Inteligente</h3>
            <p className="text-light-secondary mb-6 max-w-md mx-auto">
              Enviá invitaciones de juego a otros jugadores. Proponé fecha, hora y lugar para coordinar partidos.
            </p>
            <Link to="/premium">
              <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
                <Crown className="h-4 w-4 mr-2" />
                Activar Premium — $2.99/mes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'recibidas', label: 'Recibidas', icon: <Inbox className="w-4 h-4" /> },
    { key: 'enviadas', label: 'Enviadas', icon: <Send className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-3">
          <Gamepad2 className="h-7 w-7 text-primary-400" />
          Solicitudes de Juego
        </h1>
        <p className="text-sm text-light-secondary mt-1">
          Coordina partidos con otros jugadores
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'recibidas' && recibidas.filter(s => s.estado === 'PENDIENTE').length > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {recibidas.filter(s => s.estado === 'PENDIENTE').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando..." />
        </div>
      ) : (
        <>
          {tab === 'recibidas' && (
            <div className="space-y-3">
              {recibidas.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Inbox className="h-10 w-10 text-light-muted mx-auto mb-3" />
                    <p className="text-light-secondary">No tenés solicitudes de juego pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                recibidas.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Link to={`/jugadores/${s.emisor?.id}`} className="flex-shrink-0">
                          {s.emisor?.fotoUrl ? (
                            <img src={s.emisor.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-dark-surface flex items-center justify-center text-light-muted text-sm font-bold">
                              {s.emisor?.nombre?.[0]}{s.emisor?.apellido?.[0]}
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/jugadores/${s.emisor?.id}`} className="font-medium text-white hover:text-primary-400 transition-colors">
                              {s.emisor?.nombre} {s.emisor?.apellido}
                            </Link>
                            {s.emisor?.esPremium && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                            <Badge variant={estadoBadge[s.estado]?.variant || 'info'}>
                              {estadoBadge[s.estado]?.label || s.estado}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-light-secondary mb-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatFecha(s.fechaPropuesta)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.hora}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.lugar}</span>
                          </div>
                          {s.mensaje && (
                            <p className="text-xs text-light-muted flex items-start gap-1 mt-1">
                              <MessageCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {s.mensaje}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {s.estado === 'PENDIENTE' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAceptar(s.id)}
                              disabled={actionLoading !== null}
                              loading={actionLoading === s.id}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Aceptar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRechazar(s.id)}
                              disabled={actionLoading !== null}
                              className="text-red-400 border-red-400/30 hover:bg-red-500/10"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === 'enviadas' && (
            <div className="space-y-3">
              {enviadas.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Send className="h-10 w-10 text-light-muted mx-auto mb-3" />
                    <p className="text-light-secondary">No enviaste solicitudes de juego aún</p>
                    <p className="text-xs text-light-muted mt-1">Visitá el perfil de un jugador y presioná el botón de invitar a jugar</p>
                  </CardContent>
                </Card>
              ) : (
                enviadas.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Link to={`/jugadores/${s.receptor?.id}`} className="flex-shrink-0">
                          {s.receptor?.fotoUrl ? (
                            <img src={s.receptor.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-dark-surface flex items-center justify-center text-light-muted text-sm font-bold">
                              {s.receptor?.nombre?.[0]}{s.receptor?.apellido?.[0]}
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-light-muted">Para:</span>
                            <Link to={`/jugadores/${s.receptor?.id}`} className="font-medium text-white hover:text-primary-400 transition-colors">
                              {s.receptor?.nombre} {s.receptor?.apellido}
                            </Link>
                            {s.receptor?.esPremium && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                            <Badge variant={estadoBadge[s.estado]?.variant || 'info'}>
                              {estadoBadge[s.estado]?.label || s.estado}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-light-secondary mb-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatFecha(s.fechaPropuesta)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.hora}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.lugar}</span>
                          </div>
                          {s.mensaje && (
                            <p className="text-xs text-light-muted flex items-start gap-1 mt-1">
                              <MessageCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {s.mensaje}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SolicitudesPage;
