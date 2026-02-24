import { useState, useEffect } from 'react';
import { Loading } from '@/components/ui';
import { DollarSign, ArrowRightLeft, Handshake, BarChart3 } from 'lucide-react';
import { FinanzasPagosSection } from './FinanzasPagosSection';
import { FinanzasMovimientosSection } from './FinanzasMovimientosSection';
import { FinanzasAuspiciantesSection } from './FinanzasAuspiciantesSection';
import { FinanzasResumenSection } from './FinanzasResumenSection';
import { finanzasService } from '@/services/finanzasService';
import tournamentsService from '@/services/tournamentsService';
import toast from 'react-hot-toast';
import type { Tournament, MovimientoFinanciero, AuspicianteEspecie, DashboardFinanciero } from '@/types';

type Section = 'pagos' | 'movimientos' | 'auspiciantes' | 'resumen';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'pagos', label: 'Pagos', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'movimientos', label: 'Ingresos & Egresos', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: 'auspiciantes', label: 'Auspiciantes', icon: <Handshake className="w-4 h-4" /> },
  { key: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
];

interface Props {
  tournament: Tournament;
}

export function FinanzasTab({ tournament }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('pagos');
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [auspiciantes, setAuspiciantes] = useState<AuspicianteEspecie[]>([]);
  const [dashboard, setDashboard] = useState<DashboardFinanciero | null>(null);
  const [sponsors, setSponsors] = useState<{ id: string; nombre: string; logoUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

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
            onClick={() => setActiveSection(section.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeSection === section.key
                ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/40'
                : 'bg-dark-surface text-light-secondary hover:text-light-text hover:bg-dark-hover'
            }`}
          >
            {section.icon}
            {section.label}
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
    </div>
  );
}
