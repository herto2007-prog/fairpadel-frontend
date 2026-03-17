import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Play, Edit3, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '../../../../services/api';
import { RegistroResultadoModal, MarcadorEnVivo } from '../resultados';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';
import { FASES_ORDENADAS } from '../../utils/faseColors';

interface BracketViewProps {
  tournamentId: string;
  categoriaId: string;
  fixtureVersionId: string;
}

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
  formatoSet3?: 'SET_COMPLETO' | 'SUPER_TIE_BREAK';
  estado?: string;
  fecha?: string;
  hora?: string;
  cancha?: string;
  torneoCanchaId?: string | null;
  fechaProgramada?: string | null;
  horaProgramada?: string | null;
}

export function BracketView({ 
  tournamentId: _tournamentId, 
  categoriaId: _categoriaId, 
  fixtureVersionId 
}: BracketViewProps) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [faseActiva, setFaseActiva] = useState<string>('ZONA');
  const [modalResultado, setModalResultado] = useState<{ open: boolean; partido: Partido | null }>({ open: false, partido: null });
  const [modalVivo, setModalVivo] = useState<{ open: boolean; partido: Partido | null }>({ open: false, partido: null });

  useEffect(() => {
    loadPartidos();
  }, [fixtureVersionId]);

  const loadPartidos = async () => {
    try {
      const { data } = await api.get(`/admin/bracket/${fixtureVersionId}/partidos`);
      if (data.success) {
        console.log('[BracketView] Partidos recibidos:', data.partidos.slice(0, 2).map((p: any) => ({
          id: p.id,
          resultado: p.resultado,
          estado: p.estado,
        })));
        setPartidos(data.partidos);
      }
    } catch (error) {
      console.error('Error cargando partidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const partidosPorFase = {
    ZONA: partidos.filter(p => p.fase === 'ZONA'),
    REPECHAJE: partidos.filter(p => p.fase === 'REPECHAJE'),
    OCTAVOS: partidos.filter(p => p.fase === 'OCTAVOS'),
    CUARTOS: partidos.filter(p => p.fase === 'CUARTOS'),
    SEMIS: partidos.filter(p => p.fase === 'SEMIS'),
    FINAL: partidos.filter(p => p.fase === 'FINAL'),
  };

  const fasesDisponibles = Object.entries(partidosPorFase)
    .filter(([, partidos]) => partidos.length > 0)
    .map(([fase]) => fase);

  // Calcular partidos sin programar (sin cancha/fecha/hora asignadas)
  const partidosSinProgramar = partidos.filter(p => 
    !p.esBye && 
    !p.ganador && 
    p.inscripcion1 && 
    p.inscripcion2 &&
    (!p.torneoCanchaId || !p.fechaProgramada || !p.horaProgramada)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs de fases */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {fasesDisponibles.map((fase) => (
          <button
            key={fase}
            onClick={() => setFaseActiva(fase)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              faseActiva === fase
                ? 'bg-[#df2531] text-white'
                : 'bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {fase}
            <span className="ml-2 text-xs opacity-60">
              {partidosPorFase[fase as keyof typeof partidosPorFase].length}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido de la fase */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#df2531]" />
          {faseActiva}
        </h3>

        {/* Banner de partidos sin programar */}
        {partidosSinProgramar.length > 0 && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-400 font-medium text-sm">
                  {partidosSinProgramar.length} partido{partidosSinProgramar.length > 1 ? 's' : ''} sin programar
                </p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Los partidos deben tener fecha, hora y cancha asignadas antes de cargar resultados. 
                  Ve al tab <span className="font-semibold">Programación</span> para asignarlos.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {partidosPorFase[faseActiva as keyof typeof partidosPorFase]?.map((partido, index) => (
            <PartidoCard 
              key={partido.id} 
              partido={partido} 
              index={index} 
              onRegistrarResultado={() => setModalResultado({ open: true, partido })}
              onMarcadorVivo={() => setModalVivo({ open: true, partido })}
            />
          ))}
        </div>

      {/* Modales */}
      <RegistroResultadoModal
        isOpen={modalResultado.open}
        onClose={() => setModalResultado({ open: false, partido: null })}
        match={modalResultado.partido as any}
        onSuccess={() => {
          loadPartidos();
          setModalResultado({ open: false, partido: null });
        }}
      />

      <MarcadorEnVivo
        isOpen={modalVivo.open}
        onClose={() => setModalVivo({ open: false, partido: null })}
        match={modalVivo.partido as any}
        onSuccess={() => {
          loadPartidos();
          setModalVivo({ open: false, partido: null });
        }}
      />
      </div>

      {/* Vista previa del bracket (simplificada) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Vista General del Bracket</h3>
        <div className="flex items-center justify-center py-8">
          <MiniBracket fases={fasesDisponibles} faseActiva={faseActiva} />
        </div>
      </div>
    </div>
  );
}

function PartidoCard({ 
  partido, 
  index,
  onRegistrarResultado,
  onMarcadorVivo,
}: { 
  partido: Partido; 
  index: number;
  onRegistrarResultado: () => void;
  onMarcadorVivo: () => void;
}) {
  const isFinalizado = !!partido.ganador;
  const estaProgramado = !!partido.torneoCanchaId && !!partido.fechaProgramada && !!partido.horaProgramada;
  const puedeJugar = partido.inscripcion1 && partido.inscripcion2 && !partido.esBye && !isFinalizado && estaProgramado;
  const pendienteProgramacion = partido.inscripcion1 && partido.inscripcion2 && !partido.esBye && !isFinalizado && !estaProgramado;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white/[0.03] rounded-xl p-4 border ${
        isFinalizado ? 'border-green-500/20' : 'border-white/5'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">Partido {partido.orden}</span>
        {partido.esBye && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded">
            BYE
          </span>
        )}
        {isFinalizado && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded">
            Finalizado
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Pareja 1 */}
        <div className={`flex-1 flex items-center gap-3 ${partido.ganador?.id === partido.inscripcion1?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion1 ? (
            <>
              <ParejaAvatar 
                jugador1={partido.inscripcion1.jugador1}
                jugador2={partido.inscripcion1.jugador2}
                size="sm"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {partido.inscripcion1.jugador1.nombre} {partido.inscripcion1.jugador1.apellido}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {partido.inscripcion1.jugador2.nombre} {partido.inscripcion1.jugador2.apellido}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <span className="text-gray-500 text-xs">?</span>
              </div>
              <div className="text-gray-500 italic">Por definir</div>
            </div>
          )}
        </div>

        {/* Resultado */}
        <div className="text-center px-4 flex-shrink-0">
          {isFinalizado && partido.resultado ? (
            <div className="font-mono text-lg font-bold text-white">
              {partido.resultado.set1[0]}-{partido.resultado.set1[1]}
              {partido.resultado.set2 && ` | ${partido.resultado.set2[0]}-${partido.resultado.set2[1]}`}
              {partido.resultado.set3 && ` | ${partido.resultado.set3[0]}-${partido.resultado.set3[1]}`}
            </div>
          ) : (
            <div className="text-gray-500 font-bold">VS</div>
          )}
        </div>

        {/* Pareja 2 */}
        <div className={`flex-1 flex items-center justify-end gap-3 ${partido.ganador?.id === partido.inscripcion2?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion2 ? (
            <>
              <div className="text-right min-w-0">
                <div className="font-medium truncate">
                  {partido.inscripcion2.jugador1.nombre} {partido.inscripcion2.jugador1.apellido}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {partido.inscripcion2.jugador2.nombre} {partido.inscripcion2.jugador2.apellido}
                </div>
              </div>
              <ParejaAvatar 
                jugador1={partido.inscripcion2.jugador1}
                jugador2={partido.inscripcion2.jugador2}
                size="sm"
              />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-gray-500 italic">Por definir</div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <span className="text-gray-500 text-xs">?</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      {puedeJugar && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onMarcadorVivo}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            En Vivo
          </button>
          <button
            onClick={onRegistrarResultado}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Resultado
          </button>
        </div>
      )}

      {/* Pendiente de programación */}
      {pendienteProgramacion && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-amber-400/80 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Pendiente de programación</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Asigna fecha, hora y cancha en el tab Programación
          </p>
        </div>
      )}

      {/* Info adicional */}
      {(partido.fecha || partido.cancha) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
          {partido.fecha && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(partido.fecha).toLocaleDateString('es-PY')}
              {partido.hora && ` ${partido.hora}`}
            </span>
          )}
          {partido.cancha && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {partido.cancha}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function MiniBracket({ fases, faseActiva }: { fases: string[]; faseActiva: string }) {
  const fasesVisibles = FASES_ORDENADAS.filter(f => fases.includes(f));
  
  return (
    <div className="flex items-center gap-2">
      {fasesVisibles.map((fase, index) => (
        <div key={fase} className="flex items-center">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              fase === faseActiva
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-gray-400'
            }`}
          >
            {fase}
          </div>
          {index < fasesVisibles.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
