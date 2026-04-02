import { useState, useEffect, useMemo } from 'react';
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

      {/* Bracket - Layout tipo padel42 */}
      <div className="flex-1 bg-[#0a0b0f] p-4 md:p-6 overflow-x-auto">
        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="flex justify-center min-w-max">
            <div className="flex items-start gap-16">
              {/* Encontrar el máximo de partidos en fases del bracket (para calcular offsets) */}
              {(() => {
                const fasesBracket = fasesActivas.filter(f => f !== 'ZONA' && f !== 'REPECHAJE');
                const maxPartidosBracket = fasesBracket.length > 0 
                  ? Math.max(...fasesBracket.map(f => partidosPorFase[f].length))
                  : 0;
                
                return fasesActivas.map((fase, faseIndex) => (
                  <BracketColumn
                    key={fase}
                    fase={fase}
                    partidos={partidosPorFase[fase]}
                    faseIndex={faseIndex}
                    totalFases={fasesActivas.length}
                    maxPartidosBracket={maxPartidosBracket}
                  />
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BracketColumn({ 
  fase, 
  partidos, 
  faseIndex,
  totalFases,
  maxPartidosBracket
}: { 
  fase: string; 
  partidos: Partido[];
  faseIndex: number;
  totalFases: number;
  maxPartidosBracket: number;
}) {
  const getFaseLabel = (f: string) => {
    switch(f) {
      case 'ZONA': return 'ZONA';
      case 'REPECHAJE': return 'REPECHAJE';
      case 'OCTAVOS': return 'OCTAVOS';
      case 'CUARTOS': return 'CUARTOS';
      case 'SEMIS': return 'SEMIS';
      case 'FINAL': return 'FINAL';
      default: return f;
    }
  };

  // Gap vertical entre partidos (base)
  const gapBase = 20;
  const alturaCard = 140;
  
  // Fases sin conectores (ZONA, REPECHAJE): gap fijo, sin offset
  const sinConectores = fase === 'ZONA' || fase === 'REPECHAJE';
  
  // Para fases CON conectores: gap dinámico y offset para centrar
  // Ejemplo: Cuartos (4p, gap 20, offset 0) → Semis (2p, gap X, offset Y)
  //   S1 debe quedar centrado entre C1 y C2
  //   S2 debe quedar centrado entre C3 y C4
  let gapEntrePartidos = gapBase;
  let offsetVertical = 0;
  
  if (!sinConectores && partidos.length > 0 && maxPartidosBracket > 0) {
    // Calcular cuántos niveles bajamos desde la primera fase del bracket
    const niveles = Math.log2(maxPartidosBracket / partidos.length); // ej: 4→2 = 1 nivel
    
    // El gap aumenta: 20px, 60px, 140px, etc. (20 * (2^nivel + 1))
    gapEntrePartidos = gapBase * (Math.pow(2, niveles + 1) - 1);
    
    // Offset para centrar: altura/2 + gap/2 de la fase anterior
    offsetVertical = (alturaCard + gapEntrePartidos) / 2 - alturaCard / 2;
  } else {
    gapEntrePartidos = gapBase;
  }

  return (
    <div className="flex flex-col min-w-[220px]">
      {/* Título de fase */}
      <div className="mb-3 pb-2 border-b border-white/20">
        <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{getFaseLabel(fase)}</span>
      </div>

      {/* Partidos con offset para centrar en el bracket */}
      <div 
        className="flex flex-col" 
        style={{ 
          gap: `${gapEntrePartidos}px`,
          paddingTop: `${offsetVertical}px`
        }}
      >
        {partidos.map((partido, index) => (
          <MatchCard
            key={partido.id}
            partido={partido}
            showConnector={faseIndex < totalFases - 1 && fase !== 'ZONA' && fase !== 'REPECHAJE'}
            isLast={index === partidos.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  partido,
  showConnector,
  isLast
}: {
  partido: Partido;
  showConnector: boolean;
  isLast: boolean;
}) {
  const isFinalizado = !!partido.ganador;
  const pareja1Gano = isFinalizado && partido.ganador?.id === partido.inscripcion1?.id;
  const pareja2Gano = isFinalizado && partido.ganador?.id === partido.inscripcion2?.id;
  
  // Estados especiales
  const esDescalificacion = partido.razonResultado === 'descalificacion';
  const esAbandono = partido.razonResultado === 'abandono' || partido.razonResultado === 'lesion';
  const esWO = partido.razonResultado === 'wo';
  
  // Formatear código del partido
  const codigoPartido = `${partido.fase?.[0] || 'P'}${partido.orden}`;
  
  // Texto del header: Sede - Cancha (siempre debería tener)
  const headerText = partido.sede && partido.cancha 
    ? `${partido.sede} - ${partido.cancha}`
    : partido.cancha || partido.sede || 'Cancha por definir';

  return (
    <div className="relative flex items-center">
      {/* Card del partido */}
      <div className="w-[220px] bg-white rounded overflow-hidden shadow-lg shrink-0">
        {/* Header: Sede - Cancha */}
        <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">
          <span className="text-[10px] font-bold text-gray-600">{codigoPartido}</span>
          <span className="text-[9px] text-gray-600 truncate max-w-[120px]">{headerText}</span>
        </div>

        {/* Equipo 1 */}
        <div className={`flex items-center px-2 py-1.5 border-b border-gray-100 ${pareja1Gano ? 'bg-blue-50' : ''}`}>
          {partido.inscripcion1 ? (
            <>
              <div className="flex -space-x-1 mr-2">
                <FotoJugador jugador={partido.inscripcion1.jugador1} />
                <FotoJugador jugador={partido.inscripcion1.jugador2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-bold uppercase truncate ${pareja1Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                  {partido.inscripcion1.jugador1.apellido}
                </div>
                <div className={`text-[9px] uppercase truncate ${pareja1Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                  {partido.inscripcion1.jugador1.nombre}
                </div>
                <div className={`text-[11px] font-bold uppercase truncate ${pareja1Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                  {partido.inscripcion1.jugador2.apellido}
                </div>
                <div className={`text-[9px] uppercase truncate ${pareja1Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                  {partido.inscripcion1.jugador2.nombre}
                </div>
              </div>
              {/* Resultados equipo 1 (horizontal) */}
              {isFinalizado && (
                <div className="flex items-center gap-1 ml-1">
                  {esDescalificacion && pareja1Gano ? (
                    <span className="text-[10px] font-bold text-red-600">DESC.</span>
                  ) : esAbandono && !pareja1Gano ? (
                    <span className="text-[10px] font-bold text-orange-600">AB.</span>
                  ) : esWO && pareja1Gano ? (
                    <span className="text-[10px] font-bold text-green-600">W.O.</span>
                  ) : partido.resultado ? (
                    <>
                      <span className={`text-sm font-bold ${pareja1Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                        {partido.resultado.set1[0]}
                      </span>
                      {partido.resultado.set2 && (
                        <span className={`text-sm font-bold ${pareja1Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                          '-' {partido.resultado.set2[0]}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Por definir</span>
          )}
        </div>

        {/* Equipo 2 */}
        <div className={`flex items-center px-2 py-1.5 ${pareja2Gano ? 'bg-blue-50' : ''}`}>
          {partido.inscripcion2 ? (
            <>
              <div className="flex -space-x-1 mr-2">
                <FotoJugador jugador={partido.inscripcion2.jugador1} />
                <FotoJugador jugador={partido.inscripcion2.jugador2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-bold uppercase truncate ${pareja2Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                  {partido.inscripcion2.jugador1.apellido}
                </div>
                <div className={`text-[9px] uppercase truncate ${pareja2Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                  {partido.inscripcion2.jugador1.nombre}
                </div>
                <div className={`text-[11px] font-bold uppercase truncate ${pareja2Gano ? 'text-blue-700' : 'text-gray-800'}`}>
                  {partido.inscripcion2.jugador2.apellido}
                </div>
                <div className={`text-[9px] uppercase truncate ${pareja2Gano ? 'text-blue-600' : 'text-gray-500'}`}>
                  {partido.inscripcion2.jugador2.nombre}
                </div>
              </div>
              {/* Resultados equipo 2 (horizontal) */}
              {isFinalizado && (
                <div className="flex items-center gap-1 ml-1">
                  {esDescalificacion && pareja2Gano ? (
                    <span className="text-[10px] font-bold text-red-600">DESC.</span>
                  ) : esAbandono && !pareja2Gano ? (
                    <span className="text-[10px] font-bold text-orange-600">AB.</span>
                  ) : esWO && pareja2Gano ? (
                    <span className="text-[10px] font-bold text-green-600">W.O.</span>
                  ) : partido.resultado ? (
                    <>
                      <span className={`text-sm font-bold ${pareja2Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                        {partido.resultado.set1[1]}
                      </span>
                      {partido.resultado.set2 && (
                        <span className={`text-sm font-bold ${pareja2Gano ? 'text-blue-700' : 'text-gray-700'}`}>
                          '-' {partido.resultado.set2[1]}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Por definir</span>
          )}
        </div>

        {/* Footer (zócalo): Fecha completa DD/MM/YYYY y hora */}
        {(partido.fecha || partido.hora) && (
          <div className="px-2 py-1 bg-gray-100 border-t border-gray-200 flex items-center justify-center">
            <span className="text-[9px] text-gray-500">
              {partido.fecha?.split('-').reverse().join('/')} {partido.hora}
            </span>
          </div>
        )}
      </div>

      {/* Conector L-shaped a la siguiente fase */}
      {showConnector && (
        <div className="absolute left-full top-1/2 flex items-center" style={{ width: '24px' }}>
          {/* Horizontal */}
          <div className="h-px bg-gray-400 flex-1" />
          {/* Vertical que baja al siguiente partido (solo si no es el último) */}
          {!isLast && (
            <div 
              className="absolute bg-gray-400"
              style={{ 
                width: '1px', 
                height: '40px',
                left: '100%',
                top: '50%'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Componente de foto de jugador
function FotoJugador({ jugador }: { jugador: Jugador }) {
  const initial = jugador.nombre ? jugador.nombre[0].toUpperCase() : '?';
  
  if (jugador.fotoUrl) {
    return (
      <img 
        src={jugador.fotoUrl} 
        alt={jugador.nombre}
        className="w-6 h-6 rounded-full object-cover border border-white bg-gray-200"
      />
    );
  }
  
  return (
    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold text-gray-600 border border-white">
      {initial}
    </div>
  );
}
