import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loading, Card } from '@/components/ui';
import { DollarSign, ArrowRightLeft, Handshake, BarChart3, Crown, TrendingUp, Users, Target, CalendarDays } from 'lucide-react';
import { FinanzasPagosSection } from './FinanzasPagosSection';
import { FinanzasMovimientosSection } from './FinanzasMovimientosSection';
import { FinanzasAuspiciantesSection } from './FinanzasAuspiciantesSection';
import { FinanzasResumenSection } from './FinanzasResumenSection';
import { finanzasService } from '@/services/finanzasService';
import tournamentsService from '@/services/tournamentsService';
import toast from 'react-hot-toast';
import type { Tournament, MovimientoFinanciero, AuspicianteEspecie, DashboardFinanciero } from '@/types';

type Section = 'pagos' | 'movimientos' | 'auspiciantes' | 'resumen' | 'insights';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; premium?: boolean }[] = [
  { key: 'pagos', label: 'Pagos', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'movimientos', label: 'Ingresos & Egresos', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: 'auspiciantes', label: 'Auspiciantes', icon: <Handshake className="w-4 h-4" /> },
  { key: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'insights', label: 'Insights', icon: <TrendingUp className="w-4 h-4" />, premium: true },
];

interface PremiumInsights {
  jugadoresRecurrentes: number;
  totalJugadores: number;
  tasaRetencion: number;
  categoriaMasPopular: string;
  totalInscripciones: number;
  promedioInscripcionesDia: number;
  torneosAnteriores: number;
}

interface Props {
  tournament: Tournament;
  isPremium?: boolean;
}

export function FinanzasTab({ tournament, isPremium }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('pagos');
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [auspiciantes, setAuspiciantes] = useState<AuspicianteEspecie[]>([]);
  const [dashboard, setDashboard] = useState<DashboardFinanciero | null>(null);
  const [sponsors, setSponsors] = useState<{ id: string; nombre: string; logoUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<PremiumInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [tournament.id]);

  const loadAll = async () => {
    try {
      const [movData, auspData, dashData] = await Promise.all([
        finanzasService.getMovimientos(tournament.id).catch(() => [] as MovimientoFinanciero[]),
        finanzasService.getAuspiciantesEspecie(tournament.id).catch(() => [] as AuspicianteEspecie[]),
        tournamentsService.getDashboardFinanciero(tournament.id).catch(() => null),
      ]);
      setMovimientos(movData);
      setAuspiciantes(auspData);
      setDashboard(dashData);

      // Extract sponsors from tournament data
      const tournamentAny = tournament as any;
      if (tournamentAny.sponsors) {
        setSponsors(
          (tournamentAny.sponsors as any[]).map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            logoUrl: s.logoUrl,
          }))
        );
      }
    } catch (err) {
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const [movData, auspData, dashData] = await Promise.all([
      finanzasService.getMovimientos(tournament.id).catch(() => [] as MovimientoFinanciero[]),
      finanzasService.getAuspiciantesEspecie(tournament.id).catch(() => [] as AuspicianteEspecie[]),
      tournamentsService.getDashboardFinanciero(tournament.id).catch(() => null),
    ]);
    setMovimientos(movData);
    setAuspiciantes(auspData);
    setDashboard(dashData);
  };

  const loadInsights = async () => {
    if (insights || insightsLoading) return;
    setInsightsLoading(true);
    try {
      const data = await tournamentsService.getPremiumInsights(tournament.id);
      setInsights(data);
    } catch {
      toast.error('Error al cargar insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSectionChange = (key: Section) => {
    setActiveSection(key);
    if (key === 'insights' && isPremium) {
      loadInsights();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando finanzas..." /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Section Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => handleSectionChange(section.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeSection === section.key
                ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/40'
                : 'bg-dark-surface text-light-secondary hover:text-light-text hover:bg-dark-hover'
            }`}
          >
            {section.icon}
            {section.label}
            {section.premium && !isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
          </button>
        ))}
      </div>

      {/* Active Section */}
      {activeSection === 'pagos' && (
        <FinanzasPagosSection tournament={tournament} />
      )}
      {activeSection === 'movimientos' && (
        <FinanzasMovimientosSection
          tournament={tournament}
          movimientos={movimientos}
          onRefresh={handleRefresh}
        />
      )}
      {activeSection === 'auspiciantes' && (
        <FinanzasAuspiciantesSection
          tournament={tournament}
          auspiciantes={auspiciantes}
          sponsors={sponsors}
          onRefresh={handleRefresh}
        />
      )}
      {activeSection === 'resumen' && dashboard && (
        <FinanzasResumenSection
          tournament={tournament}
          dashboard={dashboard}
        />
      )}
      {activeSection === 'resumen' && !dashboard && (
        <div className="text-center py-12 text-light-secondary">
          No se pudieron cargar los datos del resumen financiero
        </div>
      )}
      {activeSection === 'insights' && (
        isPremium ? (
          insightsLoading ? (
            <div className="flex justify-center py-12"><Loading size="md" text="Cargando insights..." /></div>
          ) : insights ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 border border-purple-500/20 bg-purple-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-xs text-light-secondary">Jugadores Recurrentes</div>
                </div>
                <div className="text-2xl font-bold text-white">{insights.jugadoresRecurrentes}</div>
                <div className="text-xs text-light-secondary mt-1">de {insights.totalJugadores} totales</div>
              </Card>

              <Card className="p-4 border border-green-500/20 bg-green-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-xs text-light-secondary">Tasa de Retención</div>
                </div>
                <div className="text-2xl font-bold text-white">{insights.tasaRetencion}%</div>
                <div className="text-xs text-light-secondary mt-1">{insights.torneosAnteriores} torneos anteriores</div>
              </Card>

              <Card className="p-4 border border-blue-500/20 bg-blue-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-xs text-light-secondary">Categoría Más Popular</div>
                </div>
                <div className="text-2xl font-bold text-white truncate">{insights.categoriaMasPopular}</div>
                <div className="text-xs text-light-secondary mt-1">{insights.totalInscripciones} inscripciones</div>
              </Card>

              <Card className="p-4 border border-yellow-500/20 bg-yellow-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-xs text-light-secondary">Inscripciones/Día</div>
                </div>
                <div className="text-2xl font-bold text-white">{insights.promedioInscripcionesDia}</div>
                <div className="text-xs text-light-secondary mt-1">promedio diario</div>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-light-secondary">No se pudieron cargar los insights</div>
          )
        ) : (
          <Card className="p-8 text-center border border-yellow-500/20 bg-yellow-900/5">
            <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Insights Premium</h3>
            <p className="text-sm text-light-secondary mb-4">
              Accede a métricas avanzadas: retención de jugadores, categoría más popular y tendencia de inscripciones.
            </p>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Crown className="w-4 h-4" />
              Activar Premium — $2.99/mes
            </Link>
          </Card>
        )
      )}
    </div>
  );
}
