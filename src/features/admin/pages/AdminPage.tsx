import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Building2, LayoutDashboard, Settings, Trophy, Route, TrendingUp, User, Crown, CreditCard, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { UserRoleManager } from '../components/UserRoleManager';
import { SedesManager } from '../components/SedesManager';
import { ModalidadesManager } from '../components/ModalidadesManager';
import { FairpadelPanel } from '../components/FairpadelPanel';
import { TorneosPendientesManager } from '../components/TorneosPendientesManager';
import { CircuitosManager } from '../components/CircuitosManager';
import { AscensosManager } from '../components/AscensosManager';
import { SedesDuenosManager } from '../components/SedesDuenosManager';
import { SuscripcionesManager } from '../components/SuscripcionesManager';
import { useNoIndex } from '../../../hooks/useNoIndex';

type AdminTab = 'roles' | 'sedes' | 'modalidades' | 'fairpadel' | 'torneos' | 'circuitos' | 'ascensos' | 'duenos' | 'suscripciones' | 'whatsapp';

export function AdminPage() {
  useNoIndex();
  const [activeTab, setActiveTab] = useState<AdminTab>('fairpadel');
  const navigate = useNavigate();

  const tabs = [
    { id: 'fairpadel' as AdminTab, label: 'FairPadel', icon: LayoutDashboard, color: 'bg-emerald-500' },
    { id: 'whatsapp' as AdminTab, label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500' },
    { id: 'torneos' as AdminTab, label: 'Torneos', icon: Trophy, color: 'bg-red-500' },
    { id: 'circuitos' as AdminTab, label: 'Circuitos', icon: Route, color: 'bg-purple-500' },
    { id: 'ascensos' as AdminTab, label: 'Ascensos', icon: TrendingUp, color: 'bg-amber-500' },
    { id: 'suscripciones' as AdminTab, label: 'Suscripciones', icon: CreditCard, color: 'bg-cyan-500' },
    { id: 'sedes' as AdminTab, label: 'Sedes', icon: Building2, color: 'bg-orange-500' },
    { id: 'modalidades' as AdminTab, label: 'Modalidades', icon: Settings, color: 'bg-pink-500' },
    { id: 'duenos' as AdminTab, label: 'Dueños', icon: Crown, color: 'bg-amber-500' },
    { id: 'roles' as AdminTab, label: 'Usuarios', icon: Shield, color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <BackgroundEffects variant="subtle" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-gray-400">Gestiona torneos, sedes y configuraciones del sistema</p>
          </div>
          <a
            href="/perfil-mockup"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all"
          >
            <User className="w-4 h-4" />
            Ver Mockup Perfil
          </a>
        </motion.div>

        {/* Botón WhatsApp destacado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/admin/whatsapp')}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all w-full sm:w-auto"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </div>
            <div className="text-left">
              <div className="font-semibold">WhatsApp Business</div>
              <div className="text-sm text-green-300/70">Gestionar conversaciones y leads</div>
            </div>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'whatsapp') {
                    navigate('/admin/whatsapp');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? `${tab.color} text-white shadow-lg`
                    : 'bg-[#151921] text-gray-400 hover:text-white hover:bg-[#232838]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'roles' && <UserRoleManager />}
          {activeTab === 'sedes' && <SedesManager />}
          {activeTab === 'modalidades' && <ModalidadesManager />}
          {activeTab === 'fairpadel' && <FairpadelPanel />}
          {activeTab === 'torneos' && <TorneosPendientesManager />}
          {activeTab === 'circuitos' && <CircuitosManager />}
          {activeTab === 'ascensos' && <AscensosManager />}
          {activeTab === 'duenos' && <SedesDuenosManager />}
          {activeTab === 'suscripciones' && <SuscripcionesManager />}
        </motion.div>
      </div>
    </div>
  );
}
