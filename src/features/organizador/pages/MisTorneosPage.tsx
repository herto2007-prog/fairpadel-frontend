import { motion } from 'framer-motion';
import { Plus, Trophy, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { TorneosManager } from '../components/TorneosManager';

export function MisTorneosPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Header */}
      <div className="bg-[#151921] border-b border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Mis Torneos</h1>
              <p className="text-gray-400 mt-1">
                Gestiona tus torneos como organizador
                {user?.roles?.includes('admin') && (
                  <span className="ml-2 text-xs bg-[#df2531] px-2 py-0.5 rounded text-white">
                    Admin Mode
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <TorneosManager />
      </div>
    </div>
  );
}

// Componente EmptyState para usar en el futuro si se necesita
export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-24 h-24 bg-[#232838] rounded-full flex items-center justify-center mb-6">
        <Trophy className="w-12 h-12 text-gray-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No tienes torneos creados</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">
        Como organizador, puedes crear torneos y gestionar todo el proceso: 
        inscripciones, checklists, fixture y más.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-8 py-4 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#df2531]/20"
      >
        <Plus className="w-5 h-5" />
        Crear Mi Primer Torneo
      </button>
      
      <div className="mt-12 flex items-start gap-3 max-w-lg bg-[#151921] rounded-xl p-4 border border-[#232838]">
        <AlertCircle className="w-5 h-5 text-[#df2531] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">
          <strong className="text-white">¿Necesitas ayuda?</strong>{' '}
          Desde FairPadel te acompañamos en todo el proceso de organización de tu torneo.
          La plataforma te guiará paso a paso.
        </p>
      </div>
    </motion.div>
  );
}
