import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Play, Edit3, ChevronRight } from 'lucide-react';
import { api } from '../../../../services/api';
import { RegistroResultadoModal, MarcadorEnVivo } from '../resultados';

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
    jugador1: { nombre: string; apellido: string };
    jugador2: { nombre: string; apellido: string };
  };
  inscripcion2?: {
    id: string;
    jugador1: { nombre: string; apellido: string };
    jugador2: { nombre: string; apellido: string };
  };
  ganador?: {
    id: string;
    jugador1: { nombre: string; apellido: string };
    jugador2: { nombre: string; apellido: string };
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
  const puedeJugar = partido.inscripcion1 && partido.inscripcion2 && !partido.esBye && !isFinalizado;
  
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
        <div className={`flex-1 ${partido.ganador?.id === partido.inscripcion1?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion1 ? (
            <>
              <div className="font-medium">
                {partido.inscripcion1.jugador1.nombre} {partido.inscripcion1.jugador1.apellido}
              </div>
              <div className="text-sm text-gray-400">
                {partido.inscripcion1.jugador2.nombre} {partido.inscripcion1.jugador2.apellido}
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">Por definir</div>
          )}
        </div>

        {/* Resultado */}
        <div className="text-center px-4">
          {isFinalizado && partido.resultado ? (
            <div className="font-mono text-lg font-bold text-white">
              {partido.resultado.set1[0]}-{partido.resultado.set1[1]}
              {partido.resultado.set2 && ` | ${partido.resultado.set2[0]}-${partido.resultado.set2[1]}`}
            </div>
          ) : (
            <div className="text-gray-500">VS</div>
          )}
        </div>

        {/* Pareja 2 */}
        <div className={`flex-1 text-right ${partido.ganador?.id === partido.inscripcion2?.id ? 'text-green-400' : 'text-white'}`}>
          {partido.inscripcion2 ? (
            <>
              <div className="font-medium">
                {partido.inscripcion2.jugador1.nombre} {partido.inscripcion2.jugador1.apellido}
              </div>
              <div className="text-sm text-gray-400">
                {partido.inscripcion2.jugador2.nombre} {partido.inscripcion2.jugador2.apellido}
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">Por definir</div>
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
  const fasesOrdenadas = ['ZONA', 'REPECHAJE', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];
  const fasesVisibles = fasesOrdenadas.filter(f => fases.includes(f));
  
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
