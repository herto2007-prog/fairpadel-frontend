import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';


interface Jugador {
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

interface Partido {
  id: string;
  fase: string;
  orden: number;
  esBye: boolean;
  inscripcion1?: {
    id: string;
    jugador1: Jugador;
    jugador2: Jugador;
  };
  inscripcion2?: {
    id: string;
    jugador1: Jugador;
    jugador2: Jugador;
  };
  ganador?: {
    id: string;
    jugador1: Jugador;
    jugador2: Jugador;
  };
  resultado?: {
    set1: [number, number];
    set2?: [number, number];
    set3?: [number, number];
  };
  fecha?: string;
  hora?: string;
  cancha?: string;
  sede?: string;
  estado?: string;
  razonResultado?: string;
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

const FASES_ORDEN = ['ZONA', 'REPECHAJE', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];

export function ChampionshipBracket({ 
  tournamentId, 
  isPublic = false,
  onFullscreen 
}: ChampionshipBracketProps) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [torneoInfo, setTorneoInfo] = useState<any>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadCategorias(); }, [tournamentId]);
  useEffect(() => { if (categoriaSeleccionada) loadData(); }, [tournamentId, categoriaSeleccionada]);

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
    if (tipoUpper === 'FEMENINO' || nombreUpper.includes('FEMENIN') || nombreUpper.includes('DAMA')) return 'DAMAS';
    if (tipoUpper === 'MASCULINO' || nombreUpper.includes('MASCULIN') || nombreUpper.includes('CABALLERO')) return 'CABALLEROS';
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
        setPartidos(data.partidos || []);
        setTorneoInfo(data.torneo);
      }
    } catch (error) {
      console.error('Error cargando bracket:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const partidosPorFase = useMemo(() => {
    const grupos: Record<string, Partido[]> = {};
    FASES_ORDEN.forEach(fase => grupos[fase] = []);
    partidos.forEach(p => {
      const faseNormalizada = p.fase?.toUpperCase() || '';
      if (grupos[faseNormalizada]) grupos[faseNormalizada].push(p);
    });
    Object.keys(grupos).forEach(fase => grupos[fase].sort((a, b) => a.orden - b.orden));
    return grupos;
  }, [partidos]);

  const fasesActivas = FASES_ORDEN.filter(f => partidosPorFase[f]?.length > 0);
  const fasesBracket = fasesActivas.filter(f => f !== 'ZONA' && f !== 'REPECHAJE');

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

  const categoriasPorTipo = useMemo(() => ({
    DAMAS: categorias.filter(c => c.tipo === 'DAMAS'),
    CABALLEROS: categorias.filter(c => c.tipo === 'CABALLEROS'),
    MIXTO: categorias.filter(c => c.tipo === 'MIXTO'),
  }), [categorias]);

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
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0b0f]/95 backdrop-blur shrink-0">
        <div className="w-8" />
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{torneoInfo?.nombre || 'Torneo'}</h2>
            {torneoInfo && <p className="text-xs text-gray-400">{torneoInfo.ciudad}</p>}
          </div>
          <div className="relative">
            <button
              onClick={() => setMostrarSelector(!mostrarSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#b91c22] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {categoriaActual?.nombre || 'Seleccionar'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {mostrarSelector && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-56 bg-[#151921] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {categoriasPorTipo.DAMAS.length > 0 && (
                  <div className="border-b border-white/5">
                    <div className="px-3 py-2 text-xs font-medium text-pink-400 uppercase tracking-wider bg-pink-500/10">Damas</div>
                    {categoriasPorTipo.DAMAS.map(cat => (
                      <button key={cat.id} onClick={() => { setCategoriaSeleccionada(cat.id); setMostrarSelector(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'}`}>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {categoriasPorTipo.CABALLEROS.length > 0 && (
                  <div className="border-b border-white/5">
                    <div className="px-3 py-2 text-xs font-medium text-blue-400 uppercase tracking-wider bg-blue-500/10">Caballeros</div>
                    {categoriasPorTipo.CABALLEROS.map(cat => (
                      <button key={cat.id} onClick={() => { setCategoriaSeleccionada(cat.id); setMostrarSelector(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'}`}>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {categoriasPorTipo.MIXTO.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-purple-400 uppercase tracking-wider bg-purple-500/10">Mixto</div>
                    {categoriasPorTipo.MIXTO.map(cat => (
                      <button key={cat.id} onClick={() => { setCategoriaSeleccionada(cat.id); setMostrarSelector(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${categoriaSeleccionada === cat.id ? 'text-[#df2531] bg-[#df2531]/10' : 'text-white'}`}>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
        <button onClick={toggleFullscreen} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Bracket con posiciones absolutas */}
      <div ref={containerRef} className="flex-1 bg-[#0a0b0f] p-4 md:p-6 overflow-x-auto overflow-y-auto">
        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="relative min-w-max min-h-max">
            <BracketTree 
              fases={fasesBracket}
              partidosPorFase={partidosPorFase}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal del árbol del bracket
function BracketTree({ 
  fases, 
  partidosPorFase 
}: { 
  fases: string[];
  partidosPorFase: Record<string, Partido[]>;
}) {
  if (fases.length === 0) return null;

  // Encontrar la fase inicial (la que tiene más partidos)
  const faseInicial = fases.reduce((prev, curr) => 
    partidosPorFase[curr].length > partidosPorFase[prev].length ? curr : prev
  );
  const maxPartidos = partidosPorFase[faseInicial].length;
  
  // Dimensiones
  const cardWidth = 200;
  const cardHeight = 140;
  const gapX = 48; // espacio horizontal entre fases (para líneas)
  const gapY = 20; // espacio vertical mínimo entre cards
  
  // Calcular la altura necesaria basada en la fase inicial
  // La fase inicial ocupa: maxPartidos * cardHeight + (maxPartidos - 1) * gapY
  const totalHeight = maxPartidos * cardHeight + (maxPartidos - 1) * gapY;
  
  // Ancho total
  const totalWidth = fases.length * cardWidth + (fases.length - 1) * gapX;

  // Función para calcular posición Y de una card
  const getCardY = (fase: string, index: number) => {
    const numPartidos = partidosPorFase[fase].length;
    const span = maxPartidos / numPartidos;
    
    // Centro del espacio que ocupa esta card
    // Ej: si maxPartidos=8 y numPartidos=4 (cuartos), span=2
    // C1 ocupa filas 0-1, centro en 1
    // C2 ocupa filas 2-3, centro en 3
    // C3 ocupa filas 4-5, centro en 5
    // C4 ocupa filas 6-7, centro en 7
    const filaCentro = index * span + (span - 1) / 2;
    const y = filaCentro * (cardHeight + gapY);
    return y;
  };

  // Función para calcular posición X de una fase
  const getCardX = (faseIndex: number) => {
    return faseIndex * (cardWidth + gapX);
  };

  return (
    <div style={{ width: totalWidth, height: totalHeight }} className="relative">
      {/* Renderizar conectores primero (detrás de las cards) */}
      {fases.map((fase, faseIndex) => {
        if (faseIndex === 0) return null; // Primera fase no tiene conectores de entrada
        
        const prevFase = fases[faseIndex - 1];
        const currPartidos = partidosPorFase[fase];
        const prevPartidos = partidosPorFase[prevFase];
        
        return currPartidos.map((partido, idx) => {
          // Cada partido actual recibe de 2 partidos de la fase anterior
          const prevIdx1 = idx * 2;
          const prevIdx2 = idx * 2 + 1;
          
          if (prevIdx1 >= prevPartidos.length) return null;
          
          const x1 = getCardX(faseIndex - 1) + cardWidth; // borde derecho fase anterior
          const x2 = getCardX(faseIndex); // borde izquierdo fase actual
          const yTarget = getCardY(fase, idx) + cardHeight / 2; // centro de card destino
          
          const ySource1 = getCardY(prevFase, prevIdx1) + cardHeight / 2;
          const ySource2 = prevIdx2 < prevPartidos.length 
            ? getCardY(prevFase, prevIdx2) + cardHeight / 2
            : ySource1;
          
          // Punto medio X donde se juntan las líneas
          const midX = x1 + (x2 - x1) / 2;
          
          return (
            <g key={`connector-${fase}-${partido.id}`}>
              {/* Línea desde origen 1 al punto medio */}
              <ConnectorLine 
                x1={x1} y1={ySource1}
                x2={midX} y2={ySource1}
              />
              {/* Línea desde origen 2 al punto medio (si existe) */}
              {prevIdx2 < prevPartidos.length && (
                <ConnectorLine 
                  x1={x1} y1={ySource2}
                  x2={midX} y2={ySource2}
                />
              )}
              {/* Línea vertical conectando ambas */}
              <ConnectorLine 
                x1={midX} y1={Math.min(ySource1, ySource2)}
                x2={midX} y2={Math.max(ySource1, ySource2)}
              />
              {/* Línea horizontal al destino */}
              <ConnectorLine 
                x1={midX} y1={yTarget}
                x2={x2} y2={yTarget}
              />
            </g>
          );
        });
      })}

      {/* Renderizar cards */}
      {fases.map((fase, faseIndex) => (
        partidosPorFase[fase].map((partido, idx) => {
          const x = getCardX(faseIndex);
          const y = getCardY(fase, idx);
          
          return (
            <div
              key={partido.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: cardWidth,
                height: cardHeight,
              }}
            >
              <MatchCard partido={partido} />
            </div>
          );
        })
      ))}
    </div>
  );
}

// Línea conectora simple
function ConnectorLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <svg 
      className="absolute pointer-events-none"
      style={{
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1) || 2,
        height: Math.abs(y2 - y1) || 2,
      }}
    >
      <line
        x1={x1 <= x2 ? 0 : Math.abs(x2 - x1)}
        y1={y1 <= y2 ? 0 : Math.abs(y2 - y1)}
        x2={x1 <= x2 ? Math.abs(x2 - x1) : 0}
        y2={y1 <= y2 ? Math.abs(y2 - y1) : 0}
        stroke="#6b7280"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Match Card component
function MatchCard({ partido }: { partido: Partido }) {
  const isFinalizado = !!partido.ganador;
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;
  
  const esDescalificacion = partido.razonResultado === 'descalificacion';
  const esAbandono = partido.razonResultado === 'abandono' || partido.razonResultado === 'lesion';
  const esWO = partido.razonResultado === 'wo';
  
  const codigoPartido = `${partido.fase?.[0] || 'P'}${partido.orden}`;
  const headerText = partido.sede && partido.cancha 
    ? `${partido.sede} - ${partido.cancha}`
    : partido.cancha || 'Cancha por definir';

  return (
    <div className="w-full h-full bg-white rounded overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200 shrink-0">
        <span className="text-[9px] font-bold text-gray-600">{codigoPartido}</span>
        <span className="text-[8px] text-gray-600 truncate max-w-[110px]">{headerText}</span>
      </div>

      {/* Equipo 1 */}
      <div className={`flex items-center px-2 py-1 border-b border-gray-100 flex-1 ${pareja1Gano ? 'bg-blue-50' : ''}`}>
        {partido.inscripcion1 ? (
          <>
            <div className="flex -space-x-1 mr-1.5 shrink-0">
              <FotoJugador jugador={partido.inscripcion1.jugador1} />
              <FotoJugador jugador={partido.inscripcion1.jugador2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja1Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                {partido.inscripcion1.jugador1.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja1Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                {partido.inscripcion1.jugador1.nombre}
              </div>
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja1Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                {partido.inscripcion1.jugador2.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja1Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                {partido.inscripcion1.jugador2.nombre}
              </div>
            </div>
            {isFinalizado && (
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {esDescalificacion && pareja1Gano ? (
                  <span className="text-[9px] font-bold text-red-600">DESC.</span>
                ) : esAbandono && !pareja1Gano ? (
                  <span className="text-[9px] font-bold text-orange-600">AB.</span>
                ) : esWO && pareja1Gano ? (
                  <span className="text-[9px] font-bold text-green-600">W.O.</span>
                ) : partido.resultado ? (
                  <div className="flex gap-1">
                    <span className={`text-xs font-bold ${pareja1Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                      {partido.resultado.set1[0]}
                    </span>
                    {partido.resultado.set2 && (
                      <span className={`text-xs font-bold ${pareja1Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                        {partido.resultado.set2[0]}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <span className="text-[9px] text-gray-400 italic">Por definir</span>
        )}
      </div>

      {/* Equipo 2 */}
      <div className={`flex items-center px-2 py-1 flex-1 ${pareja2Gano ? 'bg-blue-50' : ''}`}>
        {partido.inscripcion2 ? (
          <>
            <div className="flex -space-x-1 mr-1.5 shrink-0">
              <FotoJugador jugador={partido.inscripcion2.jugador1} />
              <FotoJugador jugador={partido.inscripcion2.jugador2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja2Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                {partido.inscripcion2.jugador1.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja2Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                {partido.inscripcion2.jugador1.nombre}
              </div>
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja2Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                {partido.inscripcion2.jugador2.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja2Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                {partido.inscripcion2.jugador2.nombre}
              </div>
            </div>
            {isFinalizado && (
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {esDescalificacion && pareja2Gano ? (
                  <span className="text-[9px] font-bold text-red-600">DESC.</span>
                ) : esAbandono && !pareja2Gano ? (
                  <span className="text-[9px] font-bold text-orange-600">AB.</span>
                ) : esWO && pareja2Gano ? (
                  <span className="text-[9px] font-bold text-green-600">W.O.</span>
                ) : partido.resultado ? (
                  <div className="flex gap-1">
                    <span className={`text-xs font-bold ${pareja2Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                      {partido.resultado.set1[1]}
                    </span>
                    {partido.resultado.set2 && (
                      <span className={`text-xs font-bold ${pareja2Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                        {partido.resultado.set2[1]}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <span className="text-[9px] text-gray-400 italic">Por definir</span>
        )}
      </div>

      {/* Footer */}
      {(partido.fecha || partido.hora) && (
        <div className="px-2 py-0.5 bg-gray-100 border-t border-gray-200 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-gray-500">
            {partido.fecha?.split('-').reverse().join('/')} {partido.hora}
          </span>
        </div>
      )}
    </div>
  );
}

function FotoJugador({ jugador }: { jugador: Jugador }) {
  const initial = jugador.nombre ? jugador.nombre[0].toUpperCase() : '?';
  
  if (jugador.fotoUrl) {
    return (
      <img 
        src={jugador.fotoUrl} 
        alt={jugador.nombre}
        className="w-5 h-5 rounded-full object-cover border border-white bg-gray-200"
      />
    );
  }
  
  return (
    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[7px] font-bold text-gray-600 border border-white">
      {initial}
    </div>
  );
}
