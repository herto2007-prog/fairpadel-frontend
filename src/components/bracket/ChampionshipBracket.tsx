import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';


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

// Fases que NO llevan conectores (fase de grupos y repechaje)
const FASES_SIN_CONECTORES = ['ZONA', 'REPECHAJE'];

// Fases del bracket eliminatorio (CON conectores)
const FASES_BRACKET = ['OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'];

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
        const newPartidos = data.partidos || [];
        // Detectar cambios
        const hasChanges = partidos.length > 0 && (
          partidos.length !== newPartidos.length ||
          partidos.some((p, i) => {
            const np = newPartidos[i];
            return p.ganador?.id !== np.ganador?.id || p.resultado?.set1?.[0] !== np.resultado?.set1?.[0];
          })
        );
        if (hasChanges) {
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

  // Agrupar partidos por fase
  const partidosPorFase = useMemo(() => {
    const grupos: Record<string, Partido[]> = {};
    [...FASES_SIN_CONECTORES, ...FASES_BRACKET].forEach(fase => grupos[fase] = []);
    partidos.forEach(p => {
      const faseNormalizada = p.fase?.toUpperCase() || '';
      if (grupos[faseNormalizada]) grupos[faseNormalizada].push(p);
    });
    Object.keys(grupos).forEach(fase => grupos[fase].sort((a, b) => a.orden - b.orden));
    return grupos;
  }, [partidos]);

  // Separar fases
  const fasesSinConectores = FASES_SIN_CONECTORES.filter(f => partidosPorFase[f]?.length > 0);
  const fasesBracket = FASES_BRACKET.filter(f => partidosPorFase[f]?.length > 0);

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
          {hasNewChanges && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Actualizado
            </motion.span>
          )}
        </div>
        <button onClick={toggleFullscreen} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 bg-[#0a0b0f] p-4 md:p-8">
        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* FASES SIN CONECTORES (Zona, Repechaje) */}
            {fasesSinConectores.map(fase => (
              <FaseSinConectores key={fase} fase={fase} partidos={partidosPorFase[fase]} />
            ))}

            {/* BRACKET ELIMINATORIO (Con conectores) */}
            {fasesBracket.length > 0 && (
              <BracketEliminatorio partidosPorFase={partidosPorFase} fasesActivas={fasesBracket} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para fases sin conectores (Zona, Repechaje)
function FaseSinConectores({ fase, partidos }: { fase: string; partidos: Partido[] }) {
  const getFaseLabel = (f: string) => {
    switch(f) {
      case 'ZONA': return 'FASE DE GRUPOS';
      case 'REPECHAJE': return 'REPECHAJE';
      default: return f;
    }
  };

  return (
    <div>
      <div className="mb-4 px-4 py-2 bg-[#df2531]/20 text-[#df2531] border border-[#df2531]/30 rounded-lg inline-block">
        <span className="text-sm font-bold uppercase tracking-wider">{getFaseLabel(fase)}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {partidos.map(partido => (
          <PartidoCardSimple key={partido.id} partido={partido} />
        ))}
      </div>
    </div>
  );
}

// Card simple para fase de grupos/repechaje
function PartidoCardSimple({ partido }: { partido: Partido }) {
  const isFinalizado = !!partido.ganador;
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;

  return (
    <div className={`bg-[#1a1d26] border rounded-lg overflow-hidden ${isFinalizado ? 'border-green-500/30' : 'border-white/10'}`}>
      <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
        <span className="text-xs text-gray-400">#{partido.orden}</span>
        {partido.cancha && <span className="text-[10px] text-gray-500">{partido.cancha}</span>}
      </div>
      <div className="p-3 space-y-3">
        {/* Pareja 1 */}
        <div className={`flex items-center justify-between ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
          <div className="flex items-center gap-2">
            {partido.inscripcion1 ? (
              <>
                <div className="flex -space-x-1">
                  <Avatar jugador={partido.inscripcion1.jugador1} small />
                  <Avatar jugador={partido.inscripcion1.jugador2} small />
                </div>
                <div>
                  <div className="text-xs font-semibold">{partido.inscripcion1.jugador1.apellido}</div>
                  <div className="text-xs font-semibold">{partido.inscripcion1.jugador2.apellido}</div>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">Por definir</span>
            )}
          </div>
          {isFinalizado && partido.resultado && (
            <span className="text-sm font-mono font-bold">{partido.resultado.set1[0]}</span>
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <span className="text-[#df2531] text-xs font-bold">VS</span>
        </div>

        {/* Pareja 2 */}
        <div className={`flex items-center justify-between ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
          <div className="flex items-center gap-2">
            {partido.inscripcion2 ? (
              <>
                <div className="flex -space-x-1">
                  <Avatar jugador={partido.inscripcion2.jugador1} small />
                  <Avatar jugador={partido.inscripcion2.jugador2} small />
                </div>
                <div>
                  <div className="text-xs font-semibold">{partido.inscripcion2.jugador1.apellido}</div>
                  <div className="text-xs font-semibold">{partido.inscripcion2.jugador2.apellido}</div>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">Por definir</span>
            )}
          </div>
          {isFinalizado && partido.resultado && (
            <span className="text-sm font-mono font-bold">{partido.resultado.set1[1]}</span>
          )}
        </div>
      </div>
      {partido.fecha && (
        <div className="px-3 py-2 bg-black/20 text-[10px] text-gray-500">
          {partido.fecha} {partido.hora}
        </div>
      )}
    </div>
  );
}

// Bracket eliminatorio con conectores (estructura de árbol)
function BracketEliminatorio({ partidosPorFase, fasesActivas }: { 
  partidosPorFase: Record<string, Partido[]>; 
  fasesActivas: string[];
}) {
  
  return (
    <div>
      <div className="mb-4 px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg inline-block">
        <span className="text-sm font-bold uppercase tracking-wider">🏆 ELIMINATORIAS</span>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex items-stretch gap-8 md:gap-12 min-w-max">
          {fasesActivas.map((fase, faseIndex) => (
            <BracketColumn
              key={fase}
              fase={fase}
              partidos={partidosPorFase[fase]}
              faseIndex={faseIndex}
              totalFases={fasesActivas.length}

            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Columna del bracket con conectores
function BracketColumn({ 
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
  const getFaseLabel = (f: string) => {
    switch(f) {
      case 'OCTAVOS': return 'OCTAVOS';
      case 'CUARTOS': return 'CUARTOS';
      case 'SEMIFINAL': return 'SEMIS';
      case 'FINAL': return '🏆 FINAL';
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

  // Calcular el espaciado basado en cuántos partidos faltan en la columna
  const nivelEnArbol = totalFases - 1 - faseIndex; // 0 = final, 1 = semis, etc.
  
  // El espaciado debe ser proporcional para que los conectores alineen bien
  const baseSpacing = 20; // px
  const gapBetweenCards = baseSpacing * Math.pow(2, nivelEnArbol + 1);

  return (
    <div className="flex flex-col">
      {/* Etiqueta de fase */}
      <div className={`mb-4 px-3 py-2 rounded-lg border ${getFaseColor(fase)} text-center`}>
        <span className="text-xs font-bold uppercase tracking-wider">{getFaseLabel(fase)}</span>
      </div>

      {/* Contenedor de partidos con espaciado dinámico */}
      <div className="flex flex-col flex-1 justify-center" style={{ gap: `${gapBetweenCards}px` }}>
        {partidos.map((partido, index) => (
          <BracketMatchCard
            key={partido.id}
            partido={partido}
            showConnectorLeft={faseIndex > 0}
            showConnectorRight={faseIndex < totalFases - 1}
            gapBetweenCards={gapBetweenCards}
            isFirstInColumn={index === 0}
            isLastInColumn={index === partidos.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// Card de partido con conectores
function BracketMatchCard({
  partido,
  showConnectorLeft,
  showConnectorRight,
  gapBetweenCards,
}: {
  partido: Partido;
  showConnectorLeft: boolean;
  showConnectorRight: boolean;
  gapBetweenCards: number;
  isFirstInColumn: boolean;
  isLastInColumn: boolean;
}) {
  const isFinalizado = !!partido.ganador;
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;
  
  // Altura de la línea vertical del conector
  const connectorHeight = gapBetweenCards / 2 + 40; // 40 es la mitad aprox de la altura de la card

  return (
    <div className="relative flex items-center">
      {/* Línea de entrada izquierda (desde fase anterior) */}
      {showConnectorLeft && (
        <>
          {/* Horizontal */}
          <div className="absolute left-0 top-1/2 w-6 h-px bg-white/30 -translate-x-full" />
          {/* Vertical superior */}
          <div 
            className="absolute bg-white/30 left-0 -translate-x-full"
            style={{ 
              width: '1px', 
              height: `${connectorHeight}px`,
              top: '50%',
              transform: 'translate(-24px, -100%)'
            }}
          />
          {/* Vertical inferior */}
          <div 
            className="absolute bg-white/30 left-0 -translate-x-full"
            style={{ 
              width: '1px', 
              height: `${connectorHeight}px`,
              top: '50%',
              transform: 'translateX(-24px)'
            }}
          />
        </>
      )}

      {/* Card del partido */}
      <div className={`w-44 md:w-52 bg-[#1a1d26] border rounded-lg overflow-hidden shrink-0 ${isFinalizado ? 'border-green-500/30' : 'border-white/10'}`}>
        {/* Header */}
        <div className="px-2.5 py-1 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <span className="text-[10px] text-gray-400">#{partido.orden}</span>
          {partido.cancha && <span className="text-[9px] text-gray-500 truncate max-w-[60px]">{partido.cancha}</span>}
        </div>

        {/* Equipo 1 */}
        <div className={`px-3 py-2 flex items-center justify-between border-b border-white/5 ${pareja1Gano ? 'bg-green-500/5' : ''}`}>
          <div className="flex items-center gap-2">
            {partido.inscripcion1 ? (
              <>
                <div className="flex -space-x-1">
                  <Avatar jugador={partido.inscripcion1.jugador1} small />
                  <Avatar jugador={partido.inscripcion1.jugador2} small />
                </div>
                <div className={`text-xs font-semibold ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
                  {partido.inscripcion1.jugador1.apellido} / {partido.inscripcion1.jugador2.apellido}
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">Por definir</span>
            )}
          </div>
          {isFinalizado && partido.resultado && (
            <span className={`text-sm font-mono font-bold ${pareja1Gano ? 'text-green-400' : 'text-white'}`}>
              {partido.resultado.set1[0]}
            </span>
          )}
        </div>

        {/* Equipo 2 */}
        <div className={`px-3 py-2 flex items-center justify-between ${pareja2Gano ? 'bg-green-500/5' : ''}`}>
          <div className="flex items-center gap-2">
            {partido.inscripcion2 ? (
              <>
                <div className="flex -space-x-1">
                  <Avatar jugador={partido.inscripcion2.jugador1} small />
                  <Avatar jugador={partido.inscripcion2.jugador2} small />
                </div>
                <div className={`text-xs font-semibold ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
                  {partido.inscripcion2.jugador1.apellido} / {partido.inscripcion2.jugador2.apellido}
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">Por definir</span>
            )}
          </div>
          {isFinalizado && partido.resultado && (
            <span className={`text-sm font-mono font-bold ${pareja2Gano ? 'text-green-400' : 'text-white'}`}>
              {partido.resultado.set1[1]}
            </span>
          )}
        </div>

        {/* Fecha/hora */}
        {partido.fecha && (
          <div className="px-3 py-1.5 bg-black/20 text-[9px] text-gray-500 text-center">
            {partido.fecha.slice(5)} {partido.hora}
          </div>
        )}
      </div>

      {/* Línea de salida derecha (hacia siguiente fase) */}
      {showConnectorRight && (
        <div className="absolute right-0 top-1/2 w-6 h-px bg-white/30 translate-x-full" />
      )}
    </div>
  );
}

// Avatar component
function Avatar({ jugador, small = false }: { jugador: { nombre: string; fotoUrl?: string | null }; small?: boolean }) {
  const initial = jugador.nombre ? jugador.nombre[0].toUpperCase() : '?';
  const size = small ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]';
  
  if (jugador.fotoUrl) {
    return (
      <img 
        src={jugador.fotoUrl} 
        alt={jugador.nombre}
        className={`${size} rounded-full object-cover border border-[#1a1d26]`}
      />
    );
  }
  
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-[#df2531] to-[#b91c22] flex items-center justify-center font-bold border border-[#1a1d26]`}>
      {initial}
    </div>
  );
}
