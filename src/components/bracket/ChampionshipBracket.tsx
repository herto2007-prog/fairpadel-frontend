import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDatePY } from '../../utils/date';
import { ParejaAvatar } from '../ui/ParejaAvatar';

interface Partido {
  id: string;
  fase: string;
  orden: number;
  esBye: boolean;
  inscripcion1?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2: { nombre: string; apellido: string; fotoUrl?: string | null };
  };
  inscripcion2?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2: { nombre: string; apellido: string; fotoUrl?: string | null };
  };
  ganador?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2: { nombre: string; apellido: string; fotoUrl?: string | null };
  };
  resultado?: {
    set1: [number, number];
    set2: [number, number];
    set3?: [number, number];
  };
  fecha?: string;
  hora?: string;
  cancha?: string;
}

interface ChampionshipBracketProps {
  tournamentId: string;
  categoriaId?: string;
  isPublic?: boolean;
  onFullscreen?: (isFullscreen: boolean) => void;
}

const FASES_ORDEN = ['ZONA', 'REPECHAJE', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'] as const;

export function ChampionshipBracket({ 
  tournamentId, 
  categoriaId,
  isPublic = false,
  onFullscreen 
}: ChampionshipBracketProps) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [torneoInfo, setTorneoInfo] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasNewChanges, setHasNewChanges] = useState(false);
  const [categoriasNombres, setCategoriasNombres] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [tournamentId, categoriaId]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const endpoint = isPublic 
        ? `/public/torneos/${tournamentId}/bracket${categoriaId ? `?categoriaId=${categoriaId}` : ''}`
        : `/admin/torneos/${tournamentId}/bracket${categoriaId ? `?categoriaId=${categoriaId}` : ''}`;
      
      const { data } = await api.get(endpoint);
      if (data.success) {
        // Detectar si hay cambios comparando resultados
        const newPartidos = data.partidos;
        const hasChanges = partidos.length !== newPartidos.length || 
          partidos.some((p, i) => {
            const np = newPartidos[i];
            return p.ganador?.id !== np.ganador?.id ||
                   p.resultado?.set1?.[0] !== np.resultado?.set1?.[0] ||
                   p.fecha !== np.fecha ||
                   p.hora !== np.hora ||
                   p.cancha !== np.cancha;
          });
        
        if (hasChanges && partidos.length > 0) {
          setHasNewChanges(true);
          setTimeout(() => setHasNewChanges(false), 3000);
        }
        
        setPartidos(newPartidos);
        setTorneoInfo(data.torneo);
        setLastUpdated(new Date());
        
        // Extraer categorías únicas
        const categoriasUnicas = [...new Set(newPartidos.map((p: any) => p.categoriaNombre).filter(Boolean))] as string[];
        setCategoriasNombres(categoriasUnicas);
      }
    } catch (error) {
      console.error('Error cargando bracket:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Polling inteligente: solo cuando la pestaña está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tournamentId, categoriaId]);

  const partidosPorFase = useMemo(() => {
    const grupos: Record<string, Partido[]> = {};
    FASES_ORDEN.forEach(fase => grupos[fase] = []);
    
    partidos.forEach(p => {
      const faseNormalizada = p.fase.toUpperCase();
      if (grupos[faseNormalizada]) {
        grupos[faseNormalizada].push(p);
      }
    });
    
    // Ordenar por orden dentro de cada fase
    Object.keys(grupos).forEach(fase => {
      grupos[fase].sort((a, b) => a.orden - b.orden);
    });
    
    return grupos;
  }, [partidos]);

  const fasesActivas = FASES_ORDEN.filter(f => partidosPorFase[f]?.length > 0);

  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    onFullscreen?.(newState);
    
    if (newState && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Trophy className="w-20 h-20 text-gray-600 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Bracket no disponible</h3>
        <p className="text-gray-400">El fixture aún no ha sido generado</p>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0b0f]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-[#df2531]" />
            <h2 className="text-3xl font-bold text-white tracking-wide">
              {torneoInfo?.nombre || 'TORNEO'}
            </h2>
            <Trophy className="w-8 h-8 text-[#df2531]" />
          </div>
          {torneoInfo && (
            <p className="text-gray-400">
              {torneoInfo.ciudad} • {formatDatePY(torneoInfo.fechaInicio)}
            </p>
          )}
          {/* Categoría */}
          {categoriasNombres.length > 0 && (
            <div className="mt-2">
              <span className="px-4 py-1 bg-[#df2531]/20 border border-[#df2531]/30 rounded-full text-[#df2531] text-sm font-medium">
                {categoriasNombres.length === 1 
                  ? categoriasNombres[0] 
                  : `${categoriasNombres.length} categorías`}
              </span>
            </div>
          )}
          {/* Indicador de actualización */}
          <div className="h-6 mt-2">
            {hasNewChanges && (
              <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs"
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Actualizado
              </motion.span>
            )}
            {lastUpdated && !hasNewChanges && (
              <span className="text-xs text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-6 h-6 text-white" />
          ) : (
            <Maximize2 className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Bracket Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px] p-8">
          <div className="flex items-center justify-center gap-4">
            {fasesActivas.map((fase, faseIndex) => (
              <FaseColumn
                key={fase}
                fase={fase}
                partidos={partidosPorFase[fase]}
                isFirst={faseIndex === 0}
                isLast={faseIndex === fasesActivas.length - 1}
                isFinal={fase === 'FINAL'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded" />
          <span>Ganador</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#df2531]/20 border border-[#df2531]/50 rounded" />
          <span>Por jugar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/5 border border-white/10 rounded" />
          <span>Por definir</span>
        </div>
      </div>
    </div>
  );
}

function FaseColumn({ 
  fase, 
  partidos, 
  isFirst, 
  isLast,
  isFinal 
}: { 
  fase: string; 
  partidos: Partido[];
  isFirst: boolean;
  isLast: boolean;
  isFinal: boolean;
}) {
  // Calcular espaciado basado en la fase
  const getSpacing = () => {
    switch (fase) {
      case 'ZONA': return 'gap-4';
      case 'REPECHAJE': return 'gap-6';
      case 'OCTAVOS': return 'gap-8';
      case 'CUARTOS': return 'gap-12';
      case 'SEMIFINAL': return 'gap-20';
      case 'FINAL': return 'gap-32';
      default: return 'gap-4';
    }
  };

  return (
    <div className="flex flex-col items-center min-w-[280px]">
      {/* Título de fase */}
      <div className="mb-8">
        <span className="px-6 py-2 bg-gradient-to-r from-[#df2531] to-[#b91c22] text-white font-bold rounded-full text-sm uppercase tracking-wider shadow-lg shadow-[#df2531]/20">
          {fase === 'SEMIFINAL' ? 'SEMIS' : fase}
        </span>
      </div>

      {/* Partidos con espaciado dinámico */}
      <div className={`flex flex-col ${getSpacing()} ${isFinal ? 'justify-center' : ''}`}>
        {partidos.map((partido, index) => (
          <PartidoChampionship
            key={partido.id}
            partido={partido}
            index={index}
            isFirst={isFirst}
            isLast={isLast}
          />
        ))}
      </div>
    </div>
  );
}

function PartidoChampionship({ 
  partido, 
  index,
  isFirst,
  isLast
}: { 
  partido: Partido;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isFinalizado = !!partido.ganador;
  const tienePareja1 = !!partido.inscripcion1;
  const tienePareja2 = !!partido.inscripcion2;
  
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;

  return (
    <div className="relative flex items-center">
      {/* Línea de entrada (desde la izquierda) - simplificada */}
      {!isFirst && (
        <div className="absolute -left-4 top-1/2 w-4 h-px bg-gradient-to-l from-white/30 to-white/10" />
      )}
      
      {/* Card del partido - DISEÑO COMPACTO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className={`
          relative w-56 bg-gradient-to-b from-white/[0.08] to-white/[0.02] 
          border rounded-lg overflow-hidden
          ${isFinalizado ? 'border-green-500/30' : 'border-[#df2531]/30'}
          shadow-lg shadow-black/50
        `}
      >
        {/* Header con número de partido y cancha */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 border-b border-white/5">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            Partido {index + 1}
          </span>
          {partido.cancha ? (
            <span className="text-[10px] text-[#df2531] font-medium truncate max-w-[100px]">
              {partido.cancha.toUpperCase()}
            </span>
          ) : partido.esBye ? (
            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded">
              BYE
            </span>
          ) : null}
        </div>

        {/* Pareja 1 */}
        <div className={`
          flex items-center gap-2 px-2 py-1.5 border-b border-white/5
          ${pareja1Gano ? 'bg-green-500/10' : ''}
        `}>
          {tienePareja1 ? (
            <>
              <ParejaAvatar 
                jugador1={partido.inscripcion1!.jugador1}
                jugador2={partido.inscripcion1!.jugador2}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-[11px] truncate ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
                  {partido.inscripcion1!.jugador1.apellido}
                </div>
                <div className={`text-[11px] truncate ${pareja1Gano ? 'text-green-400/70' : 'text-gray-400'}`}>
                  {partido.inscripcion1!.jugador2.apellido}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-gray-500 text-[10px]">?</span>
              </div>
              <span className="text-gray-500 text-xs italic">Por definir</span>
            </div>
          )}
        </div>

        {/* VS / Resultado - Más compacto */}
        <div className="flex items-center justify-center py-1 bg-black/20">
          {isFinalizado && partido.resultado ? (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-green-400">
                {partido.resultado.set1[0]}-{partido.resultado.set1[1]}
              </span>
              {partido.resultado.set2 && (
                <span className="text-gray-400">
                  | {partido.resultado.set2[0]}-{partido.resultado.set2[1]}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#df2531] font-bold text-[10px]">VS</span>
          )}
        </div>

        {/* Pareja 2 */}
        <div className={`
          flex items-center gap-2 px-2 py-1.5
          ${pareja2Gano ? 'bg-green-500/10' : ''}
        `}>
          {tienePareja2 ? (
            <>
              <ParejaAvatar 
                jugador1={partido.inscripcion2!.jugador1}
                jugador2={partido.inscripcion2!.jugador2}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-[11px] truncate ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
                  {partido.inscripcion2!.jugador1.apellido}
                </div>
                <div className={`text-[11px] truncate ${pareja2Gano ? 'text-green-400/70' : 'text-gray-400'}`}>
                  {partido.inscripcion2!.jugador2.apellido}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-gray-500 text-[10px]">?</span>
              </div>
              <span className="text-gray-500 text-xs italic">Por definir</span>
            </div>
          )}
        </div>

        {/* Fecha/hora abajo - solo si existe */}
        {partido.fecha && (
          <div className="flex items-center justify-center gap-2 px-2 py-1 bg-white/[0.02] text-[10px] text-gray-500 border-t border-white/5">
            <Calendar className="w-3 h-3" />
            {formatDatePY(partido.fecha)} {partido.hora}
          </div>
        )}
      </motion.div>

      {/* Línea de salida (hacia la derecha) - simplificada */}
      {!isLast && (
        <div className="absolute -right-4 top-1/2 w-4 h-px bg-gradient-to-r from-white/30 to-white/10" />
      )}
    </div>
  );
}
