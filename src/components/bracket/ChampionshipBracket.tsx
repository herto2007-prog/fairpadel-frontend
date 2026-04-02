import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Maximize2, Minimize2, ChevronDown, Users } from 'lucide-react';
import { api } from '../../services/api';
import { formatDatePY } from '../../utils/date';


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
  categoriaNombre?: string;
  categoriaTipo?: string;
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'DAMAS' | 'CABALLEROS' | 'MIXTO';
}

interface ChampionshipBracketProps {
  tournamentId: string;
  isPublic?: boolean;
  onFullscreen?: (isFullscreen: boolean) => void;
}

const FASES_ORDEN = ['ZONA', 'REPECHAJE', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'] as const;

// Altura de cada card de partido
const CARD_HEIGHT = 112; // px
const CARD_GAP = 48; // espacio entre cards

export function ChampionshipBracket({ 
  tournamentId, 
  isPublic = false,
  onFullscreen 
}: ChampionshipBracketProps) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [torneoInfo, setTorneoInfo] = useState<any>(null);

  const [hasNewChanges, setHasNewChanges] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, [tournamentId]);

  useEffect(() => {
    if (categoriaSeleccionada) {
      loadData();
    }
  }, [tournamentId, categoriaSeleccionada]);

  const loadCategorias = async () => {
    try {
      const endpoint = isPublic 
        ? `/public/torneos/${tournamentId}/categorias`
        : `/admin/torneos/${tournamentId}/categorias`;
      
      const { data } = await api.get(endpoint);
      if (data.success && data.categorias?.length > 0) {
        const cats = data.categorias.map((c: any) => ({
          id: c.categoryId || c.id,
          nombre: c.category?.nombre || c.nombre,
          tipo: inferirTipo(c.category?.tipo || c.tipo, c.category?.nombre || c.nombre),
        }));
        setCategorias(cats);
        setCategoriaSeleccionada(cats[0].id);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const inferirTipo = (tipo: string, nombre: string): 'DAMAS' | 'CABALLEROS' | 'MIXTO' => {
    const tipoUpper = tipo?.toUpperCase() || '';
    const nombreUpper = nombre?.toUpperCase() || '';
    
    if (tipoUpper === 'FEMENINO' || nombreUpper.includes('FEMENIN') || nombreUpper.includes('DAMA')) {
      return 'DAMAS';
    } else if (tipoUpper === 'MASCULINO' || nombreUpper.includes('MASCULIN') || nombreUpper.includes('CABALLERO')) {
      return 'CABALLEROS';
    }
    return 'MIXTO';
  };

  const loadData = async (silent = false) => {
    if (!categoriaSeleccionada) return;
    
    try {
      if (!silent) setLoading(true);
      
      const endpoint = isPublic 
        ? `/public/torneos/${tournamentId}/bracket?categoriaId=${categoriaSeleccionada}`
        : `/admin/torneos/${tournamentId}/bracket?categoriaId=${categoriaSeleccionada}`;
      
      const { data } = await api.get(endpoint);
      if (data.success) {
        const newPartidos = data.partidos || [];
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
      if (document.visibilityState === 'visible' && categoriaSeleccionada) {
        loadData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tournamentId, categoriaSeleccionada]);

  const partidosPorFase = useMemo(() => {
    const grupos: Record<string, Partido[]> = {};
    FASES_ORDEN.forEach(fase => grupos[fase] = []);
    
    partidos.forEach(p => {
      const faseNormalizada = p.fase?.toUpperCase() || '';
      if (grupos[faseNormalizada]) {
        grupos[faseNormalizada].push(p);
      }
    });
    
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

  const categoriasPorTipo = useMemo(() => {
    return {
      DAMAS: categorias.filter(c => c.tipo === 'DAMAS'),
      CABALLEROS: categorias.filter(c => c.tipo === 'CABALLEROS'),
      MIXTO: categorias.filter(c => c.tipo === 'MIXTO'),
    };
  }, [categorias]);

  const categoriaActual = categorias.find(c => c.id === categoriaSeleccionada);

  if (loading && partidos.length === 0) {
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

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0b0f]' : ''} flex flex-col min-h-screen`}>
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0b0f]/95 backdrop-blur shrink-0">
        {/* Espaciador izquierdo */}
        <div className="w-8" />

        {/* Info Torneo + Selector Categoría */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">
              {torneoInfo?.nombre || 'Torneo'}
            </h2>
            {torneoInfo && (
              <p className="text-xs text-gray-400">
                {torneoInfo.ciudad}
              </p>
            )}
          </div>

          {/* Selector de Categoría */}
          <div className="relative">
            <button
              onClick={() => setMostrarSelector(!mostrarSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#b91c22] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {categoriaActual?.nombre || 'Seleccionar'}
              <ChevronDown className="w-4 h-4" />
            </button>

            {mostrarSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-56 bg-[#151921] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Damas */}
                {categoriasPorTipo.DAMAS.length > 0 && (
                  <div className="border-b border-white/5">
                    <div className="px-3 py-2 text-xs font-medium text-pink-400 uppercase tracking-wider bg-pink-500/10">
                      Damas
                    </div>
                    {categoriasPorTipo.DAMAS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoriaSeleccionada(cat.id);
                          setMostrarSelector(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                          categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {/* Caballeros */}
                {categoriasPorTipo.CABALLEROS.length > 0 && (
                  <div className="border-b border-white/5">
                    <div className="px-3 py-2 text-xs font-medium text-blue-400 uppercase tracking-wider bg-blue-500/10">
                      Caballeros
                    </div>
                    {categoriasPorTipo.CABALLEROS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoriaSeleccionada(cat.id);
                          setMostrarSelector(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                          categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mixto */}
                {categoriasPorTipo.MIXTO.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-purple-400 uppercase tracking-wider bg-purple-500/10">
                      Mixto
                    </div>
                    {categoriasPorTipo.MIXTO.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoriaSeleccionada(cat.id);
                          setMostrarSelector(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                          categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Indicador actualización */}
          {hasNewChanges && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Actualizado
            </motion.span>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-white" />
          ) : (
            <Maximize2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Bracket Container - Tree Layout (scroll natural del navegador) */}
      <div className="flex-1 relative bg-[#0a0b0f]">
        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="min-w-max p-8 md:p-12">
            <div className="flex items-center gap-16 md:gap-24">
              {fasesActivas.map((fase, faseIndex) => (
                <FaseColumn
                  key={fase}
                  fase={fase}
                  partidos={partidosPorFase[fase]}
                  faseIndex={faseIndex}
                  totalFases={fasesActivas.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FaseColumn({ 
  fase, 
  partidos, 
  faseIndex,
  totalFases
}: { 
  fase: string; 
  partidos: Partido[];
  faseIndex: number;
  totalFases: number;
}) {
  // Calcular el espaciado basado en la posición en el árbol
  // Cuanto más avanzada la fase, más espacio entre partidos
  const multiplicadorEspaciado = Math.pow(2, faseIndex);
  const gapEntrePartidos = CARD_GAP * multiplicadorEspaciado;

  const getFaseLabel = (f: string) => {
    switch(f) {
      case 'OCTAVOS': return 'OCTAVOS DE FINAL';
      case 'CUARTOS': return 'CUARTOS DE FINAL';
      case 'SEMIFINAL': return 'SEMIFINALES';
      case 'FINAL': return '🏆 FINAL';
      case 'ZONA': return 'FASE DE GRUPOS';
      case 'REPECHAJE': return 'REPECHAJE';
      default: return f;
    }
  };

  const getFaseColor = (f: string) => {
    switch(f) {
      case 'FINAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'SEMIFINAL': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-[#df2531]/20 text-[#df2531] border-[#df2531]/30';
    }
  };

  const isUltimaFase = faseIndex === totalFases - 1;
  const isPrimeraFase = faseIndex === 0;

  return (
    <div className="flex flex-col items-center">
      {/* Etiqueta de Fase */}
      <div className={`mb-6 px-4 py-2 rounded-lg border ${getFaseColor(fase)}`}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
          {getFaseLabel(fase)}
        </span>
      </div>

      {/* Contenedor de partidos con espaciado dinámico */}
      <div 
        className="flex flex-col"
        style={{ gap: `${gapEntrePartidos}px` }}
      >
        {partidos.map((partido, index) => (
          <PartidoNode
            key={partido.id}
            partido={partido}
            index={index}
            showLineLeft={!isPrimeraFase}
            showLineRight={!isUltimaFase}
            gapEntrePartidos={gapEntrePartidos}
          />
        ))}
      </div>
    </div>
  );
}

function PartidoNode({
  partido,
  index,
  showLineLeft,
  showLineRight,
  gapEntrePartidos
}: {
  partido: Partido;
  index: number;
  showLineLeft: boolean;
  showLineRight: boolean;
  gapEntrePartidos: number;
}) {
  const isFinalizado = !!partido.ganador;
  const tienePareja1 = !!partido.inscripcion1;
  const tienePareja2 = !!partido.inscripcion2;
  
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;

  // Altura de la línea de conexión vertical
  const lineHeight = gapEntrePartidos / 2 + CARD_HEIGHT / 2;

  return (
    <div className="relative flex items-center">
      {/* Línea de entrada izquierda */}
      {showLineLeft && (
        <>
          {/* Horizontal */}
          <div className="absolute -left-8 top-1/2 w-8 h-px bg-white/20" />
          {/* Vertical superior */}
          <div 
            className="absolute -left-8 bg-white/20"
            style={{ 
              width: '1px', 
              height: `${lineHeight}px`,
              top: '50%',
              transform: 'translateY(-100%)'
            }}
          />
          {/* Vertical inferior */}
          <div 
            className="absolute -left-8 bg-white/20"
            style={{ 
              width: '1px', 
              height: `${lineHeight}px`,
              top: '50%'
            }}
          />
        </>
      )}

      {/* Card del partido */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`
          relative w-44 md:w-52 bg-[#1a1d26] border rounded-xl overflow-hidden shrink-0
          ${isFinalizado ? 'border-green-500/30 shadow-lg shadow-green-500/5' : 'border-white/10'}
          hover:border-white/20 transition-colors
        `}
        style={{ height: `${CARD_HEIGHT}px` }}
      >
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] md:text-xs font-medium text-gray-400">
            #{partido.orden}
          </span>
          {partido.cancha && (
            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
              {partido.cancha}
            </span>
          )}
        </div>

        {/* Contenido - Layout horizontal */}
        <div className="p-2.5 flex items-center justify-between h-[calc(100%-28px)]">
          {/* Pareja 1 */}
          <div className={`flex-1 flex flex-col items-center gap-1 ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
            {tienePareja1 ? (
              <>
                <div className="flex -space-x-1.5">
                  <Avatar jugador={partido.inscripcion1!.jugador1} />
                  <Avatar jugador={partido.inscripcion1!.jugador2} />
                </div>
                <div className="text-center">
                  <div className="text-[10px] md:text-xs font-semibold leading-tight truncate max-w-[70px]">
                    {partido.inscripcion1!.jugador1.apellido}
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold leading-tight truncate max-w-[70px]">
                    {partido.inscripcion1!.jugador2.apellido}
                  </div>
                </div>
              </>
            ) : (
              <PorDefinir />
            )}
          </div>

          {/* VS / Resultado */}
          <div className="px-2 flex flex-col items-center">
            {isFinalizado && partido.resultado ? (
              <>
                <span className="text-sm md:text-base font-mono text-green-400 font-bold">
                  {partido.resultado.set1[0]}:{partido.resultado.set1[1]}
                </span>
                {partido.resultado.set2 && (
                  <span className="text-[10px] text-gray-500">
                    {partido.resultado.set2[0]}:{partido.resultado.set2[1]}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#df2531] text-xs font-bold">VS</span>
            )}
            {partido.fecha && (
              <span className="text-[9px] text-gray-500 mt-1">
                {formatDatePY(partido.fecha).split('/').slice(0,2).join('/')}
              </span>
            )}
          </div>

          {/* Pareja 2 */}
          <div className={`flex-1 flex flex-col items-center gap-1 ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
            {tienePareja2 ? (
              <>
                <div className="flex -space-x-1.5">
                  <Avatar jugador={partido.inscripcion2!.jugador1} />
                  <Avatar jugador={partido.inscripcion2!.jugador2} />
                </div>
                <div className="text-center">
                  <div className="text-[10px] md:text-xs font-semibold leading-tight truncate max-w-[70px]">
                    {partido.inscripcion2!.jugador1.apellido}
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold leading-tight truncate max-w-[70px]">
                    {partido.inscripcion2!.jugador2.apellido}
                  </div>
                </div>
              </>
            ) : (
              <PorDefinir />
            )}
          </div>
        </div>

        {/* Indicador de ganador */}
        {isFinalizado && (
          <div className="absolute top-1 right-1">
            <Trophy className="w-3 h-3 text-yellow-500" />
          </div>
        )}
      </motion.div>

      {/* Línea de salida derecha */}
      {showLineRight && (
        <div className="absolute -right-8 top-1/2 w-8 h-px bg-white/20" />
      )}
    </div>
  );
}

function Avatar({ jugador }: { jugador: { nombre: string; fotoUrl?: string | null } }) {
  if (jugador.fotoUrl) {
    return (
      <img 
        src={jugador.fotoUrl} 
        alt={jugador.nombre}
        className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-[#1a1d26]"
      />
    );
  }
  
  return (
    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#df2531] to-[#b91c22] flex items-center justify-center text-[10px] font-bold border-2 border-[#1a1d26]">
      {jugador.nombre[0]}
    </div>
  );
}

function PorDefinir() {
  return (
    <>
      <div className="flex -space-x-1.5">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#1a1d26]">
          <Users className="w-3 h-3 text-gray-500" />
        </div>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#1a1d26]">
          <Users className="w-3 h-3 text-gray-500" />
        </div>
      </div>
      <div className="text-[10px] text-gray-500 italic">Por definir</div>
    </>
  );
}
