import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calculator, Users, Trophy, AlertCircle, Swords, Shuffle } from 'lucide-react';
import { api } from '../../../../services/api';

interface ConfigurarBracketModalProps {
  categoria: {
    id: string;
    categoryId: string;
    category: {
      nombre: string;
    };
    inscripcionesCount: number;
    estado: string;
  };
  onClose: () => void;
  onGenerado: () => void;
}

interface BracketConfig {
  totalParejas: number;
  objetivoBracket: number;
  partidosZona: number;
  partidosRondaAjuste: number;
  eliminaciones: number;
  fases: string[];
}

export function ConfigurarBracketModal({ categoria, onClose, onGenerado }: ConfigurarBracketModalProps) {
  const [config, setConfig] = useState<BracketConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    calcularConfiguracion();
  }, []);

  const calcularConfiguracion = async () => {
    try {
      const totalParejas = categoria.inscripcionesCount;
      
      // SISTEMA PARAGUAYO - Fórmula correcta
      // 1. ZONA: floor(parejas / 2) partidos
      const partidosZona = Math.floor(totalParejas / 2);
      
      // 2. OBJETIVO: 8 (4tos) o 16 (8vos)
      const objetivoBracket = totalParejas <= 15 ? 8 : 16;
      
      // 3. RONDA AJUSTE: eliminaciones necesarias
      const eliminaciones = Math.max(0, totalParejas - objetivoBracket);
      const partidosRondaAjuste = eliminaciones;
      
      // Fases del bracket
      const fases: string[] = ['ZONA'];
      if (partidosRondaAjuste > 0) {
        fases.push('RONDA AJUSTE');
      }
      if (objetivoBracket >= 16) fases.push('OCTAVOS');
      if (objetivoBracket >= 8) fases.push('CUARTOS');
      fases.push('SEMIS', 'FINAL');
      
      setConfig({
        totalParejas,
        objetivoBracket,
        partidosZona,
        partidosRondaAjuste,
        eliminaciones,
        fases,
      });
    } catch (err) {
      setError('Error calculando configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    setGenerando(true);
    setError('');
    try {
      // Llamar al endpoint de sortear
      const { data } = await api.post(`/admin/categorias/${categoria.id}/bracket/sortear`, {
        guardar: true,
      });
      
      if (data.success) {
        onGenerado();
      } else {
        setError(data.message || 'Error generando bracket');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generando bracket');
    } finally {
      setGenerando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#151921] rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Calculando configuración...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#151921] rounded-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#df2531]" />
              Configurar Bracket
            </h2>
            <p className="text-gray-400 text-sm mt-1">{categoria.category.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {config && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  label="Total Parejas"
                  value={config.totalParejas}
                />
                <StatCard
                  icon={<Trophy className="w-4 h-4" />}
                  label="Tamaño Bracket"
                  value={config.objetivoBracket}
                />
                <StatCard
                  icon={<Swords className="w-4 h-4" />}
                  label="Partidos Zona"
                  value={config.partidosZona}
                  subtext="Todos juegan"
                />
                {config.partidosRondaAjuste > 0 ? (
                  <StatCard
                    icon={<Shuffle className="w-4 h-4" />}
                    label="Ronda Ajuste"
                    value={config.partidosRondaAjuste}
                    subtext={`${config.eliminaciones} eliminados`}
                  />
                ) : (
                  <StatCard
                    label="Sin Ajuste"
                    value="Directo"
                    subtext="Todos al bracket"
                  />
                )}
              </div>

              {/* Explicación del flujo */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">Sistema Paraguayo</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#df2531]/20 text-[#df2531] flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="text-sm text-white font-medium">Fase de Zona</p>
                      <p className="text-xs text-gray-400">{config.partidosZona} partidos. Todos juegan 1 partido.</p>
                    </div>
                  </div>
                  
                  {config.partidosRondaAjuste > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="text-sm text-white font-medium">Ronda de Ajuste</p>
                        <p className="text-xs text-gray-400">
                          {config.partidosRondaAjuste} partidos. 
                          {config.eliminaciones} parejas eliminadas (ya jugaron 2 partidos).
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${config.partidosRondaAjuste > 0 ? 'bg-blue-500/20 text-blue-500' : 'bg-[#df2531]/20 text-[#df2531]'}`}>
                      {config.partidosRondaAjuste > 0 ? '3' : '2'}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Bracket Principal</p>
                      <p className="text-xs text-gray-400">
                        {config.objetivoBracket} parejas. Eliminación directa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fases del bracket */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">Fases del Bracket</h3>
                <div className="flex flex-wrap gap-2">
                  {config.fases.filter(f => ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'].includes(f)).map(fase => (
                    <span key={fase} className="px-3 py-1 bg-[#df2531]/20 text-[#df2531] rounded-lg text-sm">
                      {fase}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                  <span className="font-medium">Resumen:</span> De {config.totalParejas} parejas, 
                  {config.eliminaciones > 0 
                    ? ` ${config.eliminaciones} serán eliminadas en ronda de ajuste (jugando 2 partidos).`
                    : ' todas pasan al bracket.'
                  } 
                  {' '}Las {config.objetivoBracket} restantes juegan el bracket de eliminación directa.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="px-6 py-2 bg-[#df2531] text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {generando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Sorteando...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" />
                Realizar Sorteo
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { 
  icon?: React.ReactNode; 
  label: string; 
  value: number | string;
  subtext?: string;
}) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>}
    </div>
  );
}
