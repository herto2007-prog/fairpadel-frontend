import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersService } from '@/services/usersService';
import { Card, CardContent, Loading } from '@/components/ui';
import { Crown, Swords, Users, TrendingUp } from 'lucide-react';
import type { EstadisticasAvanzadas } from '@/types';

interface Props {
  userId: string;
  isPremiumViewer: boolean;
}

const AdvancedStats = ({ userId, isPremiumViewer }: Props) => {
  const [data, setData] = useState<EstadisticasAvanzadas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isPremiumViewer) return;
    setLoading(true);
    usersService.getEstadisticasAvanzadas(userId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId, isPremiumViewer]);

  if (!isPremiumViewer) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute inset-0 bg-dark-card/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Crown className="w-8 h-8 text-yellow-500 mb-2" />
            <h3 className="text-lg font-semibold text-white mb-1">Estadísticas Avanzadas</h3>
            <p className="text-sm text-light-secondary mb-3 text-center px-4">H2H, tendencia mensual y sinergia con compañeros</p>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Crown className="w-4 h-4" />
              Upgrade a Premium
            </Link>
          </div>
          {/* Blurred placeholder content */}
          <div className="filter blur-sm pointer-events-none select-none">
            <h3 className="text-lg font-semibold text-white mb-4">Estadísticas Avanzadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-48 bg-dark-surface rounded-lg" />
              <div className="h-48 bg-dark-surface rounded-lg" />
              <div className="h-48 bg-dark-surface rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loading size="md" text="Cargando estadísticas avanzadas..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const maxPuntos = Math.max(...data.tendencia.map(t => t.puntos), 1);

  return (
    <div className="space-y-4">
      {/* H2H */}
      {data.h2h.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Head to Head</h3>
              <span className="text-xs text-light-secondary">(Top 10 rivales)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-light-secondary text-xs border-b border-dark-border">
                    <th className="text-left py-2 pr-3">Oponente</th>
                    <th className="text-center py-2 px-2">P</th>
                    <th className="text-center py-2 px-2">V</th>
                    <th className="text-center py-2 px-2">D</th>
                    <th className="text-left py-2 pl-3 w-28">Win%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.h2h.map((row) => (
                    <tr key={row.opponent.id} className="border-b border-dark-border/50">
                      <td className="py-2 pr-3">
                        <Link to={`/profile/${row.opponent.id}`} className="hover:text-primary-400 transition-colors text-light-text">
                          {row.opponent.nombre} {row.opponent.apellido}
                        </Link>
                      </td>
                      <td className="text-center py-2 px-2 text-light-secondary">{row.partidos}</td>
                      <td className="text-center py-2 px-2 text-green-400 font-medium">{row.victorias}</td>
                      <td className="text-center py-2 px-2 text-red-400 font-medium">{row.derrotas}</td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${row.winRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-light-secondary">{row.winRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia */}
        {data.tendencia.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">Tendencia (12 meses)</h3>
              </div>
              <div className="flex items-end gap-1 h-32">
                {data.tendencia.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center relative" style={{ height: '100px' }}>
                      {t.puntos > 0 && (
                        <div
                          className="w-full bg-primary-500/40 rounded-t"
                          style={{ height: `${(t.puntos / maxPuntos) * 100}%`, position: 'absolute', bottom: 0 }}
                          title={`${t.puntos} pts`}
                        />
                      )}
                    </div>
                    <div className="text-[9px] text-light-secondary truncate w-full text-center">{t.mes}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-light-secondary">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary-500/40 rounded" /> Puntos
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sinergia */}
        {data.sinergia.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">Sinergia con Compañeros</h3>
              </div>
              <div className="space-y-3">
                {data.sinergia.map((s) => (
                  <div key={s.partner.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {s.partner.fotoUrl ? (
                        <img src={s.partner.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-dark-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-semibold text-primary-300 border border-primary-500/20">
                          {s.partner.nombre?.charAt(0)}{s.partner.apellido?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${s.partner.id}`} className="text-sm text-light-text hover:text-primary-400 transition-colors truncate block">
                        {s.partner.nombre} {s.partner.apellido}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.winRate >= 50 ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${s.winRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-light-secondary">{s.winRate}% · {s.partidos}P · {s.victorias}V</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedStats;
