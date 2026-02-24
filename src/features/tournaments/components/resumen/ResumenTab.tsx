import { useEffect, useState } from 'react';
import tournamentsService from '@/services/tournamentsService';
import type { Tournament, TournamentCategory, TorneoPelotasRonda, DashboardFinanciero } from '@/types';
import { ResumenStatusBanners, ResumenActionBanners } from './ResumenActions';
import { ResumenKPICards } from './ResumenKPICards';
import { ResumenCategoriasChart } from './ResumenCategoriasChart';
import { ResumenResourceCards } from './ResumenResourceCards';
import { ResumenInfoCard } from './ResumenInfoCard';
import { ResumenSeedPanel } from './ResumenSeedPanel';

// Matches ManageTournamentPage TournamentStats interface
interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

interface ResumenTabProps {
  tournament: Tournament;
  stats: TournamentStats | null;
  onRefresh: () => Promise<void>;
}

export function ResumenTab({ tournament, stats, onRefresh }: ResumenTabProps) {
  const [financiero, setFinanciero] = useState<DashboardFinanciero | null>(null);
  const [pelotasConfig, setPelotasConfig] = useState<TorneoPelotasRonda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [financieroData, pelotasData] = await Promise.all([
          tournamentsService.getDashboardFinanciero(tournament.id).catch(() => null),
          tournamentsService.getPelotasRonda(tournament.id).catch(() => []),
        ]);

        if (!cancelled) {
          setFinanciero(financieroData);
          setPelotasConfig(pelotasData || []);
        }
      } catch {
        // Silently handle — stats still available from parent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [tournament.id]);

  return (
    <div className="space-y-6">
      {/* Status banners — finalization progress, finalize button + modal */}
      <ResumenStatusBanners tournament={tournament} stats={stats} onRefresh={onRefresh} />

      {/* 6 KPI cards with radial progress rings */}
      <ResumenKPICards stats={stats} financiero={financiero} loading={loading} />

      {/* Category bar charts by gender */}
      {stats?.categorias && stats.categorias.length > 0 && (
        <ResumenCategoriasChart categorias={stats.categorias} />
      )}

      {/* Resource planning cards — hours, balls, ball cost */}
      <ResumenResourceCards
        tournament={tournament}
        stats={stats}
        pelotasConfig={pelotasConfig}
        loading={loading}
      />

      {/* Compact tournament info */}
      <ResumenInfoCard tournament={tournament} />

      {/* Admin-only seed panel */}
      <ResumenSeedPanel tournament={tournament} stats={stats} onRefresh={onRefresh} />

      {/* Action banners — publish, cancel + modals */}
      <ResumenActionBanners tournament={tournament} stats={stats} onRefresh={onRefresh} />
    </div>
  );
}
