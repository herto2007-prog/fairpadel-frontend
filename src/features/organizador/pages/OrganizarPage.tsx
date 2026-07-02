import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Loader2, Sparkles, Link2, CalendarClock, BarChart3,
  ShieldCheck, Wallet, CheckCircle2,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useNoIndex } from '../../../hooks/useNoIndex';

/**
 * Puerta de entrada del organizador (autoservicio). Cualquier usuario logueado
 * activa su modo organizador acá y va directo al wizard. El control de calidad
 * está en la publicación: el 1er torneo pasa por aprobación de FairPadel.
 */
export function OrganizarPage() {
  useNoIndex();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showError } = useToast();
  const [activando, setActivando] = useState(false);

  // Si ya es organizador, la puerta ya está abierta.
  if (user?.roles?.includes('organizador') || user?.roles?.includes('admin')) {
    return <Navigate to="/mis-torneos" replace />;
  }

  const activar = async () => {
    setActivando(true);
    try {
      await api.post('/auth/quiero-organizar');
      await refreshUser(); // el menú y las rutas ven el rol nuevo al instante
      navigate('/mis-torneos?crear=1', { replace: true });
    } catch (err: any) {
      showError('No se pudo activar', err.response?.data?.message || 'Probá de nuevo en un momento.');
      setActivando(false);
    }
  };

  const features = [
    { icon: Sparkles, titulo: 'Creás el torneo en 3 pasos', detalle: 'Nombre, fechas y categorías. Nada más para arrancar.' },
    { icon: Link2, titulo: 'Inscripciones online', detalle: 'Compartís un link y las parejas se anotan solas.' },
    { icon: CalendarClock, titulo: 'Cuadro y agenda automáticos', detalle: 'Un botón sortea el cuadro y acomoda días, horarios y canchas.' },
    { icon: BarChart3, titulo: 'Resultados y ranking', detalle: 'Cargás resultados y los puntos van solos al ranking.' },
  ];

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Encabezado */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#df2531]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trophy className="w-10 h-10 text-[#df2531]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Organizá tu torneo</h1>
            <p className="text-gray-400">
              De la idea al cuadro publicado, con la plataforma haciendo el trabajo pesado.
            </p>
          </div>

          {/* Qué hace la plataforma */}
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.titulo} className="bg-[#151921] border border-[#232838] rounded-xl p-4">
                  <Icon className="w-5 h-5 text-[#df2531] mb-2" />
                  <p className="text-white text-sm font-medium mb-1">{f.titulo}</p>
                  <p className="text-gray-500 text-xs">{f.detalle}</p>
                </div>
              );
            })}
          </div>

          {/* Cómo funciona (honesto, sin letra chica) */}
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-5 mb-8 space-y-3">
            <p className="text-white text-sm font-semibold">Cómo funciona</p>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-gray-400">Crear y armar tu torneo es <span className="text-white">gratis</span>. Publicás cuando está listo.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-gray-400">Tu <span className="text-white">primer torneo</span> pasa por una revisión rápida de FairPadel antes de salir público. Después, publicás al instante.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Wallet className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-gray-400">Al finalizar el torneo, FairPadel cobra <span className="text-white">Gs. 10.000 por jugador confirmado</span>. Sin costos fijos ni sorpresas.</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={activar}
            disabled={activando}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#df2531]/20 disabled:opacity-60"
          >
            {activando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
            {activando ? 'Activando…' : 'Activar modo organizador'}
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">
            Se agrega a tu cuenta actual — seguís siendo jugador como siempre.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
