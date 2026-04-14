import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Maximize2, Minimize2, ChevronDown, Sparkles } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const tieneZonaRepechaje = fasesActivas.some(f => f === 'ZONA' || f === 'REPECHAJE');

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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#0B0E14]' : ''} flex flex-col min-h-screen bg-[#0B0E14]`}>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[#232838] bg-[#151921] shrink-0">
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

      {/* Bracket - Scroll horizontal en móvil, centrado en desktop */}
      <div className="flex-1 relative p-4 md:p-6 overflow-auto bg-[#0B0E14]">
        <div className="relative z-10 min-w-max">
        {partidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Trophy className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No hay partidos para esta categoría</p>
          </div>
        ) : (
          <div className="flex justify-start md:justify-center items-start md:items-center min-h-full">
            <div className="flex gap-4 md:gap-8">
              {/* ZONA y REPECHAJE - Columnas simples */}
              {tieneZonaRepechaje && (
                <div className="flex gap-3 md:gap-6">
                  {fasesActivas.filter(f => f === 'ZONA' || f === 'REPECHAJE').map(fase => (
                    <FaseColumnSimple
                      key={fase}
                      fase={fase}
                      partidos={partidosPorFase[fase]}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
              
              {/* BRACKET CON POSICIONAMIENTO ABSOLUTO */}
              {fasesBracket.length > 0 && (
                <div className="relative flex items-center gap-4 md:gap-8">
                  <BracketTree 
                    fases={fasesBracket}
                    partidosPorFase={partidosPorFase}
                    isMobile={isMobile}
                  />
                  {/* CAMPEONES */}
                  <ChampionsCard 
                    ganador={partidosPorFase['FINAL']?.[0]?.ganador}
                    isMobile={isMobile}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// Columna simple para ZONA y REPECHAJE
function FaseColumnSimple({ fase, partidos, isMobile }: { fase: string; partidos: Partido[]; isMobile?: boolean }) {
  return (
    <div className={`flex flex-col ${isMobile ? 'w-[150px]' : 'w-[200px]'}`}>
      {/* Título */}
      <div className="mb-3 pb-2 border-b-2 border-[#df2531]">
        <span className="text-xs font-bold text-[#df2531] uppercase tracking-wider">{fase}</span>
      </div>
      {/* Cards */}
      <div className="flex flex-col gap-3">
        {partidos.map(partido => (
          <div key={partido.id}>
            <MatchCard partido={partido} isMobile={isMobile} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Bracket principal con posicionamiento absoluto
function BracketTree({ 
  fases, 
  partidosPorFase,
  isMobile = false
}: { 
  fases: string[];
  partidosPorFase: Record<string, Partido[]>;
  isMobile?: boolean;
}) {
  if (fases.length === 0) return null;

  // Encontrar la fase inicial (la que tiene más partidos)
  const faseInicial = fases.reduce((prev, curr) => 
    partidosPorFase[curr].length > partidosPorFase[prev].length ? curr : prev
  );
  const maxPartidos = partidosPorFase[faseInicial].length;
  
  // Dimensiones responsive
  const cardWidth = isMobile ? 150 : 200;
  const cardHeight = isMobile ? 110 : 140;
  const headerHeight = isMobile ? 32 : 40;
  const gapX = isMobile ? 24 : 48;
  const gapY = isMobile ? 12 : 20;
  
  // Altura total = header + cards
  const contentHeight = maxPartidos * cardHeight + (maxPartidos - 1) * gapY;
  const totalHeight = headerHeight + contentHeight;
  const totalWidth = fases.length * cardWidth + (fases.length - 1) * gapX;

  const getCardY = (fase: string, index: number) => {
    const numPartidos = partidosPorFase[fase].length;
    const span = maxPartidos / numPartidos;
    const filaCentro = index * span + (span - 1) / 2;
    return headerHeight + filaCentro * (cardHeight + gapY);
  };

  const getCardX = (faseIndex: number) => {
    return faseIndex * (cardWidth + gapX);
  };

  return (
    <div style={{ width: totalWidth, height: totalHeight }} className="relative">
      {/* Títulos de fases */}
      {fases.map((fase, faseIndex) => (
        <div
          key={`title-${fase}`}
          className="absolute"
          style={{
            left: getCardX(faseIndex),
            top: 0,
            width: cardWidth,
          }}
        >
          <div className="pb-2 border-b-2 border-[#df2531]">
            <span className="text-xs font-bold text-[#df2531] uppercase tracking-wider">{fase}</span>
          </div>
        </div>
      ))}

      {/* Conectores */}
      {fases.map((fase, faseIndex) => {
        if (faseIndex === 0) return null;
        
        const prevFase = fases[faseIndex - 1];
        const currPartidos = partidosPorFase[fase];
        const prevPartidos = partidosPorFase[prevFase];
        
        return currPartidos.map((partido, idx) => {
          const prevIdx1 = idx * 2;
          const prevIdx2 = idx * 2 + 1;
          
          if (prevIdx1 >= prevPartidos.length) return null;
          
          const x1 = getCardX(faseIndex - 1) + cardWidth;
          const x2 = getCardX(faseIndex);
          const yTarget = getCardY(fase, idx) + cardHeight / 2;
          
          const ySource1 = getCardY(prevFase, prevIdx1) + cardHeight / 2;
          const ySource2 = prevIdx2 < prevPartidos.length 
            ? getCardY(prevFase, prevIdx2) + cardHeight / 2
            : ySource1;
          
          const midX = x1 + (x2 - x1) / 2;
          
          return (
            <g key={`connector-${fase}-${partido.id}`}>
              <ConnectorLine x1={x1} y1={ySource1} x2={midX} y2={ySource1} />
              {prevIdx2 < prevPartidos.length && (
                <ConnectorLine x1={x1} y1={ySource2} x2={midX} y2={ySource2} />
              )}
              <ConnectorLine x1={midX} y1={Math.min(ySource1, ySource2)} x2={midX} y2={Math.max(ySource1, ySource2)} />
              <ConnectorLine x1={midX} y1={yTarget} x2={x2} y2={yTarget} />
            </g>
          );
        });
      })}

      {/* Cards */}
      {fases.map((fase, faseIndex) => (
        partidosPorFase[fase].map((partido, idx) => {
          const x = getCardX(faseIndex);
          const y = getCardY(fase, idx);
          
          return (
            <div
              key={partido.id}
              className="absolute"
              style={{ left: x, top: y, width: cardWidth, height: cardHeight }}
            >
              <MatchCard partido={partido} isMobile={isMobile} />
            </div>
          );
        })
      ))}
    </div>
  );
}

// Línea conectora
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
        stroke="#df2531"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Tarjeta de Campeones
function ChampionsCard({ ganador, isMobile }: { ganador?: Partido['ganador']; isMobile?: boolean }) {
  if (!ganador) return null;

  const fotoSize = isMobile ? 'w-14 h-14' : 'w-20 h-20';
  const trofeoSize = isMobile ? 'w-20 h-20' : 'w-28 h-28';
  const containerWidth = isMobile ? 'w-[150px]' : 'w-[200px]';

  return (
    <div className={`${containerWidth} flex flex-col items-center justify-center h-full`}>
      <div className="relative flex flex-col items-center">
        {/* Estrellas */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <Sparkles className="w-4 h-4 text-yellow-400 -mt-1" />
          <Sparkles className="w-3 h-3 text-yellow-300" />
        </div>

        {/* Copa de fondo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 z-0">
          <Trophy className={`${trofeoSize} text-yellow-500`} />
        </div>

        {/* Fotos ganadores */}
        <div className="relative flex -space-x-2 z-10">
          {ganador.jugador1.fotoUrl ? (
            <img
              src={ganador.jugador1.fotoUrl}
              alt={ganador.jugador1.nombre}
              className={`${fotoSize} rounded-full object-cover border-2 border-yellow-400 bg-[#151921] shadow-lg shadow-yellow-500/20`}
            />
          ) : (
            <div className={`${fotoSize} rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-sm font-bold text-white border-2 border-yellow-200 shadow-lg`}>
              {ganador.jugador1.nombre?.[0]}{ganador.jugador1.apellido?.[0]}
            </div>
          )}
          {ganador.jugador2.fotoUrl ? (
            <img
              src={ganador.jugador2.fotoUrl}
              alt={ganador.jugador2.nombre}
              className={`${fotoSize} rounded-full object-cover border-2 border-yellow-400 bg-[#151921] shadow-lg shadow-yellow-500/20`}
            />
          ) : (
            <div className={`${fotoSize} rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-sm font-bold text-white border-2 border-yellow-200 shadow-lg`}>
              {ganador.jugador2.nombre?.[0]}{ganador.jugador2.apellido?.[0]}
            </div>
          )}
        </div>
      </div>

      {/* CAMPEONES dorado */}
      <h3 className={`mt-3 font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 drop-shadow-[0_2px_4px_rgba(234,179,8,0.5)] tracking-widest ${isMobile ? 'text-lg' : 'text-2xl'}`}>
        CAMPEONES
      </h3>

      {/* Nombres */}
      <div className="mt-1 text-center space-y-0.5">
        <p className={`font-bold text-white ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {ganador.jugador1.nombre} <span className="text-yellow-400">{ganador.jugador1.apellido}</span>
        </p>
        <p className={`font-bold text-white ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {ganador.jugador2.nombre} <span className="text-yellow-400">{ganador.jugador2.apellido}</span>
        </p>
      </div>

      {/* Logo FairPadel */}
      <img
        src="https://res.cloudinary.com/dncjaaybv/image/upload/q_auto/f_auto/v1773057029/logo_h4y1tl.png"
        alt="FairPadel"
        className={`mt-3 object-contain opacity-90 ${isMobile ? 'h-6' : 'h-8'}`}
      />
    </div>
  );
}

// Match Card con fondo oscuro 80% transparencia
function MatchCard({ partido, isMobile }: { partido: Partido; isMobile?: boolean }) {
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
    <div className={`w-full bg-[#151921] rounded-lg overflow-hidden shadow-lg border border-[#232838] flex flex-col ${isMobile ? 'min-h-[110px]' : 'min-h-[140px]'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between bg-[#0B0E14] border-b border-[#232838] shrink-0 ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
        <span className="text-[9px] font-bold text-[#df2531]">{codigoPartido}</span>
        <span className={`text-[8px] text-gray-400 truncate ${isMobile ? 'max-w-[80px]' : 'max-w-[110px]'}`}>{headerText}</span>
      </div>

      {/* Equipo 1 */}
      <div className={`flex items-center border-b border-[#232838] flex-1 ${pareja1Gano ? 'bg-[#df2531]/10' : ''} ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
        {partido.inscripcion1 ? (
          <>
            <div className="flex -space-x-1 mr-1.5 shrink-0">
              <FotoJugador jugador={partido.inscripcion1.jugador1} />
              <FotoJugador jugador={partido.inscripcion1.jugador2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold uppercase truncate leading-tight text-white`}>
                {partido.inscripcion1.jugador1.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight text-gray-400`}>
                {partido.inscripcion1.jugador1.nombre}
              </div>
              <div className={`text-[10px] font-bold uppercase truncate leading-tight text-white`}>
                {partido.inscripcion1.jugador2.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight text-gray-400`}>
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
                    <span className={`text-xs font-bold ${pareja1Gano ? 'text-[#df2531]' : 'text-white'}`}>
                      {partido.resultado.set1[0]}
                    </span>
                    {partido.resultado.set2 && (
                      <span className={`text-xs font-bold ${pareja1Gano ? 'text-[#df2531]' : 'text-white/80'}`}>
                        {partido.resultado.set2[0]}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <span className="text-[9px] text-gray-500 italic">Por definir</span>
        )}
      </div>

      {/* Equipo 2 */}
      <div className={`flex items-center flex-1 border-b border-[#232838] ${pareja2Gano ? 'bg-[#df2531]/10' : ''} ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
        {partido.inscripcion2 ? (
          <>
            <div className="flex -space-x-1 mr-1.5 shrink-0">
              <FotoJugador jugador={partido.inscripcion2.jugador1} />
              <FotoJugador jugador={partido.inscripcion2.jugador2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja2Gano ? 'text-white' : 'text-white/90'}`}>
                {partido.inscripcion2.jugador1.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja2Gano ? 'text-white/80' : 'text-white/60'}`}>
                {partido.inscripcion2.jugador1.nombre}
              </div>
              <div className={`text-[10px] font-bold uppercase truncate leading-tight ${pareja2Gano ? 'text-white' : 'text-white/90'}`}>
                {partido.inscripcion2.jugador2.apellido}
              </div>
              <div className={`text-[8px] uppercase truncate leading-tight ${pareja2Gano ? 'text-white/80' : 'text-white/60'}`}>
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
                    <span className={`text-xs font-bold ${pareja2Gano ? 'text-[#df2531]' : 'text-white/80'}`}>
                      {partido.resultado.set1[1]}
                    </span>
                    {partido.resultado.set2 && (
                      <span className={`text-xs font-bold ${pareja2Gano ? 'text-[#df2531]' : 'text-white/80'}`}>
                        {partido.resultado.set2[1]}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <span className="text-[9px] text-gray-500 italic">Por definir</span>
        )}
      </div>

      {/* Footer */}
      {(partido.fecha || partido.hora) && (
        <div className="px-2 py-0.5 bg-[#0B0E14] border-t border-[#232838] flex items-center justify-center shrink-0">
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
        className="w-5 h-5 rounded-full object-cover border border-[#df2531]/50 bg-[#151921]"
      />
    );
  }
  
  return (
    <div className="w-5 h-5 rounded-full bg-[#df2531] flex items-center justify-center text-[7px] font-bold text-white border border-white/20">
      {initial}
    </div>
  );
}
