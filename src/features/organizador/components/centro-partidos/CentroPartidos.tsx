import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Edit3, Calendar, MapPin, Search, Trophy, Swords, CheckCircle2,
} from 'lucide-react';
import { api } from '../../../../services/api';
import { formatDatePY } from '../../../../utils/date';
import { RegistroResultadoModal, MarcadorEnVivo } from '../resultados';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';

// ═══════════════════════════════════════════════════════
// CENTRO DE PARTIDOS — operar la jornada (cargar resultados)
// Todos los partidos de TODAS las categorías en una lista plana,
// con buscador + filtros, y la carga inline (sin drill-down).
// Reusa la misma card y los mismos modales del Fixture.
// ═══════════════════════════════════════════════════════

interface Jugador { nombre: string; apellido: string; fotoUrl?: string | null }
interface Inscripcion { id: string; jugador1: Jugador; jugador2: Jugador }

interface Partido {
  id: string;
  fase: string;
  orden: number;
  esBye: boolean;
  categoriaId: string;
  categoria?: { id: string; nombre: string; tipo: string; tipoCategoria?: string } | null;
  inscripcion1?: Inscripcion | null;
  inscripcion2?: Inscripcion | null;
  ganador?: { id: string } | null;
  resultado?: { set1: [number, number]; set2: [number, number]; set3?: [number, number] };
  formatoSet3?: 'SET_COMPLETO' | 'SUPER_TIE_BREAK';
  estado?: string;
  fecha?: string;
  hora?: string;
  cancha?: string;
  navegacion?: {
    partidoSiguienteId?: string | null;
    partidoPerdedorSiguienteId?: string | null;
  };
}

type EstadoOp = 'porjugar' | 'envivo' | 'pendiente' | 'finalizado';

const FILTROS: { key: EstadoOp | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'envivo', label: 'En vivo' },
  { key: 'porjugar', label: 'Por jugar' },
  { key: 'finalizado', label: 'Finalizados' },
];

function estadoOperativo(p: Partido): EstadoOp {
  if (p.estado === 'FINALIZADO' || p.ganador) return 'finalizado';
  if (p.estado === 'EN_JUEGO') return 'envivo';
  const jugable = !!p.inscripcion1 && !!p.inscripcion2 && !p.esBye;
  if (jugable && p.fecha) {
    const dt = new Date(`${p.fecha}T${p.hora || '00:00'}:00`);
    if (!isNaN(dt.getTime()) && dt.getTime() <= Date.now()) return 'pendiente';
  }
  return 'porjugar';
}

function puedeEditarResultado(p: Partido, todos: Partido[]): boolean {
  if (!p.ganador) return false;
  const sigId = p.navegacion?.partidoSiguienteId;
  const perdId = p.navegacion?.partidoPerdedorSiguienteId;
  const sig = sigId ? todos.find(x => x.id === sigId) : null;
  const perd = perdId ? todos.find(x => x.id === perdId) : null;
  if (sig?.ganador) return false;
  if (perd?.ganador) return false;
  return true;
}

function nombresDe(p: Partido): string {
  const ins = [p.inscripcion1, p.inscripcion2].filter(Boolean) as Inscripcion[];
  return ins
    .flatMap(i => [i.jugador1, i.jugador2])
    .map(j => `${j.nombre} ${j.apellido}`)
    .join(' ');
}

// Normaliza para buscar sin tildes ni mayúsculas: "Giménez" -> "gimenez".
// Separa los acentos (NFD) y descarta el bloque de marcas combinantes (U+0300–U+036F).
function norm(s: string): string {
  return s
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('')
    .toLowerCase();
}

type Genero = 'CABALLEROS' | 'DAMAS' | 'MIXTO';
const GENERO_LABEL: Record<Genero, string> = { CABALLEROS: 'Caballeros', DAMAS: 'Damas', MIXTO: 'Mixto' };

function generoDeCat(cat?: { tipo: string; tipoCategoria?: string } | null): Genero | null {
  if (!cat) return null;
  if (cat.tipoCategoria === 'MIXTO') return 'MIXTO';
  return cat.tipo === 'FEMENINO' ? 'DAMAS' : 'CABALLEROS';
}

export function CentroPartidos({ tournamentId }: { tournamentId: string }) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroGenero, setFiltroGenero] = useState<Genero | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<EstadoOp | 'todos'>('todos');
  const [modalResultado, setModalResultado] = useState<{ open: boolean; partido: Partido | null; mode: 'create' | 'edit' }>({ open: false, partido: null, mode: 'create' });
  const [modalVivo, setModalVivo] = useState<{ open: boolean; partido: Partido | null }>({ open: false, partido: null });

  useEffect(() => { loadPartidos(); }, [tournamentId]);

  const loadPartidos = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/centro-partidos`);
      if (data.success) setPartidos(data.partidos);
    } catch (error) {
      console.error('Error cargando partidos del torneo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Géneros presentes en el torneo (para mostrar solo los que aplican)
  const generosPresentes = useMemo(() => {
    const set = new Set<Genero>();
    partidos.forEach(p => { const g = generoDeCat(p.categoria); if (g) set.add(g); });
    return set;
  }, [partidos]);

  // Categorías presentes (filtradas por el género elegido)
  const categorias = useMemo(() => {
    const map = new Map<string, string>();
    partidos.forEach(p => {
      if (!p.categoria) return;
      if (filtroGenero !== 'todos' && generoDeCat(p.categoria) !== filtroGenero) return;
      map.set(p.categoria.id, p.categoria.nombre);
    });
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [partidos, filtroGenero]);

  // Base: aplica buscador (sin tildes, multi-palabra) + género + categoría
  // (no el estado, para que los contadores de los chips reflejen el resto del filtro)
  const base = useMemo(() => {
    const tokens = norm(search).split(/\s+/).filter(Boolean);
    return partidos.filter(p => {
      if (filtroGenero !== 'todos' && generoDeCat(p.categoria) !== filtroGenero) return false;
      if (filtroCategoria !== 'todas' && p.categoriaId !== filtroCategoria) return false;
      if (tokens.length) {
        const nombres = norm(nombresDe(p));
        if (!tokens.every(t => nombres.includes(t))) return false;
      }
      return true;
    });
  }, [partidos, search, filtroGenero, filtroCategoria]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: base.length, porjugar: 0, envivo: 0, pendiente: 0, finalizado: 0 };
    base.forEach(p => { c[estadoOperativo(p)]++; });
    return c;
  }, [base]);

  const visibles = filtroEstado === 'todos' ? base : base.filter(p => estadoOperativo(p) === filtroEstado);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full" />
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="text-center py-16 bg-[#151921] border border-[#232838] rounded-2xl">
        <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-white font-medium">Todavía no hay partidos</p>
        <p className="text-gray-400 text-sm mt-1">Sorteá los cuadros en "Cuadro" y van a aparecer acá para cargar resultados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Centro de Partidos</h2>
        <p className="text-gray-400 text-sm">Cargá resultados de todas las categorías desde un solo lugar.</p>
      </div>

      {/* Buscador + filtro categoría */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por jugador…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#0B0E14] border border-[#232838] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531]/50"
          />
        </div>
        {generosPresentes.size > 1 && (
          <select
            value={filtroGenero}
            onChange={e => { setFiltroGenero(e.target.value as Genero | 'todos'); setFiltroCategoria('todas'); }}
            className="px-3 py-2.5 bg-[#0B0E14] border border-[#232838] rounded-xl text-sm text-white focus:outline-none focus:border-[#df2531]/50"
          >
            <option value="todos">Todos los géneros</option>
            {(['CABALLEROS', 'DAMAS', 'MIXTO'] as Genero[])
              .filter(g => generosPresentes.has(g))
              .map(g => <option key={g} value={g}>{GENERO_LABEL[g]}</option>)}
          </select>
        )}
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="px-3 py-2.5 bg-[#0B0E14] border border-[#232838] rounded-xl text-sm text-white focus:outline-none focus:border-[#df2531]/50"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Chips de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filtroEstado === f.key ? 'bg-[#df2531] text-white' : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No hay partidos con este filtro.</div>
      ) : (
        <div className="grid gap-3">
          {visibles.map(partido => (
            <PartidoFila
              key={partido.id}
              partido={partido}
              todos={partidos}
              onMarcadorVivo={() => setModalVivo({ open: true, partido })}
              onRegistrarResultado={() => setModalResultado({ open: true, partido, mode: 'create' })}
              onEditarResultado={() => setModalResultado({ open: true, partido, mode: 'edit' })}
            />
          ))}
        </div>
      )}

      {/* Modales (reusados del Fixture) */}
      <RegistroResultadoModal
        isOpen={modalResultado.open}
        onClose={() => setModalResultado({ open: false, partido: null, mode: 'create' })}
        match={modalResultado.partido as any}
        mode={modalResultado.mode}
        onSuccess={() => { loadPartidos(); setModalResultado({ open: false, partido: null, mode: 'create' }); }}
      />
      <MarcadorEnVivo
        isOpen={modalVivo.open}
        onClose={() => setModalVivo({ open: false, partido: null })}
        match={modalVivo.partido as any}
        onSuccess={() => { loadPartidos(); setModalVivo({ open: false, partido: null }); }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Fila/card de partido (misma estética que el Fixture)
// ═══════════════════════════════════════════════════════

function PartidoFila({
  partido, todos, onMarcadorVivo, onRegistrarResultado, onEditarResultado,
}: {
  partido: Partido;
  todos: Partido[];
  onMarcadorVivo: () => void;
  onRegistrarResultado: () => void;
  onEditarResultado: () => void;
}) {
  const op = estadoOperativo(partido);
  const isFinalizado = op === 'finalizado';
  const puedeJugar = !!partido.inscripcion1 && !!partido.inscripcion2 && !partido.esBye && !isFinalizado;
  const puedeEditar = isFinalizado && puedeEditarResultado(partido, todos);

  const borde =
    op === 'pendiente' ? 'border-amber-500/30' :
    op === 'envivo' ? 'border-[#df2531]/40' :
    isFinalizado ? 'border-green-500/20' : 'border-white/5';

  return (
    <div className={`bg-white/[0.03] rounded-xl p-4 border ${borde}`}>
      {/* Strip superior: categoría + fase + horario + cancha */}
      <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
        {partido.categoria && (
          <span className="px-2 py-0.5 rounded bg-[#df2531]/15 text-[#df2531] font-medium">
            {partido.categoria.nombre}
          </span>
        )}
        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300">{partido.fase}</span>
        {op === 'envivo' && <span className="px-2 py-0.5 rounded bg-[#df2531]/20 text-[#df2531]">En vivo</span>}
        {op === 'pendiente' && <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">Falta resultado</span>}
        {isFinalizado && <span className="px-2 py-0.5 rounded bg-green-500/15 text-green-400">Finalizado</span>}
        <span className="flex-1" />
        {partido.fecha && (
          <span className="flex items-center gap-1 text-gray-500">
            <Calendar className="w-3 h-3" />{formatDatePY(partido.fecha)}{partido.hora ? ` ${partido.hora}` : ''}
          </span>
        )}
        {partido.cancha && (
          <span className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-3 h-3" />{partido.cancha}
          </span>
        )}
      </div>

      {/* Parejas */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 flex items-center gap-3 ${partido.ganador?.id === partido.inscripcion1?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion1 ? (
            <>
              <ParejaAvatar jugador1={partido.inscripcion1.jugador1} jugador2={partido.inscripcion1.jugador2} size="md" />
              <div className="min-w-0">
                <div className="font-medium truncate">{partido.inscripcion1.jugador1.nombre} {partido.inscripcion1.jugador1.apellido}</div>
                <div className="font-medium truncate">{partido.inscripcion1.jugador2.nombre} {partido.inscripcion1.jugador2.apellido}</div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">Por definir</div>
          )}
        </div>

        <div className="text-center px-2 flex-shrink-0">
          {isFinalizado && partido.resultado ? (
            <div className="font-mono text-base font-bold text-white whitespace-nowrap">
              {partido.resultado.set1[0]}-{partido.resultado.set1[1]}
              {partido.resultado.set2 && ` | ${partido.resultado.set2[0]}-${partido.resultado.set2[1]}`}
              {partido.resultado.set3 && ` | ${partido.resultado.set3[0]}-${partido.resultado.set3[1]}`}
            </div>
          ) : (
            <div className="text-gray-500 font-bold">VS</div>
          )}
        </div>

        <div className={`flex-1 flex items-center justify-end gap-3 ${partido.ganador?.id === partido.inscripcion2?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion2 ? (
            <>
              <div className="text-right min-w-0">
                <div className="font-medium truncate">{partido.inscripcion2.jugador1.nombre} {partido.inscripcion2.jugador1.apellido}</div>
                <div className="font-medium truncate">{partido.inscripcion2.jugador2.nombre} {partido.inscripcion2.jugador2.apellido}</div>
              </div>
              <ParejaAvatar jugador1={partido.inscripcion2.jugador1} jugador2={partido.inscripcion2.jugador2} size="md" />
            </>
          ) : (
            <div className="text-gray-500 italic">Por definir</div>
          )}
        </div>
      </div>

      {/* Acciones */}
      {puedeJugar && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button onClick={onMarcadorVivo} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg text-sm font-medium transition-colors">
            <Play className="w-4 h-4" />En Vivo
          </button>
          <button onClick={onRegistrarResultado} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
            <Edit3 className="w-4 h-4" />Resultado
          </button>
        </div>
      )}

      {puedeEditar && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <button onClick={onEditarResultado} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors">
            <Edit3 className="w-4 h-4" />Editar resultado
          </button>
        </div>
      )}

      {isFinalizado && !puedeEditar && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {partido.navegacion?.partidoSiguienteId ? 'Resultado cargado (ya avanzó el ganador)' : 'Resultado cargado'}
        </div>
      )}

      {partido.esBye && !isFinalizado && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-yellow-500/80 text-center flex items-center justify-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />BYE — pasa directo
        </div>
      )}
    </div>
  );
}
