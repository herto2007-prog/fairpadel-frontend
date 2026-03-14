import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, AlertTriangle, CheckCircle2, 
  Calculator, Save, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
  totalParejas: number;
}

interface Prediccion {
  totalPartidos: number;
  horasNecesarias: number;
  slotsDisponibles: number;
  deficit: number;
  suficiente: boolean;
  sugerencias: string[];
}

interface PartidoAsignado {
  partidoId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  torneoCanchaId: string;
  sedeNombre: string;
  canchaNombre: string;
  fase: string;
  categoriaNombre: string;
  pareja1?: string;
  pareja2?: string;
}

interface DistribucionDia {
  fecha: string;
  diaSemana: string;
  horarioInicio: string;
  horarioFin: string;
  slotsDisponibles: number;
  slotsAsignados: number;
  partidos: PartidoAsignado[];
}

interface Conflicto {
  tipo: 'MISMA_PAREJA' | 'CANCHA_OCUPADA' | 'SIN_DISPONIBILIDAD';
  partidoId: string;
  mensaje: string;
}

interface ResultadoProgramacion {
  prediccion: Prediccion;
  distribucion: DistribucionDia[];
  conflictos: Conflicto[];
}

interface ProgramacionManagerProps {
  tournamentId: string;
  categoriasSorteadas: Categoria[];
}

export function ProgramacionManager({ tournamentId, categoriasSorteadas }: ProgramacionManagerProps) {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [calculando, setCalculando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProgramacion | null>(null);
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());

  const calcularProgramacion = async () => {
    if (categoriasSorteadas.length === 0) {
      showError('Sin categorías', 'No hay categorías sorteadas para programar');
      return;
    }

    setCalculando(true);
    try {
      const { data } = await api.post(`/programacion/torneos/${tournamentId}/calcular`, {
        categoriasSorteadas: categoriasSorteadas.map(c => c.id),
      });
      
      setResultado(data);
      setDiasExpandidos(new Set(data.distribucion.map((d: DistribucionDia) => d.fecha)));
      showSuccess('Programación calculada', `Se calcularon ${data.distribucion.length} días de programación`);
    } catch (error: any) {
      console.error('Error calculando programación:', error);
      showError('Error', error.response?.data?.message || 'Error calculando programación');
    } finally {
      setCalculando(false);
    }
  };

  const aplicarProgramacion = async () => {
    if (!resultado || resultado.distribucion.length === 0) return;

    const confirmed = await confirm({
      title: 'Aplicar programación',
      message: '¿Aplicar esta programación? Los partidos serán asignados a las fechas/horas/canchas indicadas. Esta acción no se puede deshacer.',
      confirmText: 'Aplicar',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;

    setAplicando(true);
    try {
      const asignaciones = resultado.distribucion.flatMap(d => d.partidos);
      await api.post(`/programacion/torneos/${tournamentId}/aplicar`, {
        asignaciones,
      });
      showSuccess('Programación aplicada', 'Los partidos fueron asignados exitosamente');
    } catch (error: any) {
      console.error('Error aplicando programación:', error);
      showError('Error', error.response?.data?.message || 'Error aplicando programación');
    } finally {
      setAplicando(false);
    }
  };

  const toggleDia = (fecha: string) => {
    const nuevos = new Set(diasExpandidos);
    if (nuevos.has(fecha)) {
      nuevos.delete(fecha);
    } else {
      nuevos.add(fecha);
    }
    setDiasExpandidos(nuevos);
  };

  const getColorFase = (fase: string) => {
    switch (fase) {
      case 'ZONA': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REPECHAJE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'OCTAVOS': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CUARTOS': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'SEMIS': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'FINAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (categoriasSorteadas.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Sin categorías sorteadas</h3>
        <p className="text-sm text-neutral-500">
          Primero debes sortear las categorías en la pestaña "Fixture" para poder programar los partidos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-light text-white tracking-tight">Programación</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {categoriasSorteadas.length} categoría(s) sorteada(s) • {categoriasSorteadas.reduce((acc, c) => acc + c.totalParejas, 0)} parejas totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!resultado ? (
            <button
              onClick={calcularProgramacion}
              disabled={calculando}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {calculando ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calcular Automáticamente
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={calcularProgramacion}
                disabled={calculando}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                Recalcular
              </button>
              <button
                onClick={aplicarProgramacion}
                disabled={aplicando || (resultado?.conflictos?.length > 0)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {aplicando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Aplicar Programación
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sin cálculo aún */}
      {!resultado && !calculando && (
        <div className="bg-white/[0.02] rounded-xl p-8 text-center">
          <Calculator className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Programación automática</h3>
          <p className="text-sm text-neutral-500 mb-4 max-w-md mx-auto">
            El sistema calculará la distribución óptima de partidos considerando:
            disponibilidad de canchas, horarios y descansos entre partidos.
          </p>
          <button
            onClick={calcularProgramacion}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors mx-auto"
          >
            <Calculator className="w-4 h-4" />
            Calcular Ahora
          </button>
        </div>
      )}

      {/* Calculando */}
      {calculando && (
        <div className="bg-white/[0.02] rounded-xl p-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-neutral-400">Calculando distribución óptima...</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && !calculando && (
        <div className="space-y-6">
          {/* Predicción de Recursos */}
          <div className={`rounded-xl p-4 border ${
            resultado.prediccion.suficiente 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {resultado.prediccion.suficiente ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <h3 className="text-sm font-medium text-white">
                Predicción de Recursos
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-light text-white">{resultado.prediccion.totalPartidos}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Partidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">{Math.round(resultado.prediccion.horasNecesarias)}h</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Necesarias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">{Math.round(resultado.prediccion.slotsDisponibles)}h</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Disponibles</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-light ${resultado.prediccion.deficit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {resultado.prediccion.deficit > 0 ? `-${Math.round(resultado.prediccion.deficit)}h` : 'OK'}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Déficit</div>
              </div>
            </div>

            {resultado.prediccion.sugerencias.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Sugerencias:</p>
                {resultado.prediccion.sugerencias.map((sugerencia, idx) => (
                  <p key={idx} className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {sugerencia}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Conflictos */}
          {resultado.conflictos.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Conflictos detectados ({resultado.conflictos.length})
              </h3>
              <div className="space-y-1">
                {resultado.conflictos.map((conflicto, idx) => (
                  <p key={idx} className="text-xs text-red-300">
                    • {conflicto.mensaje}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Distribución por Día */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Distribución por Día
            </h3>

            {resultado.distribucion.length === 0 ? (
              <p className="text-sm text-neutral-500">No se pudo distribuir los partidos en los días disponibles.</p>
            ) : (
              resultado.distribucion.map((dia) => (
                <motion.div
                  key={dia.fecha}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Header del día */}
                  <button
                    onClick={() => toggleDia(dia.fecha)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">
                          {dia.diaSemana}, {new Date(dia.fecha).toLocaleDateString('es-PY')}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {dia.horarioInicio} - {dia.horarioFin} • {dia.slotsAsignados} partidos
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">
                          {Math.round((dia.slotsAsignados / dia.slotsDisponibles) * 100)}% ocupado
                        </div>
                      </div>
                      {diasExpandidos.has(dia.fecha) ? (
                        <ChevronUp className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {/* Partidos del día */}
                  <AnimatePresence>
                    {diasExpandidos.has(dia.fecha) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-2">
                          {dia.partidos.map((partido) => (
                            <div
                              key={partido.partidoId}
                              className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-lg hover:bg-white/[0.05] transition-colors"
                            >
                              {/* Hora */}
                              <div className="text-center min-w-[80px]">
                                <div className="text-sm font-medium text-white">{partido.horaInicio}</div>
                                <div className="text-xs text-neutral-600">{partido.horaFin}</div>
                              </div>

                              {/* Separador */}
                              <div className="w-px h-8 bg-white/10" />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
                                    {partido.fase}
                                  </span>
                                  <span className="text-xs text-neutral-500">{partido.categoriaNombre}</span>
                                </div>
                                <div className="text-sm text-white truncate">
                                  {partido.pareja1 || 'Por definir'} vs {partido.pareja2 || 'Por definir'}
                                </div>
                              </div>

                              {/* Cancha */}
                              <div className="text-right min-w-[120px]">
                                <div className="text-xs text-neutral-400 flex items-center gap-1 justify-end">
                                  <MapPin className="w-3 h-3" />
                                  {partido.canchaNombre}
                                </div>
                                <div className="text-[10px] text-neutral-600">{partido.sedeNombre}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
