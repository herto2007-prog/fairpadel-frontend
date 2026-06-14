import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, X } from 'lucide-react';
import { alertaService, Alerta } from '../../../services/alertaService';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';

interface Props {
  /** Ciudad sugerida (ej: la del filtro activo). */
  ciudadInicial?: string;
}

/**
 * CTA para suscribirse a "avisame cuando haya un torneo en mi ciudad".
 * Maneja todo el loop en un solo lugar: suscribir y cancelar. Si el usuario
 * ya está suscrito, muestra el estado y permite desactivarlo.
 */
export function AlertaCiudadCTA({ ciudadInicial = '' }: Props) {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [ciudad, setCiudad] = useState(ciudadInicial);
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const [cargando, setCargando] = useState(isAuthenticated);
  const [enviando, setEnviando] = useState(false);

  // Si está logueado, ver si ya tiene una alerta de ciudad activa.
  useEffect(() => {
    if (!isAuthenticated) {
      setCargando(false);
      return;
    }
    let activo = true;
    alertaService
      .listar()
      .then((alertas) => {
        if (!activo) return;
        const ciudadAlerta = alertas.find(
          (a) => a.tipo === 'TORNEO_EN_MI_CIUDAD' && a.activa,
        );
        setAlerta(ciudadAlerta || null);
      })
      .catch(() => {
        /* silencioso: no es crítico para el empty state */
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [isAuthenticated]);

  const suscribir = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const ciudadLimpia = ciudad.trim();
    if (ciudadLimpia.length < 2) {
      showError('Elegí una ciudad para activar el aviso');
      return;
    }
    setEnviando(true);
    try {
      const nueva = await alertaService.crear('TORNEO_EN_MI_CIUDAD', ciudadLimpia);
      setAlerta(nueva);
      showSuccess(`Listo, te avisaremos de torneos en ${ciudadLimpia}`);
    } catch {
      showError('No se pudo activar el aviso. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = async () => {
    if (!alerta) return;
    setEnviando(true);
    try {
      await alertaService.eliminar(alerta.id);
      setAlerta(null);
      showSuccess('Aviso desactivado');
    } catch {
      showError('No se pudo desactivar el aviso.');
    } finally {
      setEnviando(false);
    }
  };

  const ciudadSuscrita = alerta?.config?.ciudad;

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-primary/[0.06] border border-primary/20 rounded-2xl">
      {ciudadSuscrita ? (
        <>
          <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BellRing className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-1 flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            Te avisaremos
          </h4>
          <p className="text-white/50 text-sm mb-5">
            Cuando se abra un torneo en <strong className="text-white/80">{ciudadSuscrita}</strong> te
            llega un aviso (in-app y por email).
          </p>
          <button
            onClick={cancelar}
            disabled={enviando}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Desactivar aviso
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-1">Avisame cuando haya torneos</h4>
          <p className="text-white/50 text-sm mb-4">
            Activá un aviso y te escribimos apenas se abra un torneo en tu ciudad.
          </p>

          {isAuthenticated && !cargando && (
            <div className="mb-3 text-left">
              <CityAutocomplete
                value={ciudad}
                onChange={setCiudad}
                placeholder="Tu ciudad (ej: Asunción)"
              />
            </div>
          )}

          <button
            onClick={suscribir}
            disabled={enviando || cargando}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {isAuthenticated ? 'Avisame' : 'Iniciá sesión para activar el aviso'}
          </button>
        </>
      )}
    </div>
  );
}
