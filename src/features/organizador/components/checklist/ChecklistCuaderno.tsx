import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Check, Clock, Bell, X, Edit3
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  completado: boolean;
  fechaRecordatorio?: string;
  categoria: string; // tab al que pertenece
  orden: number;
}

interface Tab {
  id: string;
  nombre: string;
  color: string;
}

interface ChecklistCuadernoProps {
  tournamentId: string;
}

// ═══════════════════════════════════════════════════════════
// TAREAS PREDETERMINADAS SUGERIDAS
// ═══════════════════════════════════════════════════════════
const TAREAS_SUGERIDAS: Record<string, string[]> = {
  'General': [
    'Confirmar sede y canchas disponibles',
    'Definir fecha límite de inscripción',
    'Publicar torneo en redes sociales',
    'Preparar banner/flyer del torneo',
    'Coordinar con jueces de mesa',
  ],
  'Logística': [
    'Comprar pelotas de pádel',
    'Preparar agua/frutas para jugadores',
    'Revisar iluminación de canchas',
    'Preparar sillas/bancos para espectadores',
    'Confirmar servicio de limpieza',
  ],
  'Premios': [
    'Definir premios para campeones',
    'Comprar trofeos/medallas',
    'Preparar sorteos para participantes',
    'Coordinar auspiciantes',
  ],
  'Día del Torneo': [
    'Llegar 1 hora antes para preparar',
    'Revisar inscripciones pendientes',
    'Preparar planilla de resultados',
    'Tener lista de contactos de emergencia',
  ],
};

// Colores pastel para los tabs (estilo cuaderno)
const TAB_COLORS = [
  { bg: '#FFE4E1', border: '#FFB6C1', text: '#8B4513' }, // Rosa
  { bg: '#E0F2F1', border: '#80CBC4', text: '#00695C' }, // Verde menta
  { bg: '#FFF3E0', border: '#FFCC80', text: '#E65100' }, // Naranja
  { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' }, // Azul
  { bg: '#F3E5F5', border: '#CE93D8', text: '#7B1FA2' }, // Púrpura
  { bg: '#FFF8E1', border: '#FFE082', text: '#F57F17' }, // Amarillo
  { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' }, // Verde
  { bg: '#ECEFF1', border: '#B0BEC5', text: '#455A64' }, // Gris
  { bg: '#FBE9E7', border: '#FFAB91', text: '#BF360C' }, // Coral
  { bg: '#E1F5FE', border: '#81D4FA', text: '#0277BD' }, // Celeste
];

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function ChecklistCuaderno({ tournamentId }: ChecklistCuadernoProps) {
  const { showError, showInfo } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'general', nombre: 'General', color: '0' },
    { id: 'logistica', nombre: 'Logística', color: '1' },
  ]);
  const [activeTab, setActiveTab] = useState('general');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [editandoTab, setEditandoTab] = useState<string | null>(null);
  const [nombreTabEdit, setNombreTabEdit] = useState('');

  // Cargar tareas del torneo
  useEffect(() => {
    loadTareas();
  }, [tournamentId]);

  const loadTareas = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/checklist`);
      console.log('[Checklist] Datos recibidos:', data);
      
      if (data.success && Array.isArray(data.items)) {
        const mappedTareas = data.items.map((item: any, idx: number) => ({
          id: item.id || `temp-${idx}`,
          titulo: item.titulo || 'Sin título',
          descripcion: item.descripcion || '',
          completado: !!item.completado,
          fechaRecordatorio: item.fechaRecordatorio || null,
          categoria: item.categoria || 'general',
          orden: typeof item.orden === 'number' ? item.orden : idx,
        }));
        console.log('[Checklist] Tareas mapeadas:', mappedTareas);
        setTareas(mappedTareas);
      } else {
        console.log('[Checklist] No hay items o success false');
        setTareas([]);
      }
    } catch (error) {
      console.error('[Checklist] Error cargando:', error);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva tarea
  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) return;

    try {
      // Por ahora simulamos, luego conectamos al backend
      const nueva: Tarea = {
        id: Date.now().toString(),
        titulo: nuevaTarea,
        completado: false,
        categoria: activeTab,
        orden: tareas.filter(t => t.categoria === activeTab).length,
      };
      setTareas([...tareas, nueva]);
      setNuevaTarea('');
    } catch (error) {
      console.error('Error agregando tarea:', error);
    }
  };

  // Toggle completado
  const toggleCompletado = async (tareaId: string, completado: boolean) => {
    try {
      await api.put(`/admin/torneos/${tournamentId}/checklist/${tareaId}`, {
        completado: !completado,
      });
      setTareas(tareas.map(t => 
        t.id === tareaId ? { ...t, completado: !completado } : t
      ));
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  // Eliminar tarea
  const eliminarTarea = async (tareaId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar tarea',
      message: '¿Estás seguro de eliminar esta tarea?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    try {
      setTareas(tareas.filter(t => t.id !== tareaId));
    } catch (error) {
      showError('Error', 'No se pudo eliminar la tarea');
    }
  };

  // Agregar tarea sugerida
  const agregarSugerencia = (titulo: string) => {
    const nueva: Tarea = {
      id: Date.now().toString(),
      titulo,
      completado: false,
      categoria: activeTab,
      orden: tareas.filter(t => t.categoria === activeTab).length,
    };
    setTareas([...tareas, nueva]);
    setShowSugerencias(false);
  };

  // Agregar nuevo tab
  const agregarTab = () => {
    if (tabs.length >= 10) {
      showInfo('Límite alcanzado', 'Máximo 10 tabs permitidos');
      return;
    }
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      nombre: `Nueva ${tabs.length + 1}`,
      color: (tabs.length % TAB_COLORS.length).toString(),
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  // Eliminar tab
  const eliminarTab = async (tabId: string) => {
    if (tabs.length <= 1) {
      showInfo('Acción no permitida', 'Debes tener al menos una sección');
      return;
    }
    const confirmed = await confirm({
      title: 'Eliminar sección',
      message: '¿Eliminar esta sección y todas sus tareas? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    setTabs(tabs.filter(t => t.id !== tabId));
    setTareas(tareas.filter(t => t.categoria !== tabId));
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id);
    }
  };

  // Editar nombre del tab
  const guardarNombreTab = (tabId: string) => {
    if (!nombreTabEdit.trim()) {
      setEditandoTab(null);
      return;
    }
    setTabs(tabs.map(t => 
      t.id === tabId ? { ...t, nombre: nombreTabEdit.trim() } : t
    ));
    setEditandoTab(null);
    setNombreTabEdit('');
  };

  // Tareas del tab activo
  const tareasActivas = tareas
    .filter(t => t.categoria === activeTab)
    .sort((a, b) => a.orden - b.orden);

  const tareasCompletadas = tareasActivas.filter(t => t.completado);
  const tareasPendientes = tareasActivas.filter(t => !t.completado);

  // Color del tab activo - función segura
  const getColorScheme = (colorIndex: string | number) => {
    const index = parseInt(colorIndex as string, 10);
    if (isNaN(index)) return TAB_COLORS[0];
    return TAB_COLORS[index % TAB_COLORS.length];
  };
  
  const tabActivo = tabs.find(t => t.id === activeTab);
  const colorScheme = tabActivo ? getColorScheme(tabActivo.color) : TAB_COLORS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-amber-300/30 border-t-amber-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar - Tabs del Cuaderno */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="bg-[#1a1f2e] rounded-2xl p-4 border border-[#2a3040]">
          <h3 className="text-amber-500 font-handwriting text-lg mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Secciones
          </h3>
          
          <div className="space-y-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              const colors = getColorScheme(tab.color);
              
              return (
                <motion.div
                  key={tab.id}
                  layout
                  className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all ${
                    isActive ? 'ring-2 ring-white/20' : ''
                  }`}
                  style={{ backgroundColor: colors.bg }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div 
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ borderLeft: `4px solid ${colors.border}` }}
                  >
                    {editandoTab === tab.id ? (
                      <input
                        type="text"
                        value={nombreTabEdit}
                        onChange={(e) => setNombreTabEdit(e.target.value)}
                        onBlur={() => guardarNombreTab(tab.id)}
                        onKeyDown={(e) => e.key === 'Enter' && guardarNombreTab(tab.id)}
                        autoFocus
                        className="w-full bg-transparent text-sm font-handwriting font-medium outline-none"
                        style={{ color: colors.text }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span 
                          className="text-sm font-handwriting font-medium truncate pr-2"
                          style={{ color: colors.text }}
                        >
                          {tab.nombre}
                        </span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditandoTab(tab.id);
                              setNombreTabEdit(tab.nombre);
                            }}
                            className="p-1 hover:bg-black/10 rounded"
                          >
                            <Edit3 className="w-3 h-3" style={{ color: colors.text }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarTab(tab.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded"
                          >
                            <X className="w-3 h-3" style={{ color: colors.text }} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Indicador de tareas pendientes */}
                  {(() => {
                    const pendientes = tareas.filter(t => t.categoria === tab.id && !t.completado).length;
                    return pendientes > 0 ? (
                      <div 
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: colors.border, color: 'white' }}
                      >
                        {pendientes}
                      </div>
                    ) : null;
                  })()}
                </motion.div>
              );
            })}
          </div>

          {/* Botón agregar tab */}
          {tabs.length < 10 && (
            <button
              onClick={agregarTab}
              className="mt-4 w-full py-3 border-2 border-dashed border-[#3a4050] hover:border-amber-500/50 rounded-xl text-gray-500 hover:text-amber-500 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva sección ({tabs.length}/10)
            </button>
          )}
        </div>
      </div>

      {/* Contenido del Cuaderno */}
      <div className="flex-1">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative min-h-[600px] rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            backgroundColor: colorScheme.bg,
            backgroundImage: `
              linear-gradient(${colorScheme.border}15 1px, transparent 1px),
              linear-gradient(90deg, ${colorScheme.border}15 1px, transparent 1px)
            `,
            backgroundSize: '100% 32px, 32px 100%',
          }}
        >
          {/* Hoja del cuaderno */}
          <div className="p-8">
            {/* Header de la página */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2" style={{ borderColor: colorScheme.border }}>
              <div>
                <h2 
                  className="text-3xl font-handwriting font-bold tracking-wide"
                  style={{ color: colorScheme.text }}
                >
                  {tabActivo?.nombre}
                </h2>
                <p className="text-sm mt-1 opacity-60" style={{ color: colorScheme.text }}>
                  {tareasCompletadas.length} de {tareasActivas.length} tareas completadas
                </p>
              </div>
              
              <button
                onClick={() => setShowSugerencias(!showSugerencias)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: colorScheme.border,
                  color: 'white'
                }}
              >
                <Bell className="w-4 h-4" />
                Sugerencias
              </button>
            </div>

            {/* Sugerencias */}
            <AnimatePresence>
              {showSugerencias && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-white/50 border-2"
                  style={{ borderColor: colorScheme.border }}
                >
                  <h4 className="text-sm font-handwriting font-bold mb-3" style={{ color: colorScheme.text }}>
                    Tareas sugeridas para esta sección:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(TAREAS_SUGERIDAS[tabActivo?.nombre as keyof typeof TAREAS_SUGERIDAS] || TAREAS_SUGERIDAS['General'])?.map((sugerencia, idx) => (
                      <button
                        key={idx}
                        onClick={() => agregarSugerencia(sugerencia)}
                        className="px-3 py-2 rounded-lg text-sm font-handwriting border-2 hover:scale-105 transition-transform"
                        style={{ 
                          borderColor: colorScheme.border,
                          color: colorScheme.text,
                          backgroundColor: 'white'
                        }}
                      >
                        + {sugerencia}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input nueva tarea */}
            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && agregarTarea()}
                  placeholder="Escribe una nueva tarea..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 bg-white/80 font-handwriting text-lg outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: colorScheme.border,
                    color: colorScheme.text,
                    boxShadow: `0 2px 0 ${colorScheme.border}40`
                  }}
                />
                <button
                  onClick={agregarTarea}
                  disabled={!nuevaTarea.trim()}
                  className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 hover:scale-105"
                  style={{ 
                    backgroundColor: colorScheme.border,
                    color: 'white'
                  }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de tareas pendientes */}
            <div className="space-y-3 mb-8">
              {tareasPendientes.map((tarea, index) => (
                <TareaItem
                  key={tarea.id}
                  tarea={tarea}
                  index={index}
                  onToggle={() => toggleCompletado(tarea.id, tarea.completado)}
                  onDelete={() => eliminarTarea(tarea.id)}
                  colorScheme={colorScheme}
                />
              ))}
            </div>

            {/* Tareas completadas */}
            {tareasCompletadas.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-dashed" style={{ borderColor: colorScheme.border }}>
                <h4 
                  className="text-sm font-handwriting font-bold mb-4 opacity-60"
                  style={{ color: colorScheme.text }}
                >
                  Completadas ({tareasCompletadas.length})
                </h4>
                <div className="space-y-2 opacity-60">
                  {tareasCompletadas.map((tarea, index) => (
                    <TareaItem
                      key={tarea.id}
                      tarea={tarea}
                      index={index}
                      onToggle={() => toggleCompletado(tarea.id, tarea.completado)}
                      onDelete={() => eliminarTarea(tarea.id)}
                      colorScheme={colorScheme}
                      completada
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Estado vacío */}
            {tareasActivas.length === 0 && (
              <div className="text-center py-16">
                <Edit3 
                  className="w-16 h-16 mx-auto mb-4 opacity-30" 
                  style={{ color: colorScheme.text }}
                />
                <p className="font-handwriting text-lg" style={{ color: colorScheme.text }}>
                  No hay tareas en esta sección
                </p>
                <p className="text-sm mt-2 opacity-50" style={{ color: colorScheme.text }}>
                  Agrega una nueva tarea o usa las sugerencias
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
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

// ═══════════════════════════════════════════════════════════
// ITEM DE TAREA
// ═══════════════════════════════════════════════════════════
function TareaItem({ 
  tarea, 
  index, 
  onToggle, 
  onDelete, 
  colorScheme,
  completada = false 
}: { 
  tarea: Tarea; 
  index: number;
  onToggle: () => void;
  onDelete: () => void;
  colorScheme: typeof TAB_COLORS[0];
  completada?: boolean;
}) {
  const [showRecordatorio, setShowRecordatorio] = useState(false);
  const [fechaRecordatorio, setFechaRecordatorio] = useState(tarea.fechaRecordatorio || '');

  const guardarRecordatorio = async () => {
    try {
      // Conectar con backend
      setShowRecordatorio(false);
    } catch (error) {
      console.error('Error guardando recordatorio:', error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
        completada ? 'line-through opacity-50' : ''
      }`}
      style={{ 
        backgroundColor: 'white',
        borderColor: colorScheme.border,
        boxShadow: `2px 2px 0 ${colorScheme.border}30`
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110"
        style={{ 
          borderColor: colorScheme.border,
          backgroundColor: tarea.completado ? colorScheme.border : 'transparent'
        }}
      >
        {tarea.completado && <Check className="w-4 h-4 text-white" />}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p 
          className="font-handwriting text-lg leading-relaxed"
          style={{ color: colorScheme.text }}
        >
          {tarea.titulo}
        </p>
        
        {tarea.descripcion && (
          <p className="text-sm mt-1 opacity-60" style={{ color: colorScheme.text }}>
            {tarea.descripcion}
          </p>
        )}

        {/* Recordatorio */}
        {tarea.fechaRecordatorio && (
          <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: colorScheme.border }}>
            <Bell className="w-3 h-3" />
            {new Date(tarea.fechaRecordatorio).toLocaleString('es-PY', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Input de recordatorio */}
        <AnimatePresence>
          {showRecordatorio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="datetime-local"
                value={fechaRecordatorio}
                onChange={(e) => setFechaRecordatorio(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ borderColor: colorScheme.border }}
              />
              <button
                onClick={guardarRecordatorio}
                className="px-3 py-2 rounded-lg text-sm text-white"
                style={{ backgroundColor: colorScheme.border }}
              >
                Guardar
              </button>
              <button
                onClick={() => setShowRecordatorio(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" style={{ color: colorScheme.text }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!completada && (
          <button
            onClick={() => setShowRecordatorio(!showRecordatorio)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Agregar recordatorio"
          >
            <Clock className="w-4 h-4" style={{ color: colorScheme.text }} />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}
