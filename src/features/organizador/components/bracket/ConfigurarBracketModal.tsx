import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calculator, Users, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../../../services/api';

interface ConfigurarBracketModalProps {
  categoria: {
    id: string;
    categoryId: string;
    category: {
      nombre: string;
    };
    inscripcionesCount: number;
  };
  onClose: () => void;
  onGenerado: () => void;
}

interface BracketConfig {
  totalParejas: number;
  tamanoBracket: number;
  parejasConBye: number;
  partidosZona: number;
  parejasEnRepechaje: number;
  partidosRepechaje: number;
  ganadoresZona: number;
  ganadoresRepechaje: number;
  perdedoresDirectos: number;
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
      // Por ahora calculamos en frontend, luego vendrá del backend
      const totalParejas = categoria.inscripcionesCount;
      
      // Determinar tamaño del bracket
      const potencias = [4, 8, 16, 32, 64];
      const tamanoBracket = potencias.find(p => p >= totalParejas) || 64;
      
      // Calcular BYEs
      let parejasConBye = 0;
      let parejasQueJueganZona = totalParejas;
      
      if (totalParejas % 2 !== 0) {
        parejasConBye = 1;
        parejasQueJueganZona = totalParejas - 1;
      }
      
      const partidosZona = parejasQueJueganZona / 2;
      const ganadoresZona = partidosZona;
      const perdedoresZona = partidosZona;
      
      const lugaresRestantes = tamanoBracket - ganadoresZona - parejasConBye;
      let parejasEnRepechaje = Math.min(perdedoresZona, lugaresRestantes * 2);
      
      if (parejasEnRepechaje % 2 !== 0) parejasEnRepechaje--;
      
      const ganadoresRepechaje = parejasEnRepechaje / 2;
      const partidosRepechaje = parejasEnRepechaje / 2;
      const perdedoresDirectos = perdedoresZona - parejasEnRepechaje;
      
      const fases = ['ZONA'];
      if (parejasEnRepechaje > 0) fases.push('REPECHAJE');
      if (tamanoBracket >= 16) fases.push('OCTAVOS');
      if (tamanoBracket >= 8) fases.push('CUARTOS');
      fases.push('SEMIS', 'FINAL');
      
      setConfig({
        totalParejas,
        tamanoBracket,
        parejasConBye,
        partidosZona,
        parejasEnRepechaje,
        partidosRepechaje,
        ganadoresZona,
        ganadoresRepechaje,
        perdedoresDirectos,
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
    try {
      await api.post(`/admin/torneos/${categoria.id}/bracket/generar`, {
        totalParejas: categoria.inscripcionesCount,
      });
      onGenerado();
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
                  value={config.tamanoBracket}
                />
                <StatCard
                  label="Con BYE"
                  value={config.parejasConBye}
                  subtext="Ingresan directo"
                />
                <StatCard
                  label="En Repechaje"
                  value={config.parejasEnRepechaje}
                  subtext={`${config.ganadoresRepechaje} pasan`}
                />
              </div>

              {/* Distribución */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">Distribución</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Fase de Zona</span>
                    <span className="text-white">{config.partidosZona} partidos</span>
                  </div>
                  {config.partidosRepechaje > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Repechaje</span>
                      <span className="text-white">{config.partidosRepechaje} partidos</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Bracket Principal:</span>
                    <div className="flex gap-1">
                      {config.fases.filter(f => ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'].includes(f)).map(fase => (
                        <span key={fase} className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] rounded text-xs">
                          {fase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flujo visual */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">Flujo del Torneo</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-3 py-1.5 bg-white/5 rounded-lg text-gray-300">
                    {config.totalParejas} inscritos
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-1.5 bg-white/5 rounded-lg text-gray-300">
                    {config.partidosZona} en zona
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-1.5 bg-[#df2531]/20 rounded-lg text-[#df2531] font-medium">
                    {config.tamanoBracket} en bracket
                  </div>
                </div>
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
                Generando...
              </>
            ) : (
              <>
                Generar Bracket
                <ArrowRight className="w-4 h-4" />
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
