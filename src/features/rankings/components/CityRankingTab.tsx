import { useMemo } from 'react';
import { useState } from 'react';
import { Card, CardContent, Badge, Loading } from '@/components/ui';
import CityAutocomplete from '@/components/ui/CityAutocomplete';
import type { Ranking } from '@/types';
import { MapPin, TrendingUp, TrendingDown, Minus, Crown, Flame, Trophy } from 'lucide-react';

interface CityRankingTabProps {
  rankings: Ranking[];
  loading: boolean;
  searchTerm: string;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const CityRankingTab: React.FC<CityRankingTabProps> = ({ rankings, loading, searchTerm }) => {
  const [selectedCity, setSelectedCity] = useState('');

  const cityRankings = useMemo(() => {
    if (!selectedCity) return [];
    let filtered = rankings.filter(
      (r) => normalize(r.jugador?.ciudad || '') === normalize(selectedCity)
    );
    if (searchTerm.trim()) {
      const term = normalize(searchTerm);
      filtered = filtered.filter((r) => {
        const name = normalize(`${r.jugador?.nombre || ''} ${r.jugador?.apellido || ''}`);
        return name.includes(term);
      });
    }
    // Re-number positions within city
    return filtered.map((r, i) => ({ ...r, cityPosition: i + 1 }));
  }, [rankings, selectedCity, searchTerm]);

  const getChange = (r: Ranking) => {
    if (!r.posicionAnterior) return null;
    const diff = r.posicionAnterior - r.posicion;
    if (diff > 0) return <span className="flex items-center text-green-400 text-xs"><TrendingUp className="h-3 w-3 mr-0.5" />+{diff}</span>;
    if (diff < 0) return <span className="flex items-center text-red-400 text-xs"><TrendingDown className="h-3 w-3 mr-0.5" />{diff}</span>;
    return <Minus className="h-3 w-3 text-light-muted" />;
  };

  const getWinBadge = (pct?: number) => {
    if (!pct) return <span className="text-light-muted">-</span>;
    const variant = pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'default';
    return <Badge variant={variant} className="text-xs">{pct.toFixed(0)}%</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* City selector */}
      <div className="max-w-sm">
        <CityAutocomplete
          value={selectedCity}
          onChange={setSelectedCity}
          placeholder="Selecciona una ciudad..."
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loading size="lg" text="Cargando rankings..." /></div>
      ) : !selectedCity ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-light-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ranking por Ciudad</h3>
            <p className="text-light-secondary">Selecciona una ciudad para ver el ranking local</p>
          </CardContent>
        </Card>
      ) : cityRankings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🏙️</div>
            <h3 className="text-xl font-semibold mb-2">Sin rankings en {selectedCity}</h3>
            <p className="text-light-secondary">
              {searchTerm ? `No se encontraron jugadores con "${searchTerm}"` : 'No hay jugadores rankeados en esta ciudad'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-light-secondary">
            <MapPin className="h-4 w-4" />
            <span>{cityRankings.length} jugadores en <strong className="text-light-text">{selectedCity}</strong></span>
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-surface border-b border-dark-border">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-light-secondary w-12">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-light-secondary w-12">Global</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-light-secondary w-10"></th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-light-secondary">Jugador</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">Pts</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">Torneos</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">V/D</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">%</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">Racha</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-light-secondary">Camp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {cityRankings.map((r, i) => (
                      <tr
                        key={r.id}
                        className="hover:bg-dark-hover transition-colors animate-fade-up opacity-0"
                        style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'forwards' }}
                      >
                        <td className="px-3 py-2.5">
                          {r.cityPosition <= 3 ? (
                            <span className="text-lg">{['🥇', '🥈', '🥉'][r.cityPosition - 1]}</span>
                          ) : (
                            <span className="text-light-secondary font-medium">{r.cityPosition}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-light-muted">#{r.posicion}</td>
                        <td className="px-2 py-2.5 text-center">{getChange(r)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold text-sm flex-shrink-0 overflow-hidden">
                              {r.jugador?.fotoUrl ? (
                                <img src={r.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                r.jugador?.nombre?.charAt(0) || '?'
                              )}
                            </div>
                            <span className="font-medium text-sm flex items-center gap-1">
                              {r.jugador?.nombre} {r.jugador?.apellido}
                              {(r.jugador as any)?.esPremium && <Crown className="h-3 w-3 text-yellow-500" />}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-primary-500">{r.puntosTotales}</td>
                        <td className="px-3 py-2.5 text-center text-sm">{r.torneosJugados}</td>
                        <td className="px-3 py-2.5 text-center text-sm">
                          <span className="text-green-400">{r.victorias}</span>
                          <span className="text-light-muted">/</span>
                          <span className="text-red-400">{r.derrotas}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">{getWinBadge(r.porcentajeVictorias ? Number(r.porcentajeVictorias) : undefined)}</td>
                        <td className="px-3 py-2.5 text-center">
                          {(r.rachaActual || 0) >= 3 ? (
                            <span className="flex items-center justify-center gap-0.5 text-orange-400 font-semibold text-sm"><Flame className="h-3.5 w-3.5" />{r.rachaActual}</span>
                          ) : (
                            <span className="text-sm text-light-secondary">{r.rachaActual || 0}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {(r.campeonatos || 0) > 0 ? (
                            <span className="flex items-center justify-center gap-0.5 text-yellow-400 text-sm"><Trophy className="h-3.5 w-3.5" />{r.campeonatos}</span>
                          ) : (
                            <span className="text-sm text-light-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {cityRankings.map((r, i) => (
              <Card
                key={r.id}
                className="animate-fade-up opacity-0"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' } as React.CSSProperties}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-8 text-center flex-shrink-0">
                    {r.cityPosition <= 3 ? (
                      <span className="text-lg">{['🥇', '🥈', '🥉'][r.cityPosition - 1]}</span>
                    ) : (
                      <span className="text-light-secondary font-medium text-sm">{r.cityPosition}</span>
                    )}
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {r.jugador?.fotoUrl ? (
                      <img src={r.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      r.jugador?.nombre?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      {r.jugador?.nombre} {r.jugador?.apellido}
                      {(r.jugador as any)?.esPremium && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                    </p>
                    <p className="text-xs text-light-secondary">Global #{r.posicion} · {r.torneosJugados} torneos</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary-500 text-sm">{r.puntosTotales} pts</p>
                    <div className="text-xs">{getChange(r)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CityRankingTab;
