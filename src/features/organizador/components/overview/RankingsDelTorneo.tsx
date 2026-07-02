import { useEffect, useMemo, useState } from 'react';
import { Trophy, Plus, X, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { circuitosService } from '../../../circuitos/circuitosService';
import { useToast } from '../../../../components/ui/ToastProvider';

interface MiRanking {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  torneos: { id: string; nombre: string }[];
}

/**
 * "Suma en:" — la puerta torneo→ranking (la inversa, ranking→torneo, vive en
 * /mis-rankings). Ata este torneo a los rankings del organizador sin salir de
 * la gestión. Mismos endpoints de Mis rankings; quitar recalcula la tabla.
 */
export function RankingsDelTorneo({ tournamentId }: { tournamentId: string }) {
  const { showSuccess, showError } = useToast();
  const [rankings, setRankings] = useState<MiRanking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    try {
      const r = await circuitosService.getMisRankings();
      setRankings(r.data || []);
    } catch {
      setRankings([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [tournamentId]);

  const sumaEn = useMemo(
    () => rankings.filter((r) => r.torneos.some((t) => t.id === tournamentId)),
    [rankings, tournamentId],
  );
  const disponibles = useMemo(
    () => rankings.filter((r) => r.estado === 'ACTIVO' && !r.torneos.some((t) => t.id === tournamentId)),
    [rankings, tournamentId],
  );

  const sumar = async (rankingId: string) => {
    setProcesando(true);
    try {
      const r = await circuitosService.sumarTorneoAMiRanking(rankingId, tournamentId);
      showSuccess('Sumado', r.message || 'Este torneo ahora suma en el ranking.');
      setPickerAbierto(false);
      await cargar();
    } catch (err: any) {
      showError('No se pudo sumar', err.response?.data?.message || 'Error');
    } finally {
      setProcesando(false);
    }
  };

  const quitar = async (rankingId: string) => {
    setProcesando(true);
    try {
      await circuitosService.quitarTorneoDeMiRanking(rankingId, tournamentId);
      showSuccess('Quitado', 'El torneo dejó de sumar ahí; la tabla se recalculó.');
      await cargar();
    } catch (err: any) {
      showError('No se pudo quitar', err.response?.data?.message || 'Error');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return null;

  return (
    <div className="bg-[#151921] border border-[#232838] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#df2531]" />
          Suma en
        </h3>
        <Link to="/mis-rankings" className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
          Mis rankings <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {rankings.length === 0 ? (
        <p className="text-sm text-gray-500">
          Todavía no tenés rankings. <Link to="/mis-rankings" className="text-[#df2531] hover:underline">Creá el primero gratis</Link> y este torneo puede sumar puntos ahí.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sumaEn.length === 0 && (
              <span className="text-sm text-gray-500 py-1">Este torneo no suma en ningún ranking todavía.</span>
            )}
            {sumaEn.map((r) => (
              <span key={r.id} className="flex items-center gap-1.5 bg-[#0B0E14] border border-white/10 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg">
                <Trophy className="w-3 h-3 text-[#df2531]" />
                {r.nombre}
                <button onClick={() => quitar(r.id)} disabled={procesando} title="Dejar de sumar en este ranking"
                  className="text-gray-600 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {disponibles.length > 0 && (
              <button onClick={() => setPickerAbierto((v) => !v)} disabled={procesando}
                className="flex items-center gap-1 border border-dashed border-[#df2531]/60 text-[#f0999b] text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#df2531]/10 transition-colors">
                <Plus className="w-3 h-3" /> Sumar a un ranking <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>

          {pickerAbierto && (
            <div className="mt-3 bg-[#0B0E14] border border-white/10 rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto">
              {disponibles.map((r) => (
                <button key={r.id} onClick={() => sumar(r.id)} disabled={procesando}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
                  {procesando ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" /> : <Trophy className="w-3.5 h-3.5 text-[#df2531]" />}
                  <span className="text-gray-200 text-xs">{r.nombre}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
