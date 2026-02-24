import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/adminService';
import type { Tournament, TournamentCategory } from '@/types';
import { FlaskConical, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

interface ResumenSeedPanelProps {
  tournament: Tournament;
  stats: TournamentStats | null;
  onRefresh: () => Promise<void>;
}

const SEED_DEFAULTS: Record<string, number> = {
  '8va Caballeros': 13, '7ma Caballeros': 21, '6ta Caballeros': 15,
  '5ta Caballeros': 12, '4ta Caballeros': 8, '3ra Caballeros': 6,
  '8va Damas': 26, '7ma Damas': 24, '6ta Damas': 16,
  '5ta Damas': 19, '4ta Damas': 12,
};

export function ResumenSeedPanel({ tournament, stats, onRefresh }: ResumenSeedPanelProps) {
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('admin');
  const [showSeedPanel, setShowSeedPanel] = useState(false);
  const [seedingInProgress, setSeedingInProgress] = useState(false);
  const [seedConfig, setSeedConfig] = useState<Record<string, number>>({});

  useEffect(() => {
    if (stats?.categorias && Object.keys(seedConfig).length === 0) {
      const initial: Record<string, number> = {};
      for (const tc of stats.categorias) {
        const nombre = tc.category?.nombre || '';
        initial[tc.categoryId] = SEED_DEFAULTS[nombre] ?? 8;
      }
      setSeedConfig(initial);
    }
  }, [stats?.categorias]);

  const handleSeedTestData = async () => {
    setSeedingInProgress(true);
    try {
      const result = await adminService.seedTestData(tournament.id, seedConfig);
      toast.success(
        `Cargados ${result.jugadoresCreados} jugadores y ${result.parejasInscritas} parejas`,
        { duration: 5000 }
      );
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar datos de prueba');
    } finally {
      setSeedingInProgress(false);
    }
  };

  if (!isAdmin || !stats?.categorias || stats.categorias.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-900/10">
      <button
        onClick={() => setShowSeedPanel(!showSeedPanel)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-amber-400" />
          <div>
            <p className="font-medium text-amber-400 text-sm">Datos de prueba (Admin)</p>
            <p className="text-xs text-amber-400/60">Carga jugadores ficticios e inscripciones para testing</p>
          </div>
        </div>
        {showSeedPanel ? (
          <ChevronUp className="w-5 h-5 text-amber-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-400" />
        )}
      </button>

      {showSeedPanel && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Caballeros */}
            <div>
              <h4 className="font-medium text-blue-400 mb-3 text-sm">Caballeros</h4>
              <div className="space-y-2">
                {stats.categorias
                  .filter((tc) => (tc.category?.nombre || '').toLowerCase().includes('caballeros'))
                  .sort((a, b) => (b.category?.orden ?? 0) - (a.category?.orden ?? 0))
                  .map((tc) => (
                    <div key={tc.categoryId} className="flex items-center justify-between gap-3">
                      <label className="text-sm text-light-text truncate flex-1">{tc.category?.nombre}</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={seedConfig[tc.categoryId] ?? 8}
                        onChange={(e) => setSeedConfig((prev) => ({
                          ...prev,
                          [tc.categoryId]: Math.max(0, Math.min(50, parseInt(e.target.value) || 0)),
                        }))}
                        className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-center text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  ))}
              </div>
            </div>
            {/* Damas */}
            <div>
              <h4 className="font-medium text-pink-400 mb-3 text-sm">Damas</h4>
              <div className="space-y-2">
                {stats.categorias
                  .filter((tc) => (tc.category?.nombre || '').toLowerCase().includes('damas'))
                  .sort((a, b) => (b.category?.orden ?? 0) - (a.category?.orden ?? 0))
                  .map((tc) => (
                    <div key={tc.categoryId} className="flex items-center justify-between gap-3">
                      <label className="text-sm text-light-text truncate flex-1">{tc.category?.nombre}</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={seedConfig[tc.categoryId] ?? 8}
                        onChange={(e) => setSeedConfig((prev) => ({
                          ...prev,
                          [tc.categoryId]: Math.max(0, Math.min(50, parseInt(e.target.value) || 0)),
                        }))}
                        className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-center text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Total y boton */}
          <div className="flex items-center justify-between pt-3 border-t border-dark-border">
            <p className="text-sm text-light-secondary">
              Total: <span className="font-bold text-light-text">
                {Object.values(seedConfig).reduce((a, b) => a + b, 0)} parejas
              </span>
              {' '}({Object.values(seedConfig).reduce((a, b) => a + b, 0) * 2} jugadores)
            </p>
            <Button
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSeedTestData}
              disabled={seedingInProgress || Object.values(seedConfig).every((v) => v === 0)}
            >
              {seedingInProgress ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cargando...</>
              ) : (
                <><FlaskConical className="w-4 h-4 mr-2" /> Cargar datos de prueba</>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
