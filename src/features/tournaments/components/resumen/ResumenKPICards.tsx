import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { TournamentCategory, DashboardFinanciero } from '@/types';
import { Users, MapPin, Trophy, Layers, DollarSign, TrendingUp } from 'lucide-react';

interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

interface ResumenKPICardsProps {
  stats: TournamentStats | null;
  financiero: DashboardFinanciero | null;
  loading: boolean;
}

function RadialRing({ percent, color, size = 44 }: { percent: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(1, Math.max(0, percent));
  const offset = circumference * (1 - clampedPercent);

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-dark-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function KPICard({
  icon,
  value,
  label,
  subtext,
  ringPercent,
  ringColor,
  iconBgClass,
  loading,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  subtext?: string;
  ringPercent?: number;
  ringColor?: string;
  iconBgClass: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="flex items-start gap-3">
        {ringPercent !== undefined && ringColor ? (
          <div className="relative flex-shrink-0">
            <RadialRing percent={ringPercent} color={ringColor} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`p-1.5 rounded-full ${iconBgClass}`}>
                {icon}
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-2.5 rounded-lg ${iconBgClass} flex-shrink-0`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-7 w-16 bg-dark-surface rounded mb-1" />
              <div className="h-4 w-20 bg-dark-surface rounded" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold leading-tight truncate">{value}</p>
              <p className="text-xs text-light-secondary mt-0.5">{label}</p>
              {subtext && <p className="text-xs text-light-muted mt-0.5">{subtext}</p>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ResumenKPICards({ stats, financiero, loading }: ResumenKPICardsProps) {
  const totalInscripciones = financiero?.totalInscripciones ?? stats?.inscripcionesTotal ?? 0;
  const pagosConfirmados = financiero?.pagosConfirmados ?? 0;
  const pagosPendientes = financiero?.pagosPendientes ?? 0;
  const canchas = stats?.canchasConfiguradas ?? 0;
  const partidos = stats?.partidosTotal ?? 0;
  const totalCategorias = stats?.categorias?.length ?? 0;
  const categoriasFinalizadas = stats?.categorias?.filter((tc) => tc.estado === 'FINALIZADA').length ?? 0;

  // Partidos jugados (con resultado) vs total
  // partidosTotal from backend is the actual match count from DB
  const totalRecaudado = financiero?.totalRecaudado ?? 0;
  const totalNeto = financiero?.totalNeto ?? 0;
  const balanceEfectivo = financiero?.resumenGeneral?.balanceEfectivo ?? 0;
  const ingresosEfectivo = financiero?.resumenGeneral?.ingresosEfectivo ?? 0;
  const egresosEfectivo = financiero?.resumenGeneral?.egresosEfectivo ?? 0;

  const pagosRingPct = totalInscripciones > 0 ? pagosConfirmados / totalInscripciones : 0;
  const categoriasRingPct = totalCategorias > 0 ? categoriasFinalizadas / totalCategorias : 0;
  const recaudadoRingPct = (pagosConfirmados + pagosPendientes) > 0 ? pagosConfirmados / (pagosConfirmados + pagosPendientes) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        icon={<Users className="w-4 h-4 text-blue-400" />}
        value={String(totalInscripciones)}
        label="Parejas"
        subtext={financiero ? `${pagosConfirmados} confirmadas` : undefined}
        ringPercent={pagosRingPct}
        ringColor="#60a5fa"
        iconBgClass="bg-blue-900/30"
        loading={loading && !stats}
      />
      <KPICard
        icon={<MapPin className="w-4 h-4 text-green-400" />}
        value={String(canchas)}
        label="Canchas"
        iconBgClass="bg-green-900/30"
        loading={loading && !stats}
      />
      <KPICard
        icon={<Trophy className="w-4 h-4 text-purple-400" />}
        value={String(partidos)}
        label="Partidos"
        iconBgClass="bg-purple-900/30"
        loading={loading && !stats}
      />
      <KPICard
        icon={<Layers className="w-4 h-4 text-cyan-400" />}
        value={String(totalCategorias)}
        label="Categorias"
        subtext={categoriasFinalizadas > 0 ? `${categoriasFinalizadas} finalizadas` : undefined}
        ringPercent={categoriasRingPct}
        ringColor="#22d3ee"
        iconBgClass="bg-cyan-900/30"
        loading={loading && !stats}
      />
      <KPICard
        icon={<DollarSign className="w-4 h-4 text-amber-400" />}
        value={formatCurrency(totalRecaudado)}
        label="Recaudado"
        subtext={financiero ? `Neto: ${formatCurrency(totalNeto)}` : undefined}
        ringPercent={recaudadoRingPct}
        ringColor="#fbbf24"
        iconBgClass="bg-amber-900/30"
        loading={loading}
      />
      <KPICard
        icon={<TrendingUp className="w-4 h-4" style={{ color: balanceEfectivo >= 0 ? '#4ade80' : '#f87171' }} />}
        value={formatCurrency(balanceEfectivo)}
        label="Balance"
        subtext={financiero ? `Ing: ${formatCurrency(ingresosEfectivo)} / Egr: ${formatCurrency(egresosEfectivo)}` : undefined}
        iconBgClass={balanceEfectivo >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}
        loading={loading}
      />
    </div>
  );
}
