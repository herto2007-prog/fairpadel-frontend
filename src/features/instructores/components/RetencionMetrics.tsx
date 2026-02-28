import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import {
  BarChart2,
  Users,
  AlertTriangle,
  UserMinus,
  TrendingUp,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';
import type { RetencionMetrics as RetencionMetricsType } from '@/types';

const RetencionMetrics = () => {
  const [metrics, setMetrics] = useState<RetencionMetricsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerRetencion();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading retention metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart2 className="h-10 w-10 mx-auto mb-3 text-light-muted" />
        <p className="text-sm text-light-secondary">No hay datos de métricas aún</p>
      </div>
    );
  }

  const maxClases = Math.max(...metrics.clasesUltimos6Meses.map((m) => m.clases), 1);

  const diasDesde = (fecha: string) => {
    const diff = new Date().getTime() - new Date(fecha + 'T00:00:00').getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1.5 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{metrics.activos}</p>
            <p className="text-[10px] text-light-muted">Activos</p>
            <p className="text-[9px] text-light-muted/60">últimos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">{metrics.enRiesgo}</p>
            <p className="text-[10px] text-light-muted">En Riesgo</p>
            <p className="text-[9px] text-light-muted/60">31-60 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserMinus className="h-5 w-5 mx-auto mb-1.5 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{metrics.perdidos}</p>
            <p className="text-[10px] text-light-muted">Perdidos</p>
            <p className="text-[9px] text-light-muted/60">+60 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1.5 text-blue-400" />
            <p className="text-2xl font-bold text-blue-400">{metrics.tasaRetencion}%</p>
            <p className="text-[10px] text-light-muted">Retención</p>
            <p className="text-[9px] text-light-muted/60">{metrics.totalAlumnos} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-5 w-5" />
            Clases — últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.clasesUltimos6Meses.map((m) => (
            <div key={m.mes} className="flex items-center gap-3">
              <span className="text-xs text-light-muted w-16 text-right capitalize">{m.mes}</span>
              <div className="flex-1 h-5 bg-dark-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500/60 rounded-full transition-all duration-500"
                  style={{ width: `${(m.clases / maxClases) * 100}%` }}
                />
              </div>
              <span className="text-xs text-light-text font-medium w-8 text-right">{m.clases}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      {metrics.alumnosEnRiesgo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Alumnos en riesgo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.alumnosEnRiesgo.map((alumno, idx) => {
              const dias = alumno.ultimaClase ? diasDesde(alumno.ultimaClase) : 0;
              return (
                <div key={idx} className="flex items-center gap-3 p-2 bg-dark-surface rounded-lg">
                  {alumno.fotoUrl ? (
                    <img src={alumno.fotoUrl} alt={alumno.nombre} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-yellow-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-light-text truncate">
                      {alumno.nombre} {alumno.apellido || ''}
                    </p>
                    <p className="text-[10px] text-light-muted flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      Última clase hace {dias} días
                    </p>
                  </div>
                  <Badge variant="warning" className="text-[10px] flex-shrink-0">
                    {alumno.totalClases} clases
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary note */}
      {metrics.totalAlumnos === 0 && (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto mb-3 text-light-muted" />
          <p className="text-sm text-light-secondary">
            Aún no tenés alumnos. Las métricas aparecerán cuando des tus primeras clases.
          </p>
        </div>
      )}
    </div>
  );
};

export default RetencionMetrics;
