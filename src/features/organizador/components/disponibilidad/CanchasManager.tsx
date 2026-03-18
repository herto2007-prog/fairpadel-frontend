import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, MapPin,
  Calendar, Grid3X3, List, Building2, CheckCircle2,
  X, Copy, BarChart3, Clock, Trophy, AlertCircle,
  Trash2
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';
import { api } from '../../../../services/api';
import { getDatesRangePY, formatDatePY, getDateOnlyPY } from '../../../../utils/date';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { useToast } from '../../../../components/ui/ToastProvider';

// ═══════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════

interface Slot {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'OCUPADO' | 'BLOQUEADO';
  cancha: {
    id: string;
    nombre: string;
    sedeId: string;
    sedeNombre: string;
  };
  match: {
    id: string;
    ronda: string;
    pareja1: string;
    pareja2: string;
  } | null;
}

interface CanchaColor {
  bg: string;
  border: string;
  text: string;
  hover: string;
}

interface Cancha {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
  color: CanchaColor;
}

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

interface DiaConfig {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  totalSlots: number;
  slotsLibres: number;
  activo: boolean;
}

interface CanchasManagerProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaFinales?: string;
}

interface TorneoInfo {
  id: string;
  nombre: string;
  sedePrincipal?: {
    id: string;
    nombre: string;
    ciudad: string;
  };
  fechaFinales?: string;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTES Y UTILIDADES
// ═══════════════════════════════════════════════════════════

const CANCHA_COLORS = [
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', hover: 'hover:bg-amber-500/30' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', hover: 'hover:bg-pink-500/30' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
];

// Horas a mostrar en el calendario (06:00 a 23:00)
const HORAS_CALENDARIO = Array.from({ length: 18 }, (_, i) => {
  const h = (i + 6).toString().padStart(2, '0');
  return `${h}:00`;
});

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function CanchasManager({ tournamentId, fechaInicio, fechaFin, fechaFinales }: CanchasManagerProps) {
  // ═══════════════════════════════════════════════════════════
  // ESTADOS
  // ═══════════════════════════════════════════════════════════
  
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (fechaInicio) return new Date(fechaInicio);
    return new Date();
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [, setSedes] = useState<Sede[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dias, setDias] = useState<DiaConfig[]>([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<'semana' | 'lista'>('semana');
  
  // Info del torneo
  const [torneoInfo, setTorneoInfo] = useState<TorneoInfo | null>(null);
  
  // Toast notifications
  const { showSuccess, showError } = useToast();
  
  // Confirm modal hook
  const confirmState = useConfirm();
  const { confirm } = confirmState;
  
  // ═══════════════════════════════════════════════════════════
  // STEP 1: Canchas para Finales
  // ═══════════════════════════════════════════════════════════
  const [canchasFinales, setCanchasFinales] = useState<string[]>([]);
  const [horaInicioFinales, setHoraInicioFinales] = useState('18:00');
  const [guardandoFinales, setGuardandoFinales] = useState(false);
  const [showSuccessFinales, setShowSuccessFinales] = useState(false);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 2: Configurar Días de Juego
  // ═══════════════════════════════════════════════════════════
  const [nuevoDia, setNuevoDia] = useState<{
    fecha: string;
    horaInicio: string;
    horaFin: string;
    minutosSlot: number;
    canchaIds?: string[];
  }>({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
    canchaIds: undefined,
  });
  const [guardandoDia, setGuardandoDia] = useState(false);
  const [showSuccessDia, setShowSuccessDia] = useState(false);
  const [showCopiarDia, setShowCopiarDia] = useState(false);
  const [diaOrigen, setDiaOrigen] = useState('');
  const [diaDestino, setDiaDestino] = useState('');
  
  // ═══════════════════════════════════════════════════════════
  // MODAL: Gestionar Sedes
  // ═══════════════════════════════════════════════════════════
  const [showAgregarSede, setShowAgregarSede] = useState(false);
  const [todasSedes, setTodasSedes] = useState<any[]>([]);
  const [sedesLoading, setSedesLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const slotsLibres = slots.filter(s => s.estado === 'LIBRE').length;
    const slotsOcupados = slots.filter(s => s.estado === 'OCUPADO').length;
    const canchasActivas = canchas.length;
    const diasConfigurados = dias.filter(d => d.activo).length;
    
    return {
      totalSlots,
      slotsLibres,
      slotsOcupados,
      porcentajeOcupacion: totalSlots > 0 ? Math.round((slotsOcupados / totalSlots) * 100) : 0,
      canchasActivas,
      diasConfigurados,
    };
  }, [slots, canchas, dias]);

  const weekStart = useMemo(() => {
    const d = new Date(currentWeek);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentWeek]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    loadData();
    loadTorneoInfo();
  }, [tournamentId, currentWeek]);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════

  const loadTorneoInfo = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/overview`);
      if (data.success) {
        setTorneoInfo({
          id: data.data.torneo.id,
          nombre: data.data.torneo.nombre,
          sedePrincipal: data.data.torneo.sede,
          fechaFinales: data.data.torneo.fechaFinales,
        });
        // Cargar config de finales si existe
        if (data.data.torneo.canchasFinales?.length > 0) {
          setCanchasFinales(data.data.torneo.canchasFinales);
        }
        if (data.data.torneo.horaInicioFinales) {
          setHoraInicioFinales(data.data.torneo.horaInicioFinales);
        }
      }
    } catch (error) {
      console.error('Error cargando info del torneo:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, sedesData] = await Promise.all([
        disponibilidadService.getDisponibilidad(tournamentId),
        sedesService.getAll(),
      ]);
      
      setSedes(data.sedes);
      setTodasSedes(sedesData || []);
      
      const canchasConColor = data.canchas.map((c: any, i: number) => ({
        ...c,
        color: CANCHA_COLORS[i % CANCHA_COLORS.length],
      }));
      setCanchas(canchasConColor);
      setDias(data.dias || []);
      
      // Load slots for current week
      const slotsRes = await disponibilidadService.getSlotsPorSemana(
        tournamentId,
        getDateOnlyPY(weekStart),
        getDateOnlyPY(weekEnd)
      );
      setSlots(slotsRes.slots || []);
      
      // Init filter with all canchas
      if (canchasConColor.length > 0 && canchasFiltradas.size === 0) {
        setCanchasFiltradas(new Set(canchasConColor.map((c: Cancha) => c.id)));
      }
      
      // Si no hay canchas para finales seleccionadas, sugerir las primeras
      if (canchasFinales.length === 0 && canchasConColor.length > 0) {
        setCanchasFinales([canchasConColor[0].id]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodasSedes = async () => {
    setSedesLoading(true);
    try {
      const { data } = await api.get('/admin/sedes');
      setTodasSedes(data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    } finally {
      setSedesLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - STEP 1: Finales
  // ═══════════════════════════════════════════════════════════

  const handleGuardarFinales = async () => {
    if (canchasFinales.length === 0) {
      showError('Error', 'Selecciona al menos una cancha para las finales');
      return;
    }

    setGuardandoFinales(true);
    try {
      const result = await disponibilidadService.actualizarFinales(tournamentId, {
        canchasFinales,
        horaInicioFinales,
      });
      
      if (result.success) {
        // Generar slots para finales automáticamente
        if (fechaFinales || torneoInfo?.fechaFinales) {
          const fechaFinal = fechaFinales || torneoInfo?.fechaFinales;
          // Convertir fecha ISO a YYYY-MM-DD
          const fechaStr = typeof fechaFinal === 'string' 
            ? fechaFinal.split('T')[0] 
            : getDateOnlyPY(fechaFinal);
          // Buscar o crear día para finales
          const resultDia = await disponibilidadService.configurarDia(tournamentId, {
            fecha: fechaStr,
            horaInicio: horaInicioFinales,
            horaFin: '23:00',
            minutosSlot: 90,
          });
          
          if (resultDia?.dia?.id) {
            await disponibilidadService.generarSlots(tournamentId, resultDia.dia.id, canchasFinales);
          }
        }
        
        setShowSuccessFinales(true);
        await loadData();
        await loadTorneoInfo();
      } else {
        showError('Error', result.message || 'No se pudo guardar la configuración');
      }
    } catch (error: any) {
      console.error('Error guardando config de finales:', error);
      showError('Error', error.response?.data?.message || 'Error guardando configuración');
    } finally {
      setGuardandoFinales(false);
    }
  };

  const toggleCanchaFinal = (canchaId: string) => {
    if (canchasFinales.includes(canchaId)) {
      setCanchasFinales(canchasFinales.filter(id => id !== canchaId));
    } else {
      setCanchasFinales([...canchasFinales, canchaId]);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - STEP 2: Días de Juego
  // ═══════════════════════════════════════════════════════════

  const handleGuardarDia = async () => {
    if (!nuevoDia.fecha) {
      showError('Error', 'Selecciona una fecha');
      return;
    }
    
    setGuardandoDia(true);
    try {
      // 1. Configurar el día
      const result = await disponibilidadService.configurarDia(tournamentId, {
        fecha: nuevoDia.fecha,
        horaInicio: nuevoDia.horaInicio,
        horaFin: '23:00', // Siempre 23:00
        minutosSlot: nuevoDia.minutosSlot,
      });
      
      // 2. Generar slots para ese día
      if (result?.dia?.id) {
        await disponibilidadService.generarSlots(
          tournamentId, 
          result.dia.id, 
          nuevoDia.canchaIds
        );
      }
      
      // 3. Mostrar éxito y recargar
      setShowSuccessDia(true);
      await loadData();
      
      // 4. Resetear formulario
      setNuevoDia({
        fecha: '',
        horaInicio: '18:00',
        horaFin: '23:00',
        minutosSlot: 90,
        canchaIds: undefined,
      });
    } catch (error: any) {
      console.error('[CanchasManager] Error guardando día:', error);
      showError('Error', error.response?.data?.message || 'Error guardando día');
    } finally {
      setGuardandoDia(false);
    }
  };

  const handleEliminarDia = async (diaId: string, fecha: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar día?',
      message: `Se eliminará el día ${formatDatePY(fecha)} y todos sus slots. Esta acción no se puede deshacer.`,
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await disponibilidadService.eliminarDia(tournamentId, diaId);
      showSuccess('Día eliminado', 'El día y todos sus slots han sido eliminados');
      await loadData();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'No se pudo eliminar el día');
    }
  };

  const handleCopiarDia = async () => {
    if (!diaOrigen || !diaDestino) return;
    
    try {
      const diaOrigenConfig = dias.find(d => d.fecha === diaOrigen);
      if (!diaOrigenConfig) {
        showError('Error', 'Día origen no encontrado');
        return;
      }
      
      // 1. Crear nuevo día con misma config
      const result = await disponibilidadService.configurarDia(tournamentId, {
        fecha: diaDestino,
        horaInicio: diaOrigenConfig.horaInicio,
        horaFin: '23:00',
        minutosSlot: diaOrigenConfig.minutosSlot,
      });
      
      // 2. Generar slots
      if (result?.dia?.id) {
        await disponibilidadService.generarSlots(tournamentId, result.dia.id);
      }
      
      await loadData();
      setShowCopiarDia(false);
      setDiaOrigen('');
      setDiaDestino('');
      showSuccess('Configuración copiada', 'El día ha sido configurado exitosamente');
    } catch (error: any) {
      console.error('[CanchasManager] Error copiando día:', error);
      showError('Error', error.response?.data?.message || 'Error copiando día');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Sedes
  // ═══════════════════════════════════════════════════════════

  const handleAgregarSede = async (sedeId: string) => {
    try {
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      await loadData();
      setShowAgregarSede(false);
      showSuccess('Sede agregada', 'La sede ha sido agregada al torneo');
    } catch (error: any) {
      console.error('Error agregando sede:', error);
      showError('Error', error.response?.data?.message || 'Error agregando sede');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Filtros y Vista
  // ═══════════════════════════════════════════════════════════

  const toggleCanchaFilter = (canchaId: string) => {
    const newSet = new Set(canchasFiltradas);
    if (newSet.has(canchaId)) {
      newSet.delete(canchaId);
    } else {
      newSet.add(canchaId);
    }
    setCanchasFiltradas(newSet);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER - LOADING
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER - MAIN
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════
          HEADER SIEMPRE VISIBLE - Stats y Gestionar Sedes
          ═══════════════════════════════════════════════════════════ */}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Slots"
          value={stats.totalSlots}
          subtext={`${stats.diasConfigurados} días`}
          color="blue"
          icon={Grid3X3}
        />
        <StatCard
          label="Libres"
          value={stats.slotsLibres}
          subtext="Disponibles"
          color="green"
          icon={CheckCircle2}
        />
        <StatCard
          label="Ocupados"
          value={stats.slotsOcupados}
          subtext={`${stats.porcentajeOcupacion}% uso`}
          color="amber"
          icon={BarChart3}
        />
        <StatCard
          label="Canchas"
          value={stats.canchasActivas}
          subtext="Activas"
          color="purple"
          icon={MapPin}
        />
      </div>

      {/* Botón Gestionar Sedes */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            loadTodasSedes();
            setShowAgregarSede(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#151921] hover:bg-[#232838] border border-[#232838] text-white rounded-xl transition-colors text-sm font-medium"
        >
          <Building2 className="w-4 h-4" />
          Gestionar Sedes
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STEP 1: Canchas para Finales
          ═══════════════════════════════════════════════════════════ */}
      
      <section className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#232838]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
              <span className="text-[#df2531] font-bold text-sm">1</span>
            </div>
            <h2 className="text-lg font-bold text-white">Step 1: Canchas para Finales</h2>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            Selecciona las canchas que serán usadas en las finales. Se recomienda usar N canchas según la cantidad de categorías habilitadas.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Alerta si no hay fecha de finales */}
          {!fechaFinales && !torneoInfo?.fechaFinales && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No hay fecha de finales configurada en el torneo. Configúrala primero en la pestaña "Info".
              </p>
            </div>
          )}

          {/* Grid de canchas seleccionables */}
          <div>
            <label className="text-sm text-gray-400 mb-3 block">Selecciona las canchas para finales</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {canchas.length === 0 ? (
                <div className="col-span-full p-4 bg-[#0B0E14] rounded-xl border border-[#232838]">
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No hay canchas configuradas. Agrega sedes primero.
                  </p>
                </div>
              ) : (
                canchas.map((cancha) => {
                  const isSelected = canchasFinales.includes(cancha.id);
                  return (
                    <button
                      key={cancha.id}
                      onClick={() => toggleCanchaFinal(cancha.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? `${cancha.color.bg} ${cancha.color.border} ${cancha.color.text}`
                          : 'bg-[#0B0E14] border-[#232838] text-gray-400 hover:border-[#df2531]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {cancha.nombre}
                          </p>
                          <p className="text-xs opacity-70 mt-1">{cancha.sedeNombre}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-[#df2531] flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selector de hora de inicio */}
          <div className="bg-[#0B0E14] rounded-xl p-4 border border-[#232838]">
            <label className="flex items-center gap-2 text-sm text-white font-medium mb-2">
              <Clock className="w-4 h-4 text-[#df2531]" />
              Hora de inicio de las Finales
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Este será el horario de inicio para las finales de todas las categorías.
            </p>
            <input
              type="time"
              value={horaInicioFinales}
              onChange={(e) => setHoraInicioFinales(e.target.value)}
              className="px-4 py-2 bg-[#151921] border border-[#232838] rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
            />
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleGuardarFinales}
            disabled={guardandoFinales || canchasFinales.length === 0 || (!fechaFinales && !torneoInfo?.fechaFinales)}
            className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {guardandoFinales ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Guardando...
              </>
            ) : !fechaFinales && !torneoInfo?.fechaFinales ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Configura fecha de finales primero
              </>
            ) : canchasFinales.length === 0 ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Selecciona al menos una cancha
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Guardar Configuración de Finales
              </>
            )}
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STEP 2: Configurar Horarios Fase Regular
          ═══════════════════════════════════════════════════════════ */}
      
      <section className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#232838]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
              <span className="text-[#df2531] font-bold text-sm">2</span>
            </div>
            <h2 className="text-lg font-bold text-white">Step 2: Configurar Días de Juego</h2>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            Configura el horario de inicio para cada día de juego. Los slots se generarán automáticamente hasta las 23:00 hs.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Lista de días ya configurados */}
          {dias.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-400">Días configurados</label>
                {dias.length > 0 && (
                  <button
                    onClick={() => setShowCopiarDia(true)}
                    className="text-xs text-[#df2531] hover:text-[#ff2d3a] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar configuración
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {dias.filter(d => d.activo).map((dia) => (
                  <div
                    key={dia.id}
                    className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl border border-[#232838]"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#df2531]" />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {formatDatePY(dia.fecha)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dia.horaInicio} - {dia.horaFin} • {dia.minutosSlot} min/slot • {dia.totalSlots} slots
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400">{dia.slotsLibres} libres</span>
                      <button
                        onClick={() => handleEliminarDia(dia.id, dia.fecha)}
                        className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Eliminar día"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario para agregar nuevo día */}
          <div className="bg-[#0B0E14] rounded-xl p-4 border border-[#232838]">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#df2531]" />
              Agregar nuevo día
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Selector de fecha */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Fecha</label>
                <input
                  type="date"
                  value={nuevoDia.fecha}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                  min={fechaInicio}
                  max={fechaFin}
                  className="w-full px-3 py-2 bg-[#151921] border border-[#232838] rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
                />
              </div>

              {/* Selector de hora de inicio */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={nuevoDia.horaInicio}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#151921] border border-[#232838] rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Los partidos se jugarán hasta las 23:00 hs
                </p>
              </div>
            </div>

            {/* Selector de duración */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">Duración de partido</label>
              <div className="flex gap-2">
                {[60, 90, 120].map((minutos) => (
                  <button
                    key={minutos}
                    onClick={() => setNuevoDia({ ...nuevoDia, minutosSlot: minutos })}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      nuevoDia.minutosSlot === minutos
                        ? 'bg-[#df2531] text-white'
                        : 'bg-[#151921] text-gray-400 border border-[#232838] hover:border-[#df2531]/30'
                    }`}
                  >
                    {minutos} min
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de canchas */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-2 block">Canchas disponibles este día</label>
              <div className="flex flex-wrap gap-2">
                {canchas.length === 0 ? (
                  <p className="text-xs text-amber-400">No hay canchas configuradas.</p>
                ) : (
                  canchas.map((cancha) => {
                    // Si canchaIds es undefined, todas están seleccionadas por defecto
                    const isSelected = nuevoDia.canchaIds === undefined ? true : nuevoDia.canchaIds.includes(cancha.id);
                    return (
                      <button
                        key={cancha.id}
                        onClick={() => {
                          // Inicializar con todas las canchas si es undefined
                          const currentIds = nuevoDia.canchaIds === undefined ? canchas.map(c => c.id) : nuevoDia.canchaIds;
                          if (isSelected) {
                            // Deseleccionar
                            const newIds = currentIds.filter(id => id !== cancha.id);
                            setNuevoDia({ ...nuevoDia, canchaIds: newIds });
                          } else {
                            // Seleccionar
                            setNuevoDia({ ...nuevoDia, canchaIds: [...currentIds, cancha.id] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                          isSelected
                            ? `${cancha.color.bg} ${cancha.color.text} border ${cancha.color.border}`
                            : 'bg-[#151921] text-gray-500 border border-[#232838]'
                        }`}
                      >
                        {cancha.nombre}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Haz clic para seleccionar/deseleccionar canchas para este día
              </p>
            </div>

            {/* Botón Agregar Día */}
            <button
              onClick={handleGuardarDia}
              disabled={!nuevoDia.fecha || guardandoDia}
              className="w-full py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {guardandoDia ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Generando slots...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Agregar Día y Generar Slots
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CALENDARIO DE VISUALIZACIÓN
          ═══════════════════════════════════════════════════════════ */}
      
      <section className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
        {/* Header del calendario */}
        <div className="flex items-center justify-between p-4 border-b border-[#232838]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const d = new Date(currentWeek);
                d.setDate(d.getDate() - 7);
                setCurrentWeek(d);
              }}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <span className="text-white font-medium">
              {weekStart.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentWeek);
                d.setDate(d.getDate() + 7);
                setCurrentWeek(d);
              }}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Vista toggle */}
          <div className="flex bg-[#0B0E14] rounded-xl border border-[#232838] overflow-hidden">
            <button
              onClick={() => setVista('semana')}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                vista === 'semana' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Semana
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                vista === 'lista' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
          </div>
        </div>

        {/* Filtro de canchas */}
        {canchas.length > 0 && (
          <div className="p-4 border-b border-[#232838]">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-400">Filtrar canchas:</span>
              {canchas.map((cancha) => (
                <button
                  key={cancha.id}
                  onClick={() => toggleCanchaFilter(cancha.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    canchasFiltradas.has(cancha.id)
                      ? `${cancha.color.bg} ${cancha.color.text} border ${cancha.color.border}`
                      : 'bg-[#0B0E14] text-gray-500 border border-[#232838]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${cancha.color.text.replace('text-', 'bg-')}`} />
                  <span className="flex flex-col items-start leading-tight">
                    <span>{cancha.nombre}</span>
                    <span className="text-[9px] opacity-70">{cancha.sedeNombre}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid del calendario */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-4">
            {vista === 'semana' ? (
              <VistaSemana 
                slots={slots} 
                weekDays={weekDays} 
                canchasFiltradas={canchasFiltradas}
                canchas={canchas}
                dias={dias}
              />
            ) : (
              <VistaLista 
                slots={slots} 
                canchas={canchas}
                dias={dias}
                tournamentId={tournamentId}
                onRefresh={loadData}
              />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════════════════════ */}
      
      <AnimatePresence>
        {/* Modal: Gestionar Sedes */}
        {showAgregarSede && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAgregarSede(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151921] rounded-2xl border border-[#232838] max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#df2531]" />
                  Gestionar Sedes
                </h3>
                <button
                  onClick={() => setShowAgregarSede(false)}
                  className="p-2 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sedesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
                    />
                  </div>
                ) : todasSedes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay sedes disponibles</p>
                ) : (
                  todasSedes.map((sede: any) => (
                    <button
                      key={sede.id}
                      onClick={() => handleAgregarSede(sede.id)}
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
                            <p className="text-xs text-gray-600">{sede.canchas?.length || 0} canchas</p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-gray-600 group-hover:text-[#df2531]" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowAgregarSede(false)}
                className="w-full mt-4 py-3 bg-[#232838] hover:bg-[#2a3042] text-white rounded-xl"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Copiar Día */}
        {showCopiarDia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Copy className="w-5 h-5 text-[#df2531]" />
                  Copiar Configuración
                </h3>
                <button onClick={() => setShowCopiarDia(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Día origen (configurado)</label>
                  <select
                    value={diaOrigen}
                    onChange={(e) => setDiaOrigen(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {dias.filter(d => d.activo).map((dia) => (
                      <option key={dia.id} value={dia.fecha}>
                        {formatDatePY(dia.fecha)} ({dia.horaInicio} - {dia.horaFin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Día destino</label>
                  <select
                    value={diaDestino}
                    onChange={(e) => setDiaDestino(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {fechaInicio && fechaFin && getDatesRangePY(fechaInicio, fechaFin)
                      .filter(f => !dias.find(d => d.fecha === f.fecha))
                      .map((f) => (
                        <option key={f.fecha} value={f.fecha}>
                          {formatDatePY(f.fecha)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCopiarDia(false)}
                    className="flex-1 py-3 bg-[#232838] hover:bg-[#2a3042] text-white rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCopiarDia}
                    disabled={!diaOrigen || !diaDestino}
                    className="flex-1 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 text-white rounded-xl"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          CONFIRM MODALS
          ═══════════════════════════════════════════════════════════ */}
      
      {/* ConfirmModal de éxito para Finales */}
      <ConfirmModal
        isOpen={showSuccessFinales}
        onClose={() => setShowSuccessFinales(false)}
        onConfirm={() => setShowSuccessFinales(false)}
        title="¡Configuración Guardada!"
        message="Las canchas y horario para finales han sido guardadas correctamente. Los slots se han generado automáticamente."
        confirmText="Entendido"
        variant="success"
      />

      {/* ConfirmModal de éxito para Día */}
      <ConfirmModal
        isOpen={showSuccessDia}
        onClose={() => setShowSuccessDia(false)}
        onConfirm={() => setShowSuccessDia(false)}
        title="¡Día Agregado!"
        message="El día ha sido configurado y los slots se han generado automáticamente hasta las 23:00 hs."
        confirmText="Entendido"
        variant="success"
      />

      {/* ConfirmModal para confirmaciones generales */}
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
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════

function StatCard({ label, value, subtext, color, icon: Icon }: {
  label: string;
  value: number;
  subtext: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
  icon: React.ElementType;
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`rounded-2xl p-4 border ${colors[color]} bg-[#151921]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-xs">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs opacity-70">{subtext}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISTA SEMANA - Grid tipo Google Calendar
// ═══════════════════════════════════════════════════════════

interface VistaSemanaProps {
  slots: Slot[];
  weekDays: Date[];
  canchasFiltradas: Set<string>;
  canchas: Cancha[];
  dias: DiaConfig[];
}

function VistaSemana({ slots, weekDays, canchasFiltradas, canchas, dias }: VistaSemanaProps) {
  const canchasToShow = canchasFiltradas.size > 0 
    ? canchasFiltradas 
    : new Set(canchas.map(c => c.id));

  const normalizedSlots = slots.map(s => ({
    ...s,
    fecha: s.fecha.split('T')[0]
  }));
  
  const filteredSlots = normalizedSlots.filter(s => canchasToShow.has(s.cancha.id));

  const getSlotsForDayAndHour = (day: Date, hour: string) => {
    const fechaStr = day.toISOString().split('T')[0];
    return filteredSlots.filter(s => {
      if (s.fecha !== fechaStr) return false;
      return s.horaInicio.startsWith(hour.split(':')[0]);
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header de días */}
        <div className="grid grid-cols-8 border-b border-white/10 sticky top-0 bg-[#0B0E14] z-10">
          <div className="p-3 border-r border-white/10" />
          {weekDays.map((day, i) => {
            const fechaStr = day.toISOString().split('T')[0];
            const diaConfig = dias.find(d => d.fecha === fechaStr);
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={i} className={`p-3 text-center border-r border-white/10 ${isToday ? 'bg-[#df2531]/10' : ''}`}>
                <div className={`text-xs font-medium ${isToday ? 'text-[#df2531]' : 'text-gray-500'}`}>
                  {day.toLocaleDateString('es-PY', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </div>
                {diaConfig && (
                  <div className="text-[10px] text-gray-500 mt-1">
                    {diaConfig.horaInicio}-{diaConfig.horaFin}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid de horas */}
        <div className="relative">
          {HORAS_CALENDARIO.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-white/5 min-h-[60px]">
              <div className="p-2 border-r border-white/10 text-xs text-gray-500 text-right sticky left-0 bg-[#0B0E14]">
                {hour}
              </div>
              
              {weekDays.map((day, dayIndex) => {
                const hourSlots = getSlotsForDayAndHour(day, hour);
                return (
                  <div
                    key={dayIndex}
                    className="border-r border-white/5 p-1 relative group hover:bg-white/[0.02] transition-colors"
                  >
                    {hourSlots.length > 0 && (
                      <div className="space-y-1">
                        {hourSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`text-[10px] px-2 py-1 rounded border truncate ${
                              slot.estado === 'OCUPADO' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : slot.estado === 'BLOQUEADO'
                                ? 'bg-gray-700 text-gray-500 border-gray-600'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={`${slot.cancha.nombre} (${slot.cancha.sedeNombre}): ${slot.horaInicio}-${slot.horaFin}`}
                          >
                            <div className="font-medium truncate">{slot.cancha.nombre}</div>
                            <div className="text-[9px] opacity-70 truncate">{slot.cancha.sedeNombre}</div>
                            <div className="opacity-70">{slot.horaInicio}-{slot.horaFin}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {filteredSlots.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No hay slots en esta semana</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISTA LISTA - Lista de slots agrupados por día
// ═══════════════════════════════════════════════════════════

interface VistaListaProps {
  slots: Slot[];
  canchas: Cancha[];
  dias: DiaConfig[];
  tournamentId: string;
  onRefresh: () => void;
}

function VistaLista({ slots, canchas, dias, tournamentId, onRefresh }: VistaListaProps) {
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();

  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, Slot[]>();
    slots.forEach(slot => {
      const fecha = slot.fecha.split('T')[0];
      if (!grouped.has(fecha)) {
        grouped.set(fecha, []);
      }
      grouped.get(fecha)!.push(slot);
    });
    return grouped;
  }, [slots]);

  const sortedDates = useMemo(() => {
    return Array.from(slotsByDate.keys()).sort();
  }, [slotsByDate]);

  const handleEliminarDia = async (fecha: string) => {
    const fechaNormalizada = fecha.split('T')[0];
    const diaConfig = dias.find(d => {
      const diaFecha = typeof d.fecha === 'string' ? d.fecha.split('T')[0] : new Date(d.fecha).toISOString().split('T')[0];
      return diaFecha === fechaNormalizada;
    });
    
    if (!diaConfig) {
      showError('Error', 'No se encontró la configuración del día');
      return;
    }

    const daySlots = slotsByDate.get(fecha) || [];
    const slotsOcupados = daySlots.filter(s => s.estado === 'OCUPADO' || s.match).length;
    const slotsLibres = daySlots.filter(s => s.estado === 'LIBRE' && !s.match).length;

    let title = '¿Eliminar día?';
    let message = '';
    
    if (slotsOcupados > 0) {
      title = '¿Eliminar slots libres?';
      message = `Este día tiene ${slotsOcupados} partido(s) programado(s). Solo se eliminarán los ${slotsLibres} slots libres.`;
    } else {
      message = `Se eliminará completamente el día ${fecha.split('-').reverse().join('/')}. Esta acción no se puede deshacer.`;
    }

    const confirmed = await confirm({
      title,
      message,
      variant: slotsOcupados > 0 ? 'warning' : 'danger',
    });

    if (!confirmed) return;

    try {
      const result = await disponibilidadService.eliminarDia(tournamentId, diaConfig.id);
      
      if (result.parcial) {
        showSuccess(
          'Slots libres eliminados', 
          `Se eliminaron ${result.eliminados} slots libres.`
        );
      } else {
        showSuccess('Día eliminado', 'El día y todos sus slots han sido eliminados');
      }
      
      onRefresh();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'No se pudo eliminar el día');
    }
  };

  if (slots.length === 0) {
    return (
      <div className="p-4 text-center py-12 text-gray-500">
        <p>No hay slots configurados</p>
        <p className="text-sm mt-2">Agrega días y genera slots para verlos aquí</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
      {sortedDates.map((fecha) => {
        const daySlots = slotsByDate.get(fecha) || [];
        const slotsLibres = daySlots.filter(s => s.estado === 'LIBRE').length;
        const slotsOcupados = daySlots.filter(s => s.estado === 'OCUPADO').length;
        
        const canchasDelDia = [...new Set(daySlots.map(s => s.cancha.id))]
          .map(id => canchas.find(c => c.id === id))
          .filter(Boolean) as Cancha[];
        
        const horarios = [...new Set(daySlots.map(s => s.horaInicio))].sort();
        
        const slotMap = new Map<string, Map<string, Slot>>();
        daySlots.forEach(slot => {
          if (!slotMap.has(slot.horaInicio)) {
            slotMap.set(slot.horaInicio, new Map());
          }
          slotMap.get(slot.horaInicio)!.set(slot.cancha.id, slot);
        });
        
        return (
          <div key={fecha} className="bg-[#0B0E14] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#151921] border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="text-white font-medium">
                  {fecha.split('-').reverse().join('/')}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400">{slotsLibres} libres</span>
                  {slotsOcupados > 0 && (
                    <span className="text-red-400">{slotsOcupados} ocupados</span>
                  )}
                  <span className="text-gray-500">{daySlots.length} total</span>
                </div>
              </div>
              <button
                onClick={() => handleEliminarDia(fecha)}
                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Eliminar día
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium w-16">Hora</th>
                    {canchasDelDia.map(cancha => (
                      <th key={cancha.id} className="px-3 py-2 text-center text-xs text-gray-400 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${cancha.color.text.replace('text-', 'bg-')}`} />
                          <span className="flex flex-col items-center">
                            <span>{cancha.nombre}</span>
                            <span className="text-[9px] opacity-70">{cancha.sedeNombre}</span>
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {horarios.map(hora => (
                    <tr key={hora} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-xs text-gray-500">{hora}</td>
                      {canchasDelDia.map(cancha => {
                        const slot = slotMap.get(hora)?.get(cancha.id);
                        return (
                          <td key={cancha.id} className="px-3 py-2 text-center">
                            {slot ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${
                                slot.estado === 'OCUPADO' 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : slot.estado === 'BLOQUEADO'
                                  ? 'bg-gray-700 text-gray-500'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {slot.estado === 'LIBRE' ? 'Libre' : slot.estado === 'OCUPADO' ? 'Ocupado' : 'Bloqueado'}
                              </span>
                            ) : (
                              <span className="text-gray-700">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
