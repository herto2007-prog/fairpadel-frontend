import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Check, ChevronLeft, Clock,
  Save, Plus
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';

interface ConfiguradorSedeProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface CanchaConfig {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
}



const HORAS = Array.from({ length: 16 }, (_, i) => i + 9); // 9 a 24

export function ConfiguradorSede({ tournamentId, fechaInicio, fechaFin }: ConfiguradorSedeProps) {
  const [step, setStep] = useState<'sedes' | 'canchas' | 'grid'>('sedes');
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [todasSedes, setTodasSedes] = useState<any[]>([]);
  const [canchas, setCanchas] = useState<CanchaConfig[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);
  const [canchasSeleccionadas, setCanchasSeleccionadas] = useState<Set<string>>(new Set());
  const [slotsTemporales, setSlotsTemporales] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);

  // Cargar datos
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

  // Generar fechas del torneo
  const getFechas = () => {
    if (!fechaInicio || !fechaFin) return [];
    const fechas: string[] = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(new Date(d).toISOString().split('T')[0]);
    }
    return fechas;
  };

  const fechas = getFechas();

  // Canchas de la sede seleccionada
  const canchasDeSede = canchas.filter(c => c.sedeId === sedeSeleccionada?.id);

  // Seleccionar todas las canchas
  const toggleTodasCanchas = () => {
    if (canchasSeleccionadas.size === canchasDeSede.length) {
      setCanchasSeleccionadas(new Set());
    } else {
      setCanchasSeleccionadas(new Set(canchasDeSede.map(c => c.id)));
    }
  };

  // Toggle cancha individual
  const toggleCancha = (canchaId: string) => {
    const newSet = new Set(canchasSeleccionadas);
    if (newSet.has(canchaId)) newSet.delete(canchaId);
    else newSet.add(canchaId);
    setCanchasSeleccionadas(newSet);
  };

  // Toggle slot en el grid
  const toggleSlot = (fecha: string, hora: number) => {
    const key = `${fecha}-${hora}`;
    const newSet = new Set(slotsTemporales);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSlotsTemporales(newSet);
  };

  // Verificar si un slot está marcado
  const isSlotMarcado = (fecha: string, hora: number) => {
    return slotsTemporales.has(`${fecha}-${hora}`);
  };

  // Guardar configuración
  const guardar = async () => {
    if (canchasSeleccionadas.size === 0 || slotsTemporales.size === 0) {
      alert('Selecciona al menos una cancha y un horario');
      return;
    }

    try {
      setGuardando(true);
      
      // Agrupar slots por fecha
      const slotsPorFecha: Record<string, number[]> = {};
      slotsTemporales.forEach(key => {
        const [fecha, horaStr] = key.split('-');
        if (!slotsPorFecha[fecha]) slotsPorFecha[fecha] = [];
        slotsPorFecha[fecha].push(parseInt(horaStr));
      });

      // Para cada fecha, encontrar bloques continuos
      for (const fecha of Object.keys(slotsPorFecha)) {
        const horas = slotsPorFecha[fecha].sort((a, b) => a - b);
        
        // Encontrar bloques continuos
        let bloqueInicio = horas[0];
        let bloqueFin = horas[0];
        
        for (let i = 1; i < horas.length; i++) {
          if (horas[i] === bloqueFin + 1) {
            bloqueFin = horas[i];
          } else {
            // Guardar bloque anterior y empezar nuevo
            await guardarBloque(fecha, bloqueInicio, bloqueFin + 1);
            bloqueInicio = horas[i];
            bloqueFin = horas[i];
          }
        }
        // Guardar último bloque
        await guardarBloque(fecha, bloqueInicio, bloqueFin + 1);
      }

      alert(`¡Configuración guardada! ${slotsTemporales.size} horarios creados.`);
      
      // Reset para siguiente configuración
      setSlotsTemporales(new Set());
      setCanchasSeleccionadas(new Set());
      setStep('sedes');
      setSedeSeleccionada(null);
      
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error guardando configuración');
    } finally {
      setGuardando(false);
    }
  };

  const guardarBloque = async (fecha: string, horaInicio: number, horaFin: number) => {
    // Crear/configurar el día
    const diaResult = await disponibilidadService.configurarDia(tournamentId, {
      fecha,
      horaInicio: `${horaInicio.toString().padStart(2, '0')}:00`,
      horaFin: `${horaFin.toString().padStart(2, '0')}:00`,
      minutosSlot: 60, // Cada slot es 1 hora
    });

    if (diaResult?.dia?.id) {
      await disponibilidadService.generarSlots(tournamentId, diaResult.dia.id);
    }
  };

  // Agregar sede al torneo
  const agregarSede = async (sedeId: string) => {
    try {
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      await loadData();
    } catch (error) {
      console.error('Error agregando sede:', error);
    }
  };

  const sedesDisponibles = todasSedes.filter(
    s => !sedes.some((st: any) => st.id === s.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#0B0E14] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="bg-[#151921] border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step !== 'sedes' && (
              <button
                onClick={() => step === 'grid' ? setStep('canchas') : setStep('sedes')}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#df2531]" />
                {step === 'sedes' && 'Seleccionar Sede'}
                {step === 'canchas' && sedeSeleccionada?.nombre}
                {step === 'grid' && `Configurar Horarios`}
              </h2>
              {step === 'grid' && (
                <p className="text-sm text-gray-400">
                  {canchasSeleccionadas.size} cancha(s) seleccionada(s) · Click para pintar/despintar
                </p>
              )}
            </div>
          </div>
          
          {step === 'grid' && (
            <button
              onClick={guardar}
              disabled={guardando || slotsTemporales.size === 0}
              className="px-4 py-2 bg-[#df2531] disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              {guardando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar ({slotsTemporales.size})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* PASO 1: SELECCIONAR SEDE */}
        {step === 'sedes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sedes.map((sede: any) => {
                const canchasCount = canchas.filter((c: any) => c.sedeId === sede.id).length;
                return (
                  <motion.button
                    key={sede.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSedeSeleccionada(sede);
                      setStep('canchas');
                    }}
                    className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[#df2531]/30 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#df2531]/20 flex items-center justify-center group-hover:bg-[#df2531]/30">
                        <Building2 className="w-5 h-5 text-[#df2531]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{sede.nombre}</p>
                        <p className="text-xs text-gray-500">{canchasCount} canchas</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              
              {/* Agregar sede */}
              {sedesDisponibles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      const sedeId = prompt('ID de la sede a agregar:');
                      if (sedeId) agregarSede(sedeId);
                    }}
                    className="w-full h-full min-h-[88px] p-4 border-2 border-dashed border-[#df2531]/40 rounded-xl text-[#df2531] flex flex-col items-center justify-center gap-2 hover:bg-[#df2531]/5 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">Agregar Sede</span>
                  </button>
                </div>
              )}
            </div>

            {sedes.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No hay sedes configuradas</p>
                {sedesDisponibles.length > 0 && (
                  <button
                    onClick={() => {
                      const sedeId = prompt('ID de la sede a agregar:');
                      if (sedeId) agregarSede(sedeId);
                    }}
                    className="px-4 py-2 bg-[#df2531] text-white rounded-xl"
                  >
                    Agregar Primera Sede
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 2: SELECCIONAR CANCHAS */}
        {step === 'canchas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Selecciona las canchas a configurar</p>
              <button
                onClick={toggleTodasCanchas}
                className="text-sm text-[#df2531] hover:underline"
              >
                {canchasSeleccionadas.size === canchasDeSede.length ? 'Desmarcar todas' : 'Marcar todas'}
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {canchasDeSede.map((cancha: any) => (
                <motion.button
                  key={cancha.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleCancha(cancha.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    canchasSeleccionadas.has(cancha.id)
                      ? 'bg-[#df2531]/20 border-[#df2531]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                    canchasSeleccionadas.has(cancha.id) ? 'bg-[#df2531]' : 'bg-white/5'
                  }`}>
                    {canchasSeleccionadas.has(cancha.id) ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-gray-500">C</span>
                    )}
                  </div>
                  <p className={`text-xs font-medium truncate ${
                    canchasSeleccionadas.has(cancha.id) ? 'text-white' : 'text-gray-400'
                  }`}>
                    {cancha.nombre}
                  </p>
                </motion.button>
              ))}
            </div>

            {canchasSeleccionadas.size > 0 && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep('grid')}
                  className="px-6 py-3 bg-[#df2531] text-white rounded-xl font-medium flex items-center gap-2"
                >
                  Configurar Horarios
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: GRID DE HORARIOS */}
        {step === 'grid' && (
          <div className="space-y-4">
            {/* Mini resumen de canchas seleccionadas */}
            <div className="flex flex-wrap gap-2">
              {canchasDeSede
                .filter(c => canchasSeleccionadas.has(c.id))
                .map(c => (
                  <span key={c.id} className="px-2 py-1 bg-[#df2531]/20 text-[#df2531] text-xs rounded-lg">
                    {c.nombre}
                  </span>
                ))}
            </div>

            {/* Grid compacto */}
            <div className="bg-[#151921] rounded-xl border border-white/5 overflow-hidden">
              {/* Header con fechas */}
              <div className="grid grid-cols-[50px_repeat(auto-fit,minmax(60px,1fr))] border-b border-white/5">
                <div className="p-2 text-xs text-gray-500 font-medium flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
                {fechas.map(fecha => {
                  const d = new Date(fecha);
                  return (
                    <div key={fecha} className="p-2 text-center border-l border-white/5">
                      <div className="text-[10px] text-gray-500">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]}
                      </div>
                      <div className="text-sm font-bold text-white">{d.getDate()}</div>
                      <div className="text-[9px] text-gray-600">
                        {d.toLocaleDateString('es-PY', { month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filas de horas */}
              <div className="max-h-[400px] overflow-y-auto">
                {HORAS.map(hora => (
                  <div key={hora} className="grid grid-cols-[50px_repeat(auto-fit,minmax(60px,1fr))] border-b border-white/5 last:border-0">
                    <div className="p-2 text-xs text-gray-500 font-medium flex items-center justify-center bg-[#0B0E14]">
                      {hora}h
                    </div>
                    {fechas.map(fecha => {
                      const marcado = isSlotMarcado(fecha, hora);
                      return (
                        <button
                          key={`${fecha}-${hora}`}
                          onClick={() => toggleSlot(fecha, hora)}
                          className={`h-10 border-l border-white/5 transition-all ${
                            marcado 
                              ? 'bg-[#df2531] hover:bg-[#df2531]/80' 
                              : 'bg-transparent hover:bg-white/[0.05]'
                          }`}
                          title={`${fecha} ${hora}:00`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#df2531] rounded" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-transparent border border-white/10 rounded" />
                <span>No disponible</span>
              </div>
              <span className="ml-auto">Click para alternar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
