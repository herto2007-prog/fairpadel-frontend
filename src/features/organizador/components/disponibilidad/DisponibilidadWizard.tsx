import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Paintbrush, Eraser, MousePointer, Sparkles, Calendar,
  Clock, Check, ChevronRight, Building2,
  Plus, CheckCircle2
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';

// TEMPLATES PREDEFINIDOS
const TEMPLATES = [
  {
    id: 'torneo_weekend',
    nombre: 'Torneo Weekend',
    icon: '🏆',
    descripcion: 'Jue-Vie 18-23h, Sáb 14-22h, Dom 10-20h',
    config: [
      { diasSemana: [4, 5], horaInicio: '18:00', horaFin: '23:00', minutosSlot: 90 }, // Jue, Vie
      { diasSemana: [6], horaInicio: '14:00', horaFin: '22:00', minutosSlot: 90 },   // Sáb
      { diasSemana: [0], horaInicio: '10:00', horaFin: '20:00', minutosSlot: 90 },   // Dom
    ]
  },
  {
    id: 'solo_findes',
    nombre: 'Solo Fin de Semana',
    icon: '🌟',
    descripcion: 'Sáb 14-22h, Dom 10-20h',
    config: [
      { diasSemana: [6], horaInicio: '14:00', horaFin: '22:00', minutosSlot: 90 },
      { diasSemana: [0], horaInicio: '10:00', horaFin: '20:00', minutosSlot: 90 },
    ]
  },
  {
    id: 'semana_completa',
    nombre: 'Semana Completa',
    icon: '📅',
    descripcion: 'Lun-Vie 18-23h, Sáb-Dom 14-22h',
    config: [
      { diasSemana: [1, 2, 3, 4, 5], horaInicio: '18:00', horaFin: '23:00', minutosSlot: 90 },
      { diasSemana: [6, 0], horaInicio: '14:00', horaFin: '22:00', minutosSlot: 90 },
    ]
  },
  {
    id: 'solo_nocturno',
    nombre: 'Solo Nocturno',
    icon: '🌙',
    descripcion: 'Todos los días 18-23h',
    config: [
      { diasSemana: [0, 1, 2, 3, 4, 5, 6], horaInicio: '18:00', horaFin: '23:00', minutosSlot: 90 },
    ]
  },
  {
    id: 'dia_completo',
    nombre: 'Día Completo',
    icon: '☀️',
    descripcion: 'Todos los días 09-23h',
    config: [
      { diasSemana: [0, 1, 2, 3, 4, 5, 6], horaInicio: '09:00', horaFin: '23:00', minutosSlot: 90 },
    ]
  },
];

interface DisponibilidadWizardProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface DiaConfigurado {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  canchasActivas: string[];
}

export function DisponibilidadWizard({ tournamentId, fechaInicio, fechaFin }: DisponibilidadWizardProps) {
  const [step, setStep] = useState<'sedes' | 'template' | 'pintar' | 'review'>('sedes');
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [todasSedes, setTodasSedes] = useState<any[]>([]);
  const [canchas, setCanchas] = useState<any[]>([]);
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState<Set<string>>(new Set());
  const [canchasSeleccionadas, setCanchasSeleccionadas] = useState<Set<string>>(new Set());
  const [diasConfigurados, setDiasConfigurados] = useState<DiaConfigurado[]>([]);
  const [modoPintar, setModoPintar] = useState<'pintar' | 'borrar' | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      const [dispData, sedesData] = await Promise.all([
        disponibilidadService.getDisponibilidad(tournamentId),
        sedesService.getAll(),
      ]);
      
      // datos del torneo disponibles en dispData.torneo
      setSedes(dispData.sedes);
      setTodasSedes(sedesData || []);
      setCanchas(dispData.canchas);
      
      // Pre-seleccionar todo
      setSedesSeleccionadas(new Set(dispData.sedes.map((s: any) => s.id)));
      setCanchasSeleccionadas(new Set(dispData.canchas.map((c: any) => c.id)));
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Generar fechas del rango del torneo
  const fechasTorneo = useCallback(() => {
    if (!fechaInicio || !fechaFin) return [];
    const fechas: string[] = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(new Date(d).toISOString().split('T')[0]);
    }
    return fechas;
  }, [fechaInicio, fechaFin]);

  // Aplicar template
  const aplicarTemplate = (template: typeof TEMPLATES[0]) => {
    const fechas = fechasTorneo();
    const nuevosDias: DiaConfigurado[] = [];
    
    for (const fechaStr of fechas) {
      const fecha = new Date(fechaStr);
      const diaSemana = fecha.getDay(); // 0=Dom, 1=Lun, ...
      
      // Buscar config que aplique a este día
      const config = template.config.find(c => c.diasSemana.includes(diaSemana));
      if (config) {
        nuevosDias.push({
          fecha: fechaStr,
          horaInicio: config.horaInicio,
          horaFin: config.horaFin,
          minutosSlot: config.minutosSlot,
          canchasActivas: Array.from(canchasSeleccionadas),
        });
      }
    }
    
    setDiasConfigurados(nuevosDias);
    setStep('pintar');
  };

  // Toggle cancha en un día específico
  const toggleCanchaEnDia = (fecha: string, canchaId: string) => {
    setDiasConfigurados(prev => prev.map(d => {
      if (d.fecha !== fecha) return d;
      const nuevasCanchas = d.canchasActivas.includes(canchaId)
        ? d.canchasActivas.filter(c => c !== canchaId)
        : [...d.canchasActivas, canchaId];
      return { ...d, canchasActivas: nuevasCanchas };
    }));
  };

  // Guardar todo
  const guardarDisponibilidad = async () => {
    try {
      setLoading(true);
      
      // 1. Crear cada día
      for (const dia of diasConfigurados) {
        const result = await disponibilidadService.configurarDia(tournamentId, {
          fecha: dia.fecha,
          horaInicio: dia.horaInicio,
          horaFin: dia.horaFin,
          minutosSlot: dia.minutosSlot,
        });
        
        // 2. Generar slots para ese día
        if (result?.dia?.id) {
          await disponibilidadService.generarSlots(tournamentId, result.dia.id);
          
          // TODO: Marcar canchas inactivas según dia.canchasActivas
          // Esto requeriría un endpoint adicional para desactivar slots de ciertas canchas
        }
      }
      
      alert(`¡Disponibilidad configurada! ${diasConfigurados.length} días creados.`);
      setStep('sedes');
      setDiasConfigurados([]);
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error guardando disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const sedesDisponibles = todasSedes.filter(
    s => !sedes.some((st: any) => st.id === s.id)
  );

  return (
    <div className="bg-[#0B0E14] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header con pasos */}
      <div className="bg-[#151921] border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-[#df2531]" />
            Configurar Disponibilidad
          </h2>
          <div className="flex items-center gap-2">
            {['sedes', 'template', 'pintar', 'review'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-[#df2531] text-white' :
                  ['sedes', 'template', 'pintar', 'review'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-white/5 text-gray-500'
                }`}>
                  {['sedes', 'template', 'pintar', 'review'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < 3 && <div className="w-8 h-px bg-white/10 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* PASO 1: SELECCIONAR SEDES */}
        {step === 'sedes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-1">1. Selecciona las Sedes</h3>
              <p className="text-sm text-gray-400">Elige las sedes donde se jugará el torneo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sedes.map((sede: any) => (
                <motion.button
                  key={sede.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newSet = new Set(sedesSeleccionadas);
                    if (newSet.has(sede.id)) {
                      newSet.delete(sede.id);
                      // También quitar canchas de esta sede
                      const canchasDeSede = canchas.filter((c: any) => c.sedeId === sede.id).map((c: any) => c.id);
                      const newCanchas = new Set(canchasSeleccionadas);
                      canchasDeSede.forEach((c: string) => newCanchas.delete(c));
                      setCanchasSeleccionadas(newCanchas);
                    } else {
                      newSet.add(sede.id);
                      // Agregar canchas de esta sede
                      const canchasDeSede = canchas.filter((c: any) => c.sedeId === sede.id).map((c: any) => c.id);
                      const newCanchas = new Set(canchasSeleccionadas);
                      canchasDeSede.forEach((c: string) => newCanchas.add(c));
                      setCanchasSeleccionadas(newCanchas);
                    }
                    setSedesSeleccionadas(newSet);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    sedesSeleccionadas.has(sede.id)
                      ? 'bg-[#df2531]/10 border-[#df2531]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      sedesSeleccionadas.has(sede.id) ? 'bg-[#df2531]' : 'bg-white/5'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{sede.nombre}</p>
                      <p className="text-xs text-gray-400">{sede.ciudad}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {canchas.filter((c: any) => c.sedeId === sede.id).length} canchas
                      </p>
                    </div>
                    {sedesSeleccionadas.has(sede.id) && (
                      <CheckCircle2 className="w-5 h-5 text-[#df2531]" />
                    )}
                  </div>
                </motion.button>
              ))}
              
              {/* Agregar nueva sede */}
              {sedesDisponibles.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => alert('Funcionalidad de agregar sede disponible en el paso 1')}
                  className="p-4 rounded-xl border-2 border-dashed border-[#df2531]/40 text-[#df2531] flex items-center justify-center gap-2 hover:bg-[#df2531]/5"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Agregar Sede</span>
                </motion.button>
              )}
            </div>

            {/* Canchas por sede */}
            {sedesSeleccionadas.size > 0 && (
              <div className="mt-6 p-4 bg-white/[0.02] rounded-xl">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Canchas disponibles</h4>
                <div className="flex flex-wrap gap-2">
                  {canchas
                    .filter((c: any) => sedesSeleccionadas.has(c.sedeId))
                    .map((cancha: any) => (
                      <button
                        key={cancha.id}
                        onClick={() => {
                          const newSet = new Set(canchasSeleccionadas);
                          if (newSet.has(cancha.id)) newSet.delete(cancha.id);
                          else newSet.add(cancha.id);
                          setCanchasSeleccionadas(newSet);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          canchasSeleccionadas.has(cancha.id)
                            ? 'bg-[#df2531] text-white'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cancha.nombre}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep('template')}
                disabled={sedesSeleccionadas.size === 0 || canchasSeleccionadas.size === 0}
                className="px-6 py-3 bg-[#df2531] disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: ELEGIR TEMPLATE */}
        {step === 'template' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-1">2. Elige un Template</h3>
              <p className="text-sm text-gray-400">Selecciona el patrón de horarios o configura manualmente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATES.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => aplicarTemplate(template)}
                  className="p-5 rounded-xl bg-gradient-to-r from-[#df2531]/10 to-transparent border border-[#df2531]/20 text-left hover:border-[#df2531]/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#df2531]/20 flex items-center justify-center text-2xl">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{template.nombre}</h4>
                      <p className="text-sm text-gray-400 mt-1">{template.descripcion}</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-[#df2531]" />
                  </div>
                </motion.button>
              ))}
              
              {/* Configuración manual */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDiasConfigurados([])}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-left hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Paintbrush className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Configuración Manual</h4>
                    <p className="text-sm text-gray-400 mt-1">Define cada día individualmente</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </motion.button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('sedes')}
                className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl font-medium"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: MODO PINTAR */}
        {step === 'pintar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">3. Ajusta los Horarios</h3>
                <p className="text-sm text-gray-400">Personaliza qué canchas están disponibles cada día</p>
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center gap-2 bg-[#151921] rounded-xl p-1">
                <button
                  onClick={() => setModoPintar(modoPintar === 'pintar' ? null : 'pintar')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    modoPintar === 'pintar' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  Pintar
                </button>
                <button
                  onClick={() => setModoPintar(modoPintar === 'borrar' ? null : 'borrar')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    modoPintar === 'borrar' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Borrar
                </button>
                <button
                  onClick={() => setModoPintar(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    modoPintar === null ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MousePointer className="w-4 h-4" />
                  Ver
                </button>
              </div>
            </div>

            {/* Grid de días */}
            <div className="bg-[#151921] rounded-xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-white/5">
                <div className="p-3 text-xs text-gray-500 font-medium">Cancha</div>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                  <div key={dia} className="p-3 text-center text-xs text-gray-500 font-medium border-l border-white/5">
                    {dia}
                  </div>
                ))}
              </div>
              
              {canchas
                .filter((c: any) => canchasSeleccionadas.has(c.id))
                .map((cancha: any) => (
                  <div key={cancha.id} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-white/5 last:border-0">
                    <div className="p-3 text-sm text-white font-medium truncate">
                      {cancha.nombre}
                    </div>
                    {fechasTorneo().map((fechaStr) => {
                      const diaConfig = diasConfigurados.find(d => d.fecha === fechaStr);
                      const estaActiva = diaConfig?.canchasActivas.includes(cancha.id);
                      
                      return (
                        <div
                          key={fechaStr}
                          className={`p-2 border-l border-white/5 min-h-[60px] flex flex-col justify-center items-center cursor-pointer transition-all ${
                            estaActiva ? 'bg-emerald-500/20' : 'bg-transparent hover:bg-white/[0.02]'
                          } ${modoPintar ? 'cursor-crosshair' : ''}`}
                          onMouseDown={() => {
                            if (modoPintar === 'pintar') toggleCanchaEnDia(fechaStr, cancha.id);
                            if (modoPintar === 'borrar') {
                              setDiasConfigurados(prev => prev.map(d => {
                                if (d.fecha !== fechaStr) return d;
                                return { ...d, canchasActivas: d.canchasActivas.filter(c => c !== cancha.id) };
                              }));
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (e.buttons === 1 && modoPintar === 'pintar') {
                              if (!estaActiva) toggleCanchaEnDia(fechaStr, cancha.id);
                            }
                            if (e.buttons === 1 && modoPintar === 'borrar') {
                              if (estaActiva) {
                                setDiasConfigurados(prev => prev.map(d => {
                                  if (d.fecha !== fechaStr) return d;
                                  return { ...d, canchasActivas: d.canchasActivas.filter(c => c !== cancha.id) };
                                }));
                              }
                            }
                          }}
                        >
                          {diaConfig && (
                            <>
                              <div className={`w-3 h-3 rounded-full ${estaActiva ? 'bg-emerald-500' : 'bg-white/10'}`} />
                              <span className="text-[10px] text-gray-500 mt-1">
                                {diaConfig.horaInicio.slice(0, 2)}-{diaConfig.horaFin.slice(0, 2)}h
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* Info del modo */}
            {modoPintar && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                modoPintar === 'pintar' ? 'bg-[#df2531]/10 text-[#df2531]' : 'bg-red-500/10 text-red-400'
              }`}>
                {modoPintar === 'pintar' ? <Paintbrush className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
                Modo {modoPintar === 'pintar' ? 'pintar' : 'borrar'}: Arrastra sobre las celdas para {modoPintar === 'pintar' ? 'activar' : 'desactivar'} canchas
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('template')}
                className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl font-medium"
              >
                Volver
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-6 py-3 bg-[#df2531] text-white rounded-xl font-medium flex items-center gap-2"
              >
                Revisar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: REVIEW */}
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-1">4. Revisa y Confirma</h3>
              <p className="text-sm text-gray-400">Resumen de la disponibilidad configurada</p>
            </div>

            <div className="space-y-3">
              {diasConfigurados.map((dia) => (
                <div key={dia.fecha} className="p-4 bg-white/[0.02] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#df2531]/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#df2531]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {new Date(dia.fecha).toLocaleDateString('es-PY', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-sm text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {dia.horaInicio} - {dia.horaFin} ({dia.minutosSlot} min)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{dia.canchasActivas.length}</p>
                    <p className="text-xs text-gray-500">canchas activas</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('pintar')}
                className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl font-medium"
              >
                Volver
              </button>
              <button
                onClick={guardarDisponibilidad}
                disabled={loading}
                className="px-6 py-3 bg-[#df2531] disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar Disponibilidad
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
