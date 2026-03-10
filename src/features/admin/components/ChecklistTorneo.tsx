import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Package, 
  Trophy, 
  Building2, 
  GlassWater,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calculator
} from 'lucide-react';
import { torneoV2Service, ChecklistItem, ChecklistProgress } from '../../../services/torneoV2Service';
import { formatDatePY } from '../../../utils/date';

interface ChecklistTorneoProps {
  tournamentId: string;
  readOnly?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  PELOTAS: Package,
  AUSPICIANTES: Trophy,
  PREMIOS: Trophy,
  INFRAESTRUCTURA: Building2,
  BEBIDAS: GlassWater,
  OTRO: AlertCircle,
};

const colorMap: Record<string, string> = {
  PELOTAS: 'bg-yellow-500',
  AUSPICIANTES: 'bg-purple-500',
  PREMIOS: 'bg-amber-500',
  INFRAESTRUCTURA: 'bg-blue-500',
  BEBIDAS: 'bg-cyan-500',
  OTRO: 'bg-gray-500',
};

export function ChecklistTorneo({ tournamentId, readOnly = false }: ChecklistTorneoProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progreso, setProgreso] = useState<ChecklistProgress>({ total: 0, completados: 0, porcentaje: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadChecklist();
  }, [tournamentId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const data = await torneoV2Service.getChecklist(tournamentId);
      setItems(data.items);
      setProgreso(data.progreso);
    } catch (error) {
      console.error('Error cargando checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletar = async (item: ChecklistItem) => {
    if (readOnly || saving === item.id) return;

    try {
      setSaving(item.id);
      await torneoV2Service.completarItem(tournamentId, item.id, {
        notas: item.notas,
        valorReal: item.valorReal,
      });
      await loadChecklist();
    } catch (error) {
      console.error('Error completando item:', error);
    } finally {
      setSaving(null);
    }
  };

  const setRecordatorio = async (itemId: string, fecha: string) => {
    try {
      await torneoV2Service.configurarRecordatorio(tournamentId, itemId, fecha);
      await loadChecklist();
    } catch (error) {
      console.error('Error configurando recordatorio:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            Progreso de preparación
          </span>
          <span className="text-sm font-bold text-emerald-400">
            {progreso.porcentaje}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progreso.porcentaje}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {progreso.completados} de {progreso.total} tareas completadas
        </p>
      </div>

      {/* Lista de items */}
      <div className="space-y-2">
        <AnimatePresence>
          {items.map((item) => {
            const Icon = iconMap[item.categoria] || AlertCircle;
            const colorClass = colorMap[item.categoria] || 'bg-gray-500';
            const isExpanded = expandedItem === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`bg-slate-800 rounded-xl border transition-colors ${
                  item.completado 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Header del item */}
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => !readOnly && setExpandedItem(isExpanded ? null : item.id)}
                >
                  {/* Checkbox o icono */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletar(item);
                    }}
                    disabled={readOnly || saving === item.id}
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      item.completado 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {saving === item.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : item.completado ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Icono de categoría */}
                  <div className={`w-10 h-10 rounded-lg ${colorClass} bg-opacity-20 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                  </div>

                  {/* Título y descripción */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      item.completado ? 'text-slate-400 line-through' : 'text-white'
                    }`}>
                      {item.titulo}
                    </h4>
                    {item.descripcion && (
                      <p className="text-xs text-slate-500 truncate">
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Badge de cálculo automático */}
                  {item.valorCalculado !== null && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <Calculator className="w-3 h-3" />
                      <span>Auto</span>
                    </div>
                  )}

                  {/* Flecha expandir */}
                  {!readOnly && (
                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                {/* Detalles expandibles */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700 overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Valor calculado */}
                        {item.valorCalculado !== null && (
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <label className="text-xs text-slate-500 mb-1 block">
                              Cantidad calculada (auto)
                            </label>
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">
                                {item.valorCalculado} unidades
                              </span>
                            </div>
                            <input
                              type="number"
                              placeholder="Ajustar cantidad real..."
                              defaultValue={item.valorReal || item.valorCalculado}
                              onChange={(e) => {
                                item.valorReal = parseInt(e.target.value);
                              }}
                              className="mt-2 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Notas */}
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">
                            Notas
                          </label>
                          <textarea
                            placeholder="Agregar notas..."
                            defaultValue={item.notas || ''}
                            onChange={(e) => {
                              item.notas = e.target.value;
                            }}
                            rows={2}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none resize-none"
                          />
                        </div>

                        {/* Recordatorio */}
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 block">
                              Recordatorio
                            </label>
                            {item.fechaRecordatorio ? (
                              <span className="text-sm text-emerald-400">
                                {formatDatePY(item.fechaRecordatorio)}
                                {item.recordatorioEnviado && ' (enviado)'}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-600">Sin recordatorio</span>
                            )}
                          </div>
                          <input
                            type="datetime-local"
                            onChange={(e) => {
                              if (e.target.value) {
                                setRecordatorio(item.id, e.target.value);
                              }
                            }}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Botón guardar */}
                        <button
                          onClick={() => toggleCompletar(item)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                          {item.completado ? 'Guardar cambios' : 'Marcar como completado'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mensaje si no hay items */}
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay items en el checklist</p>
        </div>
      )}
    </div>
  );
}
