import { Select } from '@/components/ui';
import { Gender } from '@/types';
import { Globe, Trophy, MapPin, Search } from 'lucide-react';

export type RankingTab = 'global' | 'circuito' | 'ciudad';

interface RankingsFiltersProps {
  activeTab: RankingTab;
  onTabChange: (tab: RankingTab) => void;
  genero: Gender;
  onGeneroChange: (g: Gender) => void;
  temporada: string;
  temporadas: string[];
  onTemporadaChange: (t: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const tabs: { key: RankingTab; label: string; icon: React.ReactNode }[] = [
  { key: 'global', label: 'Ranking Global', icon: <Globe className="w-4 h-4" /> },
  { key: 'circuito', label: 'Por Circuito', icon: <Trophy className="w-4 h-4" /> },
  { key: 'ciudad', label: 'Por Ciudad', icon: <MapPin className="w-4 h-4" /> },
];

const RankingsFilters: React.FC<RankingsFiltersProps> = ({
  activeTab,
  onTabChange,
  genero,
  onGeneroChange,
  temporada,
  temporadas,
  onTemporadaChange,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Row 1: Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Gender pills */}
        <div className="flex rounded-lg overflow-hidden border border-dark-border">
          {[Gender.MASCULINO, Gender.FEMENINO].map((g) => (
            <button
              key={g}
              onClick={() => onGeneroChange(g)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                genero === g
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-card text-light-secondary hover:bg-dark-hover'
              }`}
            >
              {g === Gender.MASCULINO ? 'Masculino' : 'Femenino'}
            </button>
          ))}
        </div>

        {/* Season selector */}
        {temporadas.length > 1 && (
          <Select
            value={temporada}
            onChange={(e) => onTemporadaChange(e.target.value)}
            className="w-24 sm:w-28"
          >
            {temporadas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        )}

        {/* Player search (only on global & ciudad tabs) */}
        {(activeTab === 'global' || activeTab === 'ciudad') && (
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar jugador..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-dark-input border border-dark-border rounded-lg text-light-text placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsFilters;
