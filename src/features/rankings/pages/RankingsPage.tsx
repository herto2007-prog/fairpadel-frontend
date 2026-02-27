import { useState, useEffect, useRef, useCallback } from 'react';
import { rankingsService } from '@/services/rankingsService';
import type { Ranking } from '@/types';
import { Gender, TipoRanking } from '@/types';
import { Trophy } from 'lucide-react';
import BannerZone from '@/components/BannerZone';
import RankingsPodium from '../components/RankingsPodium';
import RankingsFilters, { type RankingTab } from '../components/RankingsFilters';
import GlobalRankingTab from '../components/GlobalRankingTab';
import CircuitoRankingTab from '../components/CircuitoRankingTab';
import CityRankingTab from '../components/CityRankingTab';

const RankingsPage = () => {
  // === State ===
  const [activeTab, setActiveTab] = useState<RankingTab>('global');
  const [genero, setGenero] = useState<Gender>(Gender.MASCULINO);
  const [temporada, setTemporada] = useState(new Date().getFullYear().toString());
  const [temporadasDisponibles, setTemporadasDisponibles] = useState<string[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(term), 400);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // === Data fetching ===

  // Load temporadas on mount
  useEffect(() => {
    rankingsService.getTemporadas()
      .then(setTemporadasDisponibles)
      .catch(() => setTemporadasDisponibles([new Date().getFullYear().toString()]));
  }, []);

  // Load rankings when gender or season changes
  // (used by Global tab, Podium, and City tab)
  useEffect(() => {
    loadRankings();
  }, [genero, temporada]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await rankingsService.getAll({
        genero,
        tipoRanking: TipoRanking.GLOBAL,
        temporada,
        limit: 100,
      });
      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear search when switching tabs
  const handleTabChange = useCallback((tab: RankingTab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setDebouncedSearch('');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner: Header zone */}
      <BannerZone zona="HEADER" className="mb-6" layout="single" />

      {/* Page title */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-2">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          Rankings
        </h1>
        <p className="text-light-secondary mt-1 sm:mt-2 text-sm sm:text-base">
          Clasificación de los mejores jugadores de pádel
        </p>
      </div>

      {/* Podium — only on Global tab when data exists */}
      {activeTab === 'global' && !loading && rankings.length >= 3 && (
        <RankingsPodium rankings={rankings} />
      )}

      {/* Filters: tabs + gender pills + season + search */}
      <RankingsFilters
        activeTab={activeTab}
        onTabChange={handleTabChange}
        genero={genero}
        onGeneroChange={setGenero}
        temporada={temporada}
        temporadas={temporadasDisponibles}
        onTemporadaChange={setTemporada}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Tab content */}
      {activeTab === 'global' && (
        <GlobalRankingTab
          rankings={rankings}
          loading={loading}
          searchTerm={debouncedSearch}
        />
      )}

      {activeTab === 'circuito' && (
        <CircuitoRankingTab genero={genero} />
      )}

      {activeTab === 'ciudad' && (
        <CityRankingTab
          rankings={rankings}
          loading={loading}
          searchTerm={debouncedSearch}
        />
      )}
    </div>
  );
};

export default RankingsPage;
