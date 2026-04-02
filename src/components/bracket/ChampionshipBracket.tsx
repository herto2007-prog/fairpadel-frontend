import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Maximize2, Minimize2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0b0f]' : ''} flex flex-col h-screen`}>
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0b0f]/80 backdrop-blur">
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

      {/* Bracket Container - Responsive con scroll horizontal */}
      <div 
        className="flex-1 overflow-x-auto overflow-y-hidden relative snap-x snap-mandatory" 
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#df2531 #1a1d26' }}
      >
        {/* Indicador de scroll en móvil */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-xs text-gray-400 pointer-events-none">
          <ChevronLeft className="w-3 h-3" />
          <span>Desliza</span>
          <ChevronRight className="w-3 h-3" />
        </div>

        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="min-w-max h-full flex items-center p-4 md:p-8">
            <div className="flex items-stretch gap-2 sm:gap-3 md:gap-6">
              {fasesActivas.map((fase, faseIndex) => (
                <FaseColumn
                  key={fase}
                  fase={fase}
                  partidos={partidosPorFase[fase]}
                  isFirst={faseIndex === 0}
                  isLast={faseIndex === fasesActivas.length - 1}
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
  isFirst, 
  isLast
}: { 
  fase: string; 
  partidos: Partido[];
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[160px] md:min-w-[200px] snap-center">
      {/* Título de fase - Compacto */}
      <div className="mb-2 md:mb-3">
        <span className="px-3 py-1 bg-[#df2531] text-white font-bold rounded-full text-[10px] md:text-xs uppercase">
          {fase === 'SEMIFINAL' ? 'SEMIS' : fase}
        </span>
      </div>

      {/* Partidos - Espaciado adaptativo */}
      <div className="flex flex-col gap-2 md:gap-3">
        {partidos.map((partido, index) => (
          <PartidoCard
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

function PartidoCard({ 
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
      {/* Línea entrada */}
      {!isFirst && (
        <div className="absolute -left-3 top-1/2 w-3 h-px bg-white/20" />
      )}
      
      {/* Card según diseño de referencia - Responsive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          relative w-40 md:w-48 bg-[#1a1d26] border rounded-lg overflow-hidden
          ${isFinalizado ? 'border-green-500/30' : 'border-[#df2531]/30'}
        `}
      >
        {/* Header: Partido X */}
        <div className="px-2.5 md:px-3 py-1.5 border-b border-white/5">
          <span className="text-xs md:text-sm font-medium text-gray-300">
            Partido {index + 1}
          </span>
          {partido.cancha && (
            <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-0.5 truncate">
              {partido.cancha}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-2.5 md:p-3 space-y-2 md:space-y-3">
          {/* Pareja 1 */}
          <div className={`flex items-center gap-3 ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
            {tienePareja1 ? (
              <>
                {/* Avatar doble */}
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#df2531] flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-[#1a1d26]">
                    {partido.inscripcion1!.jugador1.nombre[0]}
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#df2531] flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-[#1a1d26]">
                    {partido.inscripcion1!.jugador2.nombre[0]}
                  </div>
                </div>
                {/* Nombres - ambos mismo tamaño y peso */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm font-semibold leading-tight truncate">
                    {partido.inscripcion1!.jugador1.apellido}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-tight truncate">
                    {partido.inscripcion1!.jugador2.apellido}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Por definir</span>
            )}
          </div>

          {/* VS / Resultado */}
          <div className="flex items-center justify-center py-0.5">
            {isFinalizado && partido.resultado ? (
              <span className="text-base md:text-lg font-mono text-green-400 font-bold">
                {partido.resultado.set1[0]} - {partido.resultado.set1[1]}
              </span>
            ) : (
              <span className="text-[#df2531] text-xs md:text-sm font-bold">VS</span>
            )}
          </div>

          {/* Pareja 2 */}
          <div className={`flex items-center gap-3 ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
            {tienePareja2 ? (
              <>
                {/* Avatar doble */}
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#df2531] flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-[#1a1d26]">
                    {partido.inscripcion2!.jugador1.nombre[0]}
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#df2531] flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-[#1a1d26]">
                    {partido.inscripcion2!.jugador2.nombre[0]}
                  </div>
                </div>
                {/* Nombres - ambos mismo tamaño y peso */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm font-semibold leading-tight truncate">
                    {partido.inscripcion2!.jugador1.apellido}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-tight truncate">
                    {partido.inscripcion2!.jugador2.apellido}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Por definir</span>
            )}
          </div>
        </div>

        {/* Fecha/hora */}
        {partido.fecha && (
          <div className="px-2.5 md:px-3 py-1.5 md:py-2 bg-black/20 text-[10px] md:text-xs text-gray-500 flex items-center gap-1.5 md:gap-2">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formatDatePY(partido.fecha)} {partido.hora}</span>
          </div>
        )}
      </motion.div>

      {/* Línea salida */}
      {!isLast && (
        <div className="absolute -right-3 top-1/2 w-3 h-px bg-white/20" />
      )}
    </div>
  );
}
