import { motion } from 'framer-motion';
import {
  Check, Trophy, Users, Share2, Send, Eye, GitBranch, Flag,
  PartyPopper, Loader2,
} from 'lucide-react';
import { OverviewData } from '../../services/overviewService';

// ═══════════════════════════════════════════════════════
// ROADMAP DEL TORNEO — "Centro de mando" del organizador
// Responde de un vistazo: ¿dónde estoy? ¿qué hice? ¿qué sigue?
// Los pasos salen del estado real que ya devuelve /overview.
// ═══════════════════════════════════════════════════════

interface CTA {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  primary?: boolean;
  loading?: boolean;
}

interface Paso {
  key: string;
  titulo: string;
  sub: string;
  done: boolean;
  cta?: CTA[];
}

interface RoadmapTorneoProps {
  data: OverviewData;
  bracketPublicado: boolean;
  publicando: boolean;
  finalizando: boolean;
  copied: boolean;
  onTabChange: (tab: string) => void;
  onPublicarTorneo: () => void;
  onFinalizar: () => void;
  onCopyLink: () => void;
}

export function RoadmapTorneo({
  data,
  bracketPublicado,
  publicando,
  finalizando,
  copied,
  onTabChange,
  onPublicarTorneo,
  onFinalizar,
  onCopyLink,
}: RoadmapTorneoProps) {
  const { torneo, progreso, inscripciones } = data;

  const req = (n: string) =>
    progreso.detalle.find((r) => r.nombre === n)?.completado ?? false;

  const fixtureOk = req('fixture');
  const dispOk = req('disponibilidad');
  const inscrOk = req('inscripciones');
  const publicado = torneo.estado !== 'BORRADOR';
  const finalizado = torneo.estadoProceso === 'finalizado';
  const enFase = ['programacion', 'en_curso'].includes(torneo.estadoProceso);
  const confirmadas = inscripciones.confirmadas;

  const pasos: Paso[] = [
    {
      key: 'crear',
      titulo: 'Crear el torneo',
      sub: 'Datos, flyer y categorías',
      done: true,
    },
    {
      key: 'abrir',
      titulo: 'Abrir inscripciones',
      sub: publicado
        ? 'Tu torneo ya es público y recibe inscriptos'
        : 'Publicá el torneo para que aparezca y la gente se anote',
      done: publicado,
      cta: !publicado
        ? [{ label: 'Publicar torneo', icon: Send, onClick: onPublicarTorneo, primary: true, loading: publicando }]
        : undefined,
    },
    {
      key: 'inscriptos',
      titulo: 'Juntar inscriptos',
      sub: inscrOk
        ? `${confirmadas} parejas confirmadas — ya podés sortear`
        : `${confirmadas} confirmadas · necesitás al menos 4 para sortear`,
      done: inscrOk,
      cta: [
        { label: copied ? '¡Link copiado!' : 'Compartir link', icon: Share2, onClick: onCopyLink, primary: true },
        { label: 'Ver inscripciones', icon: Users, onClick: () => onTabChange('inscripciones') },
      ],
    },
    {
      key: 'cuadro',
      titulo: 'Armar canchas y sortear',
      sub: !fixtureOk
        ? 'Cargá las canchas, cerrá inscripciones y sorteá el cuadro'
        : !dispOk
          ? 'Falta cargar las canchas y horarios de los partidos'
          : 'Cuadro sorteado y horarios listos',
      done: fixtureOk && dispOk,
      cta: [{ label: 'Ir a Canchas y Sorteo', icon: Trophy, onClick: () => onTabChange('canchasSorteo'), primary: true }],
    },
    {
      key: 'publicar-cuadro',
      titulo: 'Publicar el cuadro',
      sub: bracketPublicado
        ? 'Los jugadores ya pueden ver el cuadro'
        : 'El cuadro está armado pero todavía no es visible para los jugadores',
      done: bracketPublicado,
      cta: [{ label: 'Revisar y publicar', icon: Eye, onClick: () => onTabChange('bracket'), primary: true }],
    },
    {
      key: 'jugar',
      titulo: 'Jugar y finalizar',
      sub: finalizado
        ? 'Torneo cerrado. ¡Gracias por organizarlo!'
        : 'Cargá los resultados; cuando termine, cerrá el torneo',
      done: finalizado,
      cta: [
        { label: 'Cargar resultados', icon: GitBranch, onClick: () => onTabChange('bracket'), primary: true },
        ...(enFase
          ? [{ label: 'Marcar terminado', icon: Flag, onClick: onFinalizar, loading: finalizando }]
          : []),
      ],
    },
  ];

  // El paso actual es el primero sin completar. -1 => todo listo.
  const currentIndex = pasos.findIndex((p) => !p.done);
  const todoListo = currentIndex === -1;

  return (
    <div className="bg-[#151921] border border-[#232838] rounded-2xl p-6">
      {/* Encabezado: progreso general */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-white">Tu torneo, paso a paso</h3>
        <span className="text-white font-bold text-lg">{progreso.general}%</span>
      </div>
      <div className="h-2.5 bg-[#0B0E14] rounded-full overflow-hidden mb-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progreso.general}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            progreso.general >= 80 ? 'bg-emerald-500' :
            progreso.general >= 50 ? 'bg-yellow-500' :
            'bg-[#df2531]'
          }`}
        />
      </div>

      {todoListo && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <PartyPopper className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-medium text-emerald-300">¡Torneo terminado!</p>
            <p className="text-sm text-emerald-400/80">Completaste todo el proceso. 🎾</p>
          </div>
        </div>
      )}

      {/* Pasos */}
      <div className="space-y-2">
        {pasos.map((paso, i) => {
          const estado = paso.done ? 'done' : i === currentIndex ? 'current' : 'pending';
          return <PasoRow key={paso.key} paso={paso} numero={i + 1} estado={estado} />;
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Fila de un paso del roadmap
// ═══════════════════════════════════════════════════════

function PasoRow({
  paso,
  numero,
  estado,
}: {
  paso: Paso;
  numero: number;
  estado: 'done' | 'current' | 'pending';
}) {
  if (estado === 'current') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-[#df2531]/60 bg-[#df2531]/10 p-4"
      >
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-[#df2531] text-white flex items-center justify-center text-sm font-bold">
            {numero}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#ff6b73] uppercase tracking-wider">Estás acá</p>
            <p className="font-medium text-white mt-0.5">{paso.titulo}</p>
            <p className="text-sm text-gray-300 mt-1">{paso.sub}</p>
            {paso.cta && (
              <div className="flex flex-wrap gap-2 mt-3">
                {paso.cta.map((c) => (
                  <CtaButton key={c.label} cta={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const done = estado === 'done';
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl">
      <span
        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-medium ${
          done
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'border border-[#2a3042] text-gray-600'
        }`}
      >
        {done ? <Check className="w-4 h-4" /> : numero}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-gray-300' : 'text-gray-500'}`}>{paso.titulo}</p>
        <p className="text-xs text-gray-600 truncate">{paso.sub}</p>
      </div>
      <span className={`text-xs shrink-0 ${done ? 'text-emerald-400' : 'text-gray-600'}`}>
        {done ? 'Listo' : 'Pendiente'}
      </span>
    </div>
  );
}

function CtaButton({ cta }: { cta: CTA }) {
  const Icon = cta.loading ? Loader2 : cta.icon;
  return (
    <button
      onClick={cta.onClick}
      disabled={cta.loading}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
        cta.primary
          ? 'bg-[#df2531] text-white hover:bg-[#c41f2a]'
          : 'bg-[#232838] text-gray-200 hover:bg-[#2a3042]'
      }`}
    >
      <Icon className={`w-4 h-4 ${cta.loading ? 'animate-spin' : ''}`} />
      {cta.label}
    </button>
  );
}
