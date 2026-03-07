import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { matchService, Match } from '../../../services/matchService';

export function CargarResultadoPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sets, setSets] = useState({
    set1Pareja1: 0,
    set1Pareja2: 0,
    set2Pareja1: 0,
    set2Pareja2: 0,
    set3Pareja1: 0,
    set3Pareja2: 0,
  });
  const [tieneSet3, setTieneSet3] = useState(false);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (matchId) loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setIsLoading(true);
      const data = await matchService.getById(matchId!);
      setMatch(data);
      
      // Si ya tiene resultado, pre-cargar
      if (data.estado === 'FINALIZADO') {
        setSets({
          set1Pareja1: data.set1Pareja1 || 0,
          set1Pareja2: data.set1Pareja2 || 0,
          set2Pareja1: data.set2Pareja1 || 0,
          set2Pareja2: data.set2Pareja2 || 0,
          set3Pareja1: data.set3Pareja1 || 0,
          set3Pareja2: data.set3Pareja2 || 0,
        });
        if (data.set3Pareja1 !== undefined && data.set3Pareja1 !== null) {
          setTieneSet3(true);
        }
        if (data.notas) setNotas(data.notas);
      }
    } catch (error) {
      toast.error('Error al cargar partido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay ganador (mejor de 3)
    const setsPareja1 = [sets.set1Pareja1, sets.set2Pareja1, tieneSet3 ? sets.set3Pareja1 : null].filter(s => s !== null);
    const setsPareja2 = [sets.set1Pareja2, sets.set2Pareja2, tieneSet3 ? sets.set3Pareja2 : null].filter(s => s !== null);
    
    let setsGanadosPareja1 = 0;
    let setsGanadosPareja2 = 0;
    
    for (let i = 0; i < Math.min(setsPareja1.length, setsPareja2.length); i++) {
      if (setsPareja1[i]! > setsPareja2[i]!) setsGanadosPareja1++;
      else if (setsPareja2[i]! > setsPareja1[i]!) setsGanadosPareja2++;
    }
    
    if (setsGanadosPareja1 < 2 && setsGanadosPareja2 < 2) {
      toast.error('El resultado no tiene un ganador claro (mejor de 3 sets)');
      return;
    }

    try {
      setIsSubmitting(true);
      await matchService.registrarResultado(matchId!, {
        set1Pareja1: sets.set1Pareja1,
        set1Pareja2: sets.set1Pareja2,
        set2Pareja1: sets.set2Pareja1,
        set2Pareja2: sets.set2Pareja2,
        ...(tieneSet3 && {
          set3Pareja1: sets.set3Pareja1,
          set3Pareja2: sets.set3Pareja2,
        }),
        notas,
      });
      toast.success('Resultado registrado correctamente');
      navigate(-1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar resultado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWO = async (parejaGanadoraId: string) => {
    if (!confirm('¿Confirmar WO? Esta acción no se puede deshacer.')) return;
    
    try {
      setIsSubmitting(true);
      await matchService.registrarWO(matchId!, parejaGanadoraId);
      toast.success('WO registrado');
      navigate(-1);
    } catch (error) {
      toast.error('Error al registrar WO');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white">Partido no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al bracket
        </button>

        <div className="bg-gradient-to-r from-[#df2531]/20 to-transparent rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Cargar Resultado</h1>
          <p className="text-gray-400">{match.ronda.replace('_', ' ')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#151921] border border-[#232838] rounded-xl p-6 space-y-6">
          {/* Pareja 1 */}
          <div>
            <label className="block text-sm font-medium text-[#df2531] mb-3">
              {match.pareja1Nombre || 'Pareja 1'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Set 1</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set1Pareja1}
                  onChange={(e) => setSets({ ...sets, set1Pareja1: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Set 2</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set2Pareja1}
                  onChange={(e) => setSets({ ...sets, set2Pareja1: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Set 3</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set3Pareja1}
                  onChange={(e) => setSets({ ...sets, set3Pareja1: parseInt(e.target.value) || 0 })}
                  disabled={!tieneSet3}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-[#df2531]">VS</span>
          </div>

          {/* Pareja 2 */}
          <div>
            <label className="block text-sm font-medium text-[#df2531] mb-3">
              {match.pareja2Nombre || 'Pareja 2'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set1Pareja2}
                  onChange={(e) => setSets({ ...sets, set1Pareja2: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set2Pareja2}
                  onChange={(e) => setSets({ ...sets, set2Pareja2: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={sets.set3Pareja2}
                  onChange={(e) => setSets({ ...sets, set3Pareja2: parseInt(e.target.value) || 0 })}
                  disabled={!tieneSet3}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:border-[#df2531] focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Checkbox set 3 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tieneSet3}
              onChange={(e) => setTieneSet3(e.target.checked)}
              className="w-4 h-4 rounded border-[#232838] bg-[#0B0E14] text-[#df2531] focus:ring-[#df2531]"
            />
            <span className="text-sm text-gray-300">Hubo set de desempate (3er set)</span>
          </label>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones del partido..."
              rows={3}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#df2531] focus:outline-none resize-none"
            />
          </div>

          {/* Botones */}
          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Resultado'
              )}
            </Button>

            {/* Opciones WO */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#232838]">
              <Button
                type="button"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleWO(match.pareja1Id!)}
                disabled={isSubmitting || !match.pareja1Id}
              >
                WO - {match.pareja1Nombre || 'Pareja 1'} gana
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleWO(match.pareja2Id!)}
                disabled={isSubmitting || !match.pareja2Id}
              >
                WO - {match.pareja2Nombre || 'Pareja 2'} gana
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
