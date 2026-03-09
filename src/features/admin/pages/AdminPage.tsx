import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Trophy, DollarSign, Settings, Building2 } from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { UserRoleManager } from '../components/UserRoleManager';
import { SedesManager } from '../components/SedesManager';
import { ModalidadesManager } from '../components/ModalidadesManager';

type AdminTab = 'roles' | 'sedes' | 'modalidades' | 'ascensos' | 'premium' | 'puntos';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('roles');

  const tabs = [
    { id: 'roles' as AdminTab, label: 'Roles', icon: Shield, color: 'bg-blue-500' },
    { id: 'sedes' as AdminTab, label: 'Sedes', icon: Building2, color: 'bg-orange-500' },
    { id: 'modalidades' as AdminTab, label: 'Modalidades', icon: Trophy, color: 'bg-pink-500' },
    { id: 'ascensos' as AdminTab, label: 'Ascensos', icon: Award, color: 'bg-green-500' },
    { id: 'premium' as AdminTab, label: 'Premium', icon: DollarSign, color: 'bg-yellow-500' },
    { id: 'puntos' as AdminTab, label: 'Puntos', icon: Trophy, color: 'bg-purple-500' },
    { id: 'torneos' as AdminTab, label: 'Torneos', icon: Settings, color: 'bg-gray-500' },
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
          <p className="text-gray-400">Gestiona usuarios, roles y configuraciones del sistema</p>
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
          {activeTab === 'ascensos' && (
            <div className="glass rounded-3xl p-12 text-center">
              <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Gestión de Ascensos</h3>
              <p className="text-gray-400">Próximamente...</p>
            </div>
          )}
          {activeTab === 'premium' && (
            <div className="glass rounded-3xl p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Configuración Premium</h3>
              <p className="text-gray-400">Próximamente...</p>
            </div>
          )}
          {activeTab === 'puntos' && (
            <div className="glass rounded-3xl p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Sistema de Puntos</h3>
              <p className="text-gray-400">Próximamente...</p>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
