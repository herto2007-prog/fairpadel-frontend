import { useState, useEffect } from 'react';
import { circuitosService } from '@/services/circuitosService';
import { Card, CardContent, Loading, Badge } from '@/components/ui';
import type { Circuito, CircuitoStanding } from '@/types';
import { Gender } from '@/types';
import { Trophy, Calendar, MapPin, Globe } from 'lucide-react';

interface CircuitoRankingTabProps {
  genero: Gender;
}

const CircuitoRankingTab: React.FC<CircuitoRankingTabProps> = ({ genero }) => {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [standings, setStandings] = useState<CircuitoStanding[]>([]);
  const [loadingCircuitos, setLoadingCircuitos] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    circuitosService.getAll()
      .then(setCircuitos)
      .catch(() => {})
      .finally(() => setLoadingCircuitos(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setStandings([]);
      return;
    }
    setLoadingStandings(true);
    circuitosService.getStandings(selectedId, genero)
      .then(setStandings)
      .catch(() => setStandings([]))
      .finally(() => setLoadingStandings(false));
  }, [selectedId, genero]);

  if (loadingCircuitos) {
    return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando circuitos..." /></div>;
  }

  if (circuitos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Globe className="h-12 w-12 text-light-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay circuitos activos</h3>
          <p className="text-light-secondary">Aun no hay circuitos disponibles para ver rankings</p>
        </CardContent>
      </Card>
    );
  }

  const selectedCircuito = circuitos.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Circuit cards selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {circuitos.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id === selectedId ? '' : c.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              c.id === selectedId
                ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                : 'border-dark-border bg-dark-card hover:bg-dark-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              {c.logoUrl ? (
                <img src={c.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold">
                  {c.nombre.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-light-text truncate">{c.nombre}</p>
                <div className="flex items-center gap-2 text-xs text-light-secondary">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />{c.temporada}
                  </span>
                  {c.ciudad && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />{c.ciudad}
                    </span>
                  )}
                  <span>{c._count?.torneos || 0} torneos</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Standings */}
      {selectedId && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary-400" />
              <h3 className="font-semibold text-light-text">
                Standings — {selectedCircuito?.nombre}
              </h3>
              {selectedCircuito?.multiplicador && selectedCircuito.multiplicador !== 1.0 && (
                <Badge variant="info" className="text-xs">x{selectedCircuito.multiplicador} pts</Badge>
              )}
            </div>

            {loadingStandings ? (
              <div className="py-8"><Loading size="sm" text="Cargando standings..." /></div>
            ) : standings.length === 0 ? (
              <p className="text-sm text-light-secondary text-center py-8">
                No hay standings disponibles para este circuito
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border text-left text-xs text-light-secondary">
                        <th className="px-3 py-2 w-12">#</th>
                        <th className="px-3 py-2">Jugador</th>
                        <th className="px-3 py-2">Ciudad</th>
                        <th className="px-3 py-2 text-right">Puntos</th>
                        <th className="px-3 py-2 text-right">Torneos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {standings.map((s, i) => (
                        <tr
                          key={s.jugador.id}
                          className="hover:bg-dark-hover transition-colors animate-fade-up opacity-0"
                          style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'forwards' }}
                        >
                          <td className="px-3 py-2.5">
                            {s.posicion <= 3 ? (
                              <span className="text-lg">{['🥇', '🥈', '🥉'][s.posicion - 1]}</span>
                            ) : (
                              <span className="text-light-secondary font-medium">{s.posicion}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-sm">{s.jugador.nombre} {s.jugador.apellido}</td>
                          <td className="px-3 py-2.5 text-sm text-light-secondary">{s.jugador.ciudad || '-'}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-primary-500">{s.puntosTotales}</td>
                          <td className="px-3 py-2.5 text-right text-sm text-light-secondary">{s.torneosJugados}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {standings.map((s, i) => (
                    <div
                      key={s.jugador.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-dark-surface animate-fade-up opacity-0"
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="w-8 text-center flex-shrink-0">
                        {s.posicion <= 3 ? (
                          <span className="text-lg">{['🥇', '🥈', '🥉'][s.posicion - 1]}</span>
                        ) : (
                          <span className="text-light-secondary font-medium text-sm">{s.posicion}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.jugador.nombre} {s.jugador.apellido}</p>
                        <p className="text-xs text-light-secondary">{s.jugador.ciudad || '-'} · {s.torneosJugados} torneos</p>
                      </div>
                      <div className="font-bold text-primary-500 text-sm flex-shrink-0">{s.puntosTotales} pts</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CircuitoRankingTab;
