import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Trophy, Loader2, Calendar, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { fixtureService, FixtureVersion } from '../../../services/fixtureService';
import { Match } from '../../../services/matchService';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';

const RONDA_LABELS: Record<string, string> = {
  ACOMODACION_1: 'Acomodación 1',
  ACOMODACION_2: 'Acomodación 2',
  OCTAVOS: 'Octavos de Final',
  CUARTOS: 'Cuartos de Final',
  SEMIS: 'Semifinales',
  FINAL: 'Final',
  TERCER_PUESTO: '3er Puesto',
};

const RONDA_ORDEN = [
  'ACOMODACION_1',
  'ACOMODACION_2',
  'OCTAVOS',
  'CUARTOS',
  'SEMIS',
  'FINAL',
];

export function BracketPage() {
  const { tournamentId, categoryId } = useParams<{ tournamentId: string; categoryId: string }>();
  const [fixture, setFixture] = useState<FixtureVersion | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const isOrganizador = !!(user?.roles?.includes(UserRole.ORGANIZADOR) || user?.roles?.includes(UserRole.ADMIN));

  useEffect(() => {
    if (tournamentId && categoryId) {
      loadFixture();
    }
  }, [tournamentId, categoryId]);

  const loadFixture = async () => {
    try {
      setIsLoading(true);
      const data = await fixtureService.getActivo(tournamentId!, categoryId!);
      if (data) {
        setFixture(data);
        setMatches(data.matches || []);
      }
    } catch (error) {
      toast.error('Error al cargar fixture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerarFixture = async () => {
    try {
      setIsLoading(true);
      const data = await fixtureService.generar({
        tournamentId: tournamentId!,
        categoryId: categoryId!,
      });
      toast.success('Fixture generado correctamente');
      setFixture(data);
      setMatches(data.matches || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al generar fixture');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublicar = async () => {
    if (!fixture) return;
    try {
      await fixtureService.publicar(fixture.id);
      toast.success('Fixture publicado');
      loadFixture();
    } catch (error) {
      toast.error('Error al publicar fixture');
    }
  };

  const getMatchesByRonda = (ronda: string) => {
    return matches.filter(m => m.ronda === ronda).sort((a, b) => a.ordenEnRonda - b.ordenEnRonda);
  };

  const getRondasVisibles = () => {
    const rondasConPartidos = new Set(matches.map(m => m.ronda));
    return RONDA_ORDEN.filter(r => rondasConPartidos.has(r));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-[#0B0E14] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver al torneo
          </Link>
          
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No hay fixture generado</h2>
            <p className="text-gray-400 mb-6">
              {isOrganizador 
                ? 'Genera el fixture para comenzar el torneo' 
                : 'El organizador aún no ha generado el fixture'}
            </p>
            {isOrganizador && (
              <Button onClick={handleGenerarFixture} size="lg">
                <Trophy className="w-5 h-5 mr-2" />
                Generar Fixture
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <Link to={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al torneo
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Bracket {fixture.category?.nombre}
            </h1>
            <p className="text-gray-400">
              Versión {fixture.version} • {fixture.totalPartidos} partidos
            </p>
          </div>

          {isOrganizador && fixture.estado === 'BORRADOR' && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadFixture}>
                Regenerar
              </Button>
              <Button onClick={handlePublicar}>
                Publicar Fixture
              </Button>
            </div>
          )}
        </div>

        {/* Estado del fixture */}
        <div className="mb-6">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            fixture.estado === 'PUBLICADO' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {fixture.estado === 'PUBLICADO' ? 'Fixture Publicado' : 'Borrador'}
          </span>
        </div>

        {/* Bracket Visual */}
        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max pb-4">
            {getRondasVisibles().map((ronda) => (
              <div key={ronda} className="flex flex-col gap-4 w-72">
                <h3 className="text-lg font-bold text-white text-center py-3 bg-[#151921] border border-[#232838] rounded-lg">
                  {RONDA_LABELS[ronda]}
                </h3>
                
                <div className="flex flex-col gap-6">
                  {getMatchesByRonda(ronda).map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      isOrganizador={isOrganizador}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-8 p-4 bg-[#151921] border border-[#232838] rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-3">Leyenda</h4>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500"></span>
              Finalizado
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500"></span>
              En juego
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500"></span>
              Programado
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#df2531]/20 border border-[#df2531]"></span>
              Por jugar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  isOrganizador: boolean;
}

function MatchCard({ match, isOrganizador }: MatchCardProps) {
  const getEstadoColor = () => {
    switch (match.estado) {
      case 'FINALIZADO':
      case 'WO':
        return 'border-green-500/30 bg-green-500/5';
      case 'EN_JUEGO':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'PROGRAMADO':
        return match.pareja1Id && match.pareja2Id 
          ? 'border-gray-500/30 bg-gray-500/5'
          : 'border-[#df2531]/30 bg-[#df2531]/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const esGanador = (parejaId?: string) => {
    return match.parejaGanadoraId === parejaId;
  };

  return (
    <div className={`border rounded-lg p-3 ${getEstadoColor()}`}>
      {/* Pareja 1 */}
      <div className={`flex items-center justify-between p-2 rounded ${
        esGanador(match.pareja1Id) ? 'bg-green-500/10' : 'bg-[#0B0E14]'
      }`}>
        <span className={`text-sm truncate ${
          esGanador(match.pareja1Id) ? 'text-green-400 font-medium' : 'text-white'
        }`}>
          {match.pareja1Nombre || (match.pareja1Id ? 'Por definir' : 'BYE')}
        </span>
        {match.estado === 'FINALIZADO' && (
          <span className="text-sm font-bold text-white">
            {match.set1Pareja1}-{match.set2Pareja1}
            {match.set3Pareja1 !== undefined && `-${match.set3Pareja1}`}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#232838] my-2"></div>

      {/* Pareja 2 */}
      <div className={`flex items-center justify-between p-2 rounded ${
        esGanador(match.pareja2Id) ? 'bg-green-500/10' : 'bg-[#0B0E14]'
      }`}>
        <span className={`text-sm truncate ${
          esGanador(match.pareja2Id) ? 'text-green-400 font-medium' : 'text-white'
        }`}>
          {match.pareja2Nombre || (match.pareja2Id ? 'Por definir' : 'BYE')}
        </span>
        {match.estado === 'FINALIZADO' && (
          <span className="text-sm font-bold text-white">
            {match.set1Pareja2}-{match.set2Pareja2}
            {match.set3Pareja2 !== undefined && `-${match.set3Pareja2}`}
          </span>
        )}
      </div>

      {/* Info adicional */}
      {(match.canchaNombre || match.horaProgramada) && (
        <div className="mt-2 pt-2 border-t border-[#232838] text-xs text-gray-400 space-y-1">
          {match.canchaNombre && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.canchaNombre}
            </span>
          )}
          {match.fechaProgramada && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(match.fechaProgramada).toLocaleDateString('es-PY')}
              {match.horaProgramada && ` ${match.horaProgramada}`}
            </span>
          )}
        </div>
      )}

      {/* Acciones organizador */}
      {isOrganizador && match.estado === 'PROGRAMADO' && match.pareja1Id && match.pareja2Id && (
        <div className="mt-2 pt-2 border-t border-[#232838]">
          <Link to={`/matches/${match.id}/resultado`}>
            <Button size="sm" className="w-full text-xs">
              Cargar Resultado
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
