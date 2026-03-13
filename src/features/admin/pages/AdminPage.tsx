import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Building2, LayoutDashboard, Settings, Trophy, Route, TrendingUp } from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { UserRoleManager } from '../components/UserRoleManager';
import { SedesManager } from '../components/SedesManager';
import { ModalidadesManager } from '../components/ModalidadesManager';
import { FairpadelPanel } from '../components/FairpadelPanel';
import { TorneosPendientesManager } from '../components/TorneosPendientesManager';
import { CircuitosManager } from '../components/CircuitosManager';
import { AscensosManager } from '../components/AscensosManager';

type AdminTab = 'roles' | 'sedes' | 'modalidades' | 'fairpadel' | 'torneos' | 'circuitos' | 'ascensos';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('fairpadel');

  const tabs = [
    { id: 'fairpadel' as AdminTab, label: 'FairPadel', icon: LayoutDashboard, color: 'bg-emerald-500' },
    { id: 'torneos' as AdminTab, label: 'Torneos', icon: Trophy, color: 'bg-red-500' },
    { id: 'circuitos' as AdminTab, label: 'Circuitos', icon: Route, color: 'bg-purple-500' },
    { id: 'ascensos' as AdminTab, label: 'Ascensos', icon: TrendingUp, color: 'bg-amber-500' },
    { id: 'sedes' as AdminTab, label: 'Sedes', icon: Building2, color: 'bg-orange-500' },
    { id: 'modalidades' as AdminTab, label: 'Modalidades', icon: Settings, color: 'bg-pink-500' },
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Panel de Administración</h1>
          <p className="text-gray-400">Gestiona torneos, sedes y configuraciones del sistema</p>
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
                onClick={() => setActiveTab(tab.id)}
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
        </motion.div>
      </div>
    </div>
  );
}
