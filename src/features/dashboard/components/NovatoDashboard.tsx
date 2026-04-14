// ═══════════════════════════════════════════════════════
// COMPONENTE - Dashboard para Usuario NOVATO
// Foco: Conversión (completar perfil + primer torneo)
// ═══════════════════════════════════════════════════════

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Trophy,
  User,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';
import { DashboardData } from '../types/dashboard.types';
import { generateChecklist } from '../hooks/useUserFase';

interface NovatoDashboardProps {
  data: DashboardData;
}

export function NovatoDashboard({ data }: NovatoDashboardProps) {
  const { items: checklist, progreso } = generateChecklist(
    data.perfil,
    data.stats
  );

  const itemsPendientes = checklist.filter(i => !i.completado);
  const proximoPendiente = itemsPendientes[0];

  // Torneos que cierran pronto (< 48h)
  const torneosUrgentes = data.torneosAbiertos
    .filter(t => t.cierraEnHoras && t.cierraEnHoras <= 48)
    .slice(0, 2);

  // Torneos normales (excluyendo urgentes)
  const torneosNormales = data.torneosAbiertos
    .filter(t => !t.cierraEnHoras || t.cierraEnHoras > 48)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header personalizado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#df2531]/20 to-purple-900/20 border border-[#df2531]/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#df2531] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {data.perfil.nombre[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">
              ¡Hola, {data.perfil.nombre}! 👋
            </h1>
            <p className="text-gray-300">
              Bienvenido a FairPadel. Completa tu perfil e inscríbete en tu primer torneo.
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-[#df2531] opacity-50" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Checklist + Acción principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist de bienvenida */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#151921] border border-[#232838] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#df2531]" />
                Tu Checklist de Bienvenida
              </h2>
              <span className="text-sm text-gray-400">{progreso}% completado</span>
            </div>

            {/* Barra de progreso */}
            <div className="h-2 bg-[#232838] rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-[#df2531] to-pink-500 rounded-full"
              />
            </div>

            {/* Items del checklist */}
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    item.completado
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[#1a1f2e] border-[#232838] hover:border-[#df2531]/50'
                  }`}
                >
                  {item.completado ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${item.completado ? 'text-green-400' : 'text-white'}`}>
                      {item.titulo}
                    </p>
                    <p className="text-sm text-gray-400">{item.descripcion}</p>
                  </div>
                  {!item.completado && item.link && (
                    <Link
                      to={item.link}
                      className="px-4 py-2 bg-[#df2531] hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors shrink-0"
                    >
                      {item.id === 'primer-torneo' ? 'Inscribirme' : 'Completar'}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Torneos abiertos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#151921] border border-[#232838] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#df2531]" />
                Torneos Abiertos
              </h2>
              <Link to="/tournaments" className="text-sm text-[#df2531] hover:underline">
                Ver todos
              </Link>
            </div>

            {/* Torneos urgentes (destacados) */}
            {torneosUrgentes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  CIERRAN PRONTO
                </p>
                <div className="space-y-2">
                  {torneosUrgentes.map(torneo => (
                    <TorneoCard key={torneo.id} torneo={torneo} urgente />
                  ))}
                </div>
              </div>
            )}

            {/* Torneos normales */}
            <div className="space-y-2">
              {torneosNormales.map(torneo => (
                <TorneoCard key={torneo.id} torneo={torneo} />
              ))}
            </div>

            {data.torneosAbiertos.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay torneos abiertos en este momento</p>
                <Link
                  to="/tournaments"
                  className="inline-block mt-3 px-4 py-2 bg-[#df2531] rounded-lg text-white text-sm"
                >
                  Explorar torneos
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Columna derecha: Acciones rápidas + Info */}
        <div className="space-y-6">
          {/* Próximo paso destacado */}
          {proximoPendiente && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#df2531] to-red-600 rounded-2xl p-6 text-white"
            >
              <p className="text-sm font-medium opacity-90 mb-2">TU PRÓXIMO PASO</p>
              <h3 className="text-xl font-bold mb-2">{proximoPendiente.titulo}</h3>
              <p className="text-sm opacity-80 mb-4">{proximoPendiente.descripcion}</p>
              {proximoPendiente.link && (
                <Link
                  to={proximoPendiente.link}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#df2531] rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {proximoPendiente.id === 'primer-torneo' ? 'Ver Torneos' : 'Completar Ahora'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          )}

          {/* Accesos rápidos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#151921] border border-[#232838] rounded-2xl p-6"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">ACCESOS RÁPIDOS</h3>
            <div className="space-y-2">
              <QuickLink icon={User} label="Editar Perfil" href="/perfil" />
              <QuickLink icon={Trophy} label="Buscar Torneos" href="/tournaments" />
              <QuickLink icon={MapPin} label="Ver Sedes" href="/sedes" />
            </div>
          </motion.div>

          {/* Tips para nuevos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
          >
            <h3 className="text-sm font-medium text-blue-400 mb-2">💡 ¿Sabías que?</h3>
            <p className="text-sm text-gray-300">
              Los jugadores con foto de perfil completan sus inscripciones 3x más rápido.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes

interface TorneoCardProps {
  torneo: DashboardData['torneosAbiertos'][0];
  urgente?: boolean;
}

function TorneoCard({ torneo, urgente }: TorneoCardProps) {
  return (
    <Link
      to={`/tournaments/${torneo.slug}`}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-[#df2531]/50 ${
        urgente ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#1a1f2e] border-[#232838]'
      }`}
    >
      {torneo.flyerUrl ? (
        <img src={torneo.flyerUrl} alt="" className="w-16 h-16 rounded-lg object-cover" width="64" height="64" loading="lazy" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[#232838] flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{torneo.nombre}</h4>
        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {torneo.ciudad}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {torneo.cuposDisponibles} cupos
          </span>
        </div>
        {urgente && torneo.cierraEnHoras && (
          <p className="text-xs text-orange-400 mt-1">
            Cierra en {torneo.cierraEnHoras}h
          </p>
        )}
      </div>
      <ArrowRight className="w-5 h-5 text-gray-500" />
    </Link>
  );
}

interface QuickLinkProps {
  icon: React.ElementType;
  label: string;
  href: string;
}

function QuickLink({ icon: Icon, label, href }: QuickLinkProps) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#232838] transition-colors group"
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#df2531]" />
      <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
      <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
