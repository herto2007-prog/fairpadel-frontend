import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Check, ChevronLeft,
  Save, Plus, MousePointer2, X,
  ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';
import { useToast } from '../../../../components/ui/ToastProvider';
import { getDatesRangePY } from '../../../../utils/date';

interface ConfiguradorSedeProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
  onSave?: () => void; // Callback cuando se guarda exitosamente
}

interface CanchaConfig {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
}

// Horas fijas: 9 a 24 (16 horas) en hora de Paraguay
const HORAS = Array.from({ length: 16 }, (_, i) => i + 9);

export function ConfiguradorSede({ tournamentId, fechaInicio, fechaFin, onSave }: ConfiguradorSedeProps) {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<'sedes' | 'canchas' | 'grid'>('sedes');
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [todasSedes, setTodasSedes] = useState<any[]>([]);
  const [canchas, setCanchas] = useState<CanchaConfig[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);
  const [canchasSeleccionadas, setCanchasSeleccionadas] = useState<Set<string>>(new Set());
  const [slotsTemporales, setSlotsTemporales] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  const [showModalSedes, setShowModalSedes] = useState(false);
  const [agregandoSede, setAgregandoSede] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dispData, sedesData] = await Promise.all([
        disponibilidadService.getDisponibilidad(tournamentId),
        sedesService.getAll(),
      ]);
      
      setSedes(dispData.sedes || []);
      setTodasSedes(sedesData || []);
      setCanchas(dispData.canchas || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFechas = useCallback(() => {
    if (!fechaInicio || !fechaFin) return [];
    // Usar utilidad de fecha de Paraguay
    return getDatesRangePY(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin]);

  const fechas = getFechas();
  const canchasDeSede = canchas.filter(c => c.sedeId === sedeSeleccionada?.id);

  const toggleTodasCanchas = () => {
    if (canchasSeleccionadas.size === canchasDeSede.length) {
      setCanchasSeleccionadas(new Set());
    } else {
      setCanchasSeleccionadas(new Set(canchasDeSede.map(c => c.id)));
    }
  };

  const toggleCancha = (canchaId: string) => {
    const newSet = new Set(canchasSeleccionadas);
    if (newSet.has(canchaId)) newSet.delete(canchaId);
    else newSet.add(canchaId);
    setCanchasSeleccionadas(newSet);
  };

  // Drag functions
  const startDrag = (fecha: string, hora: number, currentValue: boolean) => {
    setIsDragging(true);
    const newValue = !currentValue;
    setDragValue(newValue);
    updateSlot(fecha, hora, newValue);
  };

  const enterCell = (fecha: string, hora: number) => {
    if (isDragging && dragValue !== null) {
      updateSlot(fecha, hora, dragValue);
    }
  };

  const endDrag = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  const updateSlot = (fecha: string, hora: number, value: boolean) => {
    const key = `${fecha}-${hora}`;
    setSlotsTemporales(prev => {
      const newSet = new Set(prev);
      if (value) newSet.add(key);
      else newSet.delete(key);
      return newSet;
    });
  };

  const isSlotMarcado = (fecha: string, hora: number) => {
    return slotsTemporales.has(`${fecha}-${hora}`);
  };

  const guardar = async () => {
    if (canchasSeleccionadas.size === 0 || slotsTemporales.size === 0) {
      showError('Configuración incompleta', 'Selecciona al menos una cancha y un horario');
      return;
    }

    try {
      setGuardando(true);
      
      const slotsPorFecha: Record<string, number[]> = {};
      slotsTemporales.forEach(key => {
        const [fecha, horaStr] = key.split('-');
        if (!slotsPorFecha[fecha]) slotsPorFecha[fecha] = [];
        slotsPorFecha[fecha].push(parseInt(horaStr));
      });

      for (const fecha of Object.keys(slotsPorFecha)) {
        const horas = slotsPorFecha[fecha].sort((a, b) => a - b);
        
        let bloqueInicio = horas[0];
        let bloqueFin = horas[0];
        
        for (let i = 1; i < horas.length; i++) {
          if (horas[i] === bloqueFin + 1) {
            bloqueFin = horas[i];
          } else {
            await guardarBloque(fecha, bloqueInicio, bloqueFin + 1);
            bloqueInicio = horas[i];
            bloqueFin = horas[i];
          }
        }
        await guardarBloque(fecha, bloqueInicio, bloqueFin + 1);
      }

      showSuccess('Configuración guardada', `${slotsTemporales.size} horarios creados exitosamente`);
      
      // Notificar al padre que se guardó exitosamente
      onSave?.();
      
      // Reset del formulario
      setSlotsTemporales(new Set());
      setCanchasSeleccionadas(new Set());
      setStep('sedes');
      setSedeSeleccionada(null);
      
    } catch (error) {
      console.error('Error guardando:', error);
      showError('Error', 'No se pudo guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const guardarBloque = async (fecha: string, horaInicio: number, horaFin: number) => {
    const diaResult = await disponibilidadService.configurarDia(tournamentId, {
      fecha,
      horaInicio: `${horaInicio.toString().padStart(2, '0')}:00`,
      horaFin: `${horaFin.toString().padStart(2, '0')}:00`,
      minutosSlot: 60,
    });

    if (diaResult?.dia?.id) {
      // Solo pasar canchaIds si hay canchas seleccionadas
      // Si no hay canchas, no enviamos el campo para que use todas las canchas del torneo
      const canchaIdsArray = Array.from(canchasSeleccionadas);
      if (canchaIdsArray.length > 0) {
        await disponibilidadService.generarSlots(tournamentId, diaResult.dia.id, canchaIdsArray);
      } else {
        // Si no hay canchas seleccionadas, no generamos slots para esta fecha
        console.warn(`No hay canchas seleccionadas para la fecha ${fecha}, saltando generación de slots`);
      }
    }
  };

  const agregarSede = async (sedeId: string) => {
    try {
      setAgregandoSede(sedeId);
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      showSuccess('Sede agregada', 'La sede fue agregada exitosamente');
      await loadData();
      setShowModalSedes(false);
    } catch (error) {
      console.error('Error agregando sede:', error);
      showError('Error', 'No se pudo agregar la sede');
    } finally {
      setAgregandoSede(null);
    }
  };

  const moverSede = async (sedeId: string, direccion: 'arriba' | 'abajo') => {
    try {
      // Ordenar sedes por orden actual
      const sedesOrdenadas = [...sedes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      
      // Encontrar índice actual
      const indexActual = sedesOrdenadas.findIndex((s: any) => s.id === sedeId);
      if (indexActual === -1) return;

      // Calcular nuevo índice
      const nuevoIndex = direccion === 'arriba' ? indexActual - 1 : indexActual + 1;
      if (nuevoIndex < 0 || nuevoIndex >= sedesOrdenadas.length) return;

      // Intercambiar orden
      const sedeActual = sedesOrdenadas[indexActual];
      const sedeSwap = sedesOrdenadas[nuevoIndex];

      const ordenActual = sedeActual.orden ?? indexActual;
      const ordenSwap = sedeSwap.orden ?? nuevoIndex;

      // Preparar array con el nuevo orden
      const ordenSedes = sedesOrdenadas.map((s: any, idx: number) => {
        if (s.id === sedeId) {
          return { sedeId: s.id, orden: ordenSwap };
        }
        if (s.id === sedeSwap.id) {
          return { sedeId: s.id, orden: ordenActual };
        }
        return { sedeId: s.id, orden: s.orden ?? idx };
      });

      // Llamar al backend
      await disponibilidadService.reordenarSedes(tournamentId, ordenSedes);
      
      // Recargar datos
      await loadData();
      showSuccess('Orden actualizado', 'La prioridad de sedes se ha actualizado');
    } catch (error) {
      console.error('Error reordenando sede:', error);
      showError('Error', 'No se pudo actualizar el orden');
    }
  };

  const sedesDisponibles = todasSedes.filter(
    s => !sedes.some((st: any) => st.id === s.id)
  );

  useEffect(() => {
    const preventSelection = (e: Event) => {
      if (isDragging) e.preventDefault();
    };
    document.addEventListener('selectstart', preventSelection);
    return () => document.removeEventListener('selectstart', preventSelection);
  }, [isDragging]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  return (
    <div 
      className="bg-[#0B0E14] rounded-2xl border border-white/5 overflow-hidden"
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      {/* Header */}
      <div className="bg-[#151921] border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== 'sedes' && (
              <button
                onClick={() => step === 'grid' ? setStep('canchas') : setStep('sedes')}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#df2531]" />
                {step === 'sedes' && 'Sedes'}
                {step === 'canchas' && sedeSeleccionada?.nombre}
                {step === 'grid' && 'Horarios'}
              </h2>
              {step === 'grid' && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MousePointer2 className="w-3 h-3" />
                  Arrastra para pintar · {slotsTemporales.size} seleccionados
                </p>
              )}
            </div>
          </div>
          
          {step === 'grid' && (
            <button
              onClick={guardar}
              disabled={guardando || slotsTemporales.size === 0}
              className="px-3 py-1.5 bg-[#df2531] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              {guardando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Guardar ({slotsTemporales.size})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* PASO 1: SEDES - CON ORDENAMIENTO */}
        {step === 'sedes' && (
          <div className="space-y-3">
            {/* Info de prioridad */}
            {sedes.length > 1 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400 flex items-center gap-2">
                  <GripVertical className="w-4 h-4" />
                  Usa las flechas para reordenar. La sede #1 se llenará primero durante el sorteo.
                </p>
              </div>
            )}

            {/* Lista de sedes ordenadas */}
            <div className="space-y-2">
              {sedes
                .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
                .map((sede: any, index: number) => {
                  const canchasCount = canchas.filter((c: any) => c.sedeId === sede.id).length;
                  const isFirst = index === 0;
                  const isLast = index === sedes.length - 1;
                  
                  return (
                    <motion.div
                      key={sede.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 bg-white/[0.02] border rounded-lg transition-all ${
                        isFirst ? 'border-[#df2531]/30 bg-[#df2531]/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Número de orden */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          isFirst 
                            ? 'bg-[#df2531] text-white' 
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Icono sede */}
                        <div className="w-10 h-10 rounded-lg bg-[#df2531]/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#df2531]" />
                        </div>

                        {/* Info sede */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{sede.nombre}</p>
                          <p className="text-[10px] text-gray-500">{canchasCount} canchas disponibles</p>
                        </div>

                        {/* Controles de orden */}
                        {sedes.length > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moverSede(sede.id, 'arriba')}
                              disabled={isFirst}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover arriba"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moverSede(sede.id, 'abajo')}
                              disabled={isLast}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover abajo"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Botón configurar (opcional - solo si quieren configurar canchas por sede) */}
                        <button
                          onClick={() => {
                            setSedeSeleccionada(sede);
                            setStep('canchas');
                          }}
                          className="px-3 py-1.5 text-xs text-[#df2531] hover:bg-[#df2531]/10 rounded-lg transition-colors"
                        >
                          Configurar
                        </button>
                      </div>

                      {/* Badge de prioridad */}
                      {isFirst && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-[#df2531]">
                          <span className="w-1.5 h-1.5 bg-[#df2531] rounded-full animate-pulse" />
                          Prioridad alta - Se usa primero en el sorteo
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
            
            {/* Botón agregar sede */}
            {sedesDisponibles.length > 0 && (
              <button
                onClick={() => setShowModalSedes(true)}
                className="w-full p-3 border-2 border-dashed border-[#df2531]/40 rounded-lg text-[#df2531] flex items-center justify-center gap-2 hover:bg-[#df2531]/5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">Agregar Otra Sede</span>
              </button>
            )}

            {sedes.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No hay sedes configuradas</p>
                <button
                  onClick={() => setShowModalSedes(true)}
                  className="px-4 py-2 bg-[#df2531] text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Sede
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: CANCHAS */}
        {step === 'canchas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Selecciona canchas</p>
              <button
                onClick={toggleTodasCanchas}
                className="text-xs text-[#df2531] hover:underline"
              >
                {canchasSeleccionadas.size === canchasDeSede.length ? 'Ninguna' : 'Todas'}
              </button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {canchasDeSede.map((cancha: any) => (
                <motion.button
                  key={cancha.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleCancha(cancha.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    canchasSeleccionadas.has(cancha.id)
                      ? 'bg-[#df2531]/20 border-[#df2531]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-6 h-6 rounded mx-auto mb-1 flex items-center justify-center ${
                    canchasSeleccionadas.has(cancha.id) ? 'bg-[#df2531]' : 'bg-white/5'
                  }`}>
                    {canchasSeleccionadas.has(cancha.id) ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <span className="text-[10px] text-gray-500">C</span>
                    )}
                  </div>
                  <p className={`text-[10px] font-medium truncate ${
                    canchasSeleccionadas.has(cancha.id) ? 'text-white' : 'text-gray-400'
                  }`}>
                    {cancha.nombre}
                  </p>
                </motion.button>
              ))}
            </div>

            {canchasSeleccionadas.size > 0 && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep('grid')}
                  className="px-4 py-2 bg-[#df2531] text-white rounded-lg text-sm font-medium"
                >
                  Continuar →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: GRID SIN SCROLL HORIZONTAL */}
        {step === 'grid' && (
          <div className="space-y-3">
            {/* Chips de canchas */}
            <div className="flex flex-wrap gap-1">
              {canchasDeSede
                .filter(c => canchasSeleccionadas.has(c.id))
                .map(c => (
                  <span key={c.id} className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] text-[10px] rounded">
                    {c.nombre}
                  </span>
                ))}
            </div>

            {/* Grid completo sin scroll horizontal */}
            <div 
              className="bg-[#151921] rounded-lg border border-white/5 overflow-hidden select-none"
            >
              {/* Header con días completos */}
              <div className="flex border-b border-white/5">
                <div className="w-12 p-2 bg-[#0B0E14] flex items-center justify-center border-r border-white/5">
                  <span className="text-[10px] text-gray-500">Hora</span>
                </div>
                {fechas.map((f) => (
                  <div key={f.fecha} className="flex-1 p-2 text-center bg-[#0B0E14] border-r border-white/5 min-w-0">
                    <div className="text-[10px] text-gray-500">{f.diaNombre}</div>
                    <div className="text-sm font-bold text-white">{f.num}</div>
                    <div className="text-[9px] text-gray-600">{f.mes}</div>
                  </div>
                ))}
              </div>

              {/* Filas de horas - sin scroll, todo visible */}
              <div>
                {HORAS.map(hora => (
                  <div key={hora} className="flex border-b border-white/5 last:border-0">
                    <div className="w-12 p-2 text-xs text-gray-500 font-medium flex items-center justify-center bg-[#0B0E14] border-r border-white/5">
                      {hora}h
                    </div>
                    {fechas.map((f) => {
                      const marcado = isSlotMarcado(f.fecha, hora);
                      return (
                        <div
                          key={`${f.fecha}-${hora}`}
                          className={`flex-1 h-10 border-r border-white/5 cursor-pointer transition-all min-w-0 ${
                            marcado 
                              ? 'bg-[#df2531]' 
                              : 'bg-transparent hover:bg-white/[0.1]'
                          }`}
                          onMouseDown={() => startDrag(f.fecha, hora, marcado)}
                          onMouseEnter={() => enterCell(f.fecha, hora)}
                          onMouseUp={endDrag}
                          title={`${f.diaNombre} ${f.num} ${hora}:00`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Info de horarios */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-[#df2531] rounded" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-transparent border border-white/20 rounded" />
                  <span>No disponible</span>
                </div>
              </div>
              <span>Horario: 9h - 24h</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar sedes */}
      {showModalSedes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151921] rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Agregar Sede</h3>
              <button
                onClick={() => setShowModalSedes(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sedesDisponibles.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay más sedes disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sedesDisponibles.map((sede) => (
                    <button
                      key={sede.id}
                      onClick={() => agregarSede(sede.id)}
                      disabled={agregandoSede === sede.id}
                      className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#df2531]/30 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#df2531]/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#df2531]" />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-[#df2531] transition-colors">
                              {sede.nombre}
                            </p>
                            <p className="text-xs text-gray-500">{sede.ciudad}</p>
                          </div>
                        </div>
                        {agregandoSede === sede.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-[#df2531]/30 border-t-[#df2531] rounded-full"
                          />
                        ) : (
                          <Plus className="w-5 h-5 text-gray-600 group-hover:text-[#df2531]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
