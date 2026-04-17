// Dashboard ACTIVO/REGULAR
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, Calendar, Users, ArrowRight, Flame, Award } from "lucide-react";
import { DashboardData } from "../types/dashboard.types";

interface Props { data: DashboardData; }

export function ActivoDashboard({ data }: Props) {
  const { perfil, stats, torneosAbiertos, puntosTotales, posicionRanking, rachaActual } = data;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151921] border border-[#232838] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {perfil.fotoUrl ? (
            <img src={perfil.fotoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#df2531]" width="64" height="64" loading="lazy" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#232838] flex items-center justify-center text-2xl font-bold text-white">
              {perfil.nombre[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Hola, {perfil.nombre}!</h1>
            <p className="text-gray-400">{stats.torneosJugados} torneos jugados</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Torneos" value={stats.torneosJugados} color="text-yellow-400" />
          <StatCard icon={Target} label="Puntos" value={puntosTotales} color="text-green-400" />
          <StatCard icon={Flame} label="Racha" value={rachaActual > 0 ? rachaActual : "-"} color="text-orange-400" />
          <StatCard icon={Award} label="Ranking" value={posicionRanking ? `#${posicionRanking}` : "-"} color="text-purple-400" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {torneosAbiertos.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151921] border border-[#232838] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#df2531]" />
                Torneos Abiertos
              </h2>
              <div className="space-y-3">
                {torneosAbiertos.slice(0, 3).map(torneo => (
                  <Link key={torneo.id} to={`/t/${torneo.slug}`} className="flex items-center gap-4 p-4 bg-[#1a1f2e] rounded-xl hover:bg-[#232838] transition-colors">
                    {torneo.flyerUrl ? (
                      <img src={torneo.flyerUrl} alt="" className="w-16 h-16 rounded-lg object-cover" width="64" height="64" loading="lazy" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#232838] flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{torneo.nombre}</h4>
                      <p className="text-sm text-gray-400">{torneo.ciudad} | {torneo.cuposDisponibles} cupos</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </Link>
                ))}
              </div>
              <Link to="/torneos" className="block w-full text-center py-3 mt-4 bg-[#232838] hover:bg-[#2d3548] rounded-xl text-white transition-colors">
                Ver todos
              </Link>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#151921] border border-[#232838] rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">ACCIONES</h3>
            <div className="space-y-2">
              <QuickLink icon={Trophy} label="Buscar Torneos" href="/torneos" />
              <QuickLink icon={Calendar} label="Mis Inscripciones" href="/mis-torneos" />
              <QuickLink icon={TrendingUp} label="Rankings" href="/rankings" />
              <QuickLink icon={Users} label="Jugadores" href="/jugadores" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, href }: any) {
  return (
    <Link to={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#232838] transition-colors group">
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#df2531]" />
      <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
      <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}