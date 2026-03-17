import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Calendar, GripVertical, Clock } from 'lucide-react';
import { PartidoReal } from './ProgramacionManager';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';
import { getColorFase } from '../../utils/faseColors';
import { useToast } from '../../../../components/ui/ToastProvider';
import { programacionService } from './programacionService';

interface VistaDragDropProps {
  partidos: PartidoReal[];
  canchas: { id: string; nombre: string; sede: string }[];
  cargando: boolean;
  onActualizar: () => void;
}

interface Slot {
  id: string;
  fecha: string;
  hora: string;
  canchaId: string;
  canchaNombre: string;
  sedeNombre: string;
  partidoId?: string;
}

export function VistaDragDrop({ partidos, canchas, cargando, onActualizar }: VistaDragDropProps) {
  const { showSuccess, showError } = useToast();
  const [arrastrando, setArrastrando] = useState(false);

  // Partidos pendientes (draggables)
  const partidosPendientes = useMemo(() => {
    return partidos.filter(p => !p.fechaProgramada || !p.horaProgramada);
  }, [partidos]);

  // Usar canchas pasadas como prop (del torneo), no extraer de partidos

  const fechasDisponibles = useMemo(() => {
    const fechas = new Set<string>();
    partidos.forEach(p => {
      if (p.fechaProgramada) {
        fechas.add(new Date(p.fechaProgramada).toISOString().split('T')[0]);
      }
    });
    return Array.from(fechas).sort();
  }, [partidos]);

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(fechasDisponibles[0] || '');

  // Horarios
  const horarios = useMemo(() => {
    const horas: string[] = [];
    for (let h = 8; h < 22; h += 1.5) {
      const hora = Math.floor(h);
      const minutos = (h % 1) * 60;
      horas.push(`${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
    }
    return horas;
  }, []);

  // Slots disponibles para la fecha seleccionada
  const slots = useMemo(() => {
    const slotsArray: Slot[] = [];
    horarios.forEach(hora => {
      canchas.forEach(cancha => {
        // Verificar si hay un partido ya asignado
        const partidoAsignado = partidos.find(p => {
          if (!p.fechaProgramada || !p.horaProgramada) return false;
          const fechaP = new Date(p.fechaProgramada).toISOString().split('T')[0];
          return fechaP === fechaSeleccionada && 
                 p.horaProgramada === hora && 
                 p.torneoCanchaId === cancha.id;
        });

        slotsArray.push({
          id: `${fechaSeleccionada}-${hora}-${cancha.id}`,
          fecha: fechaSeleccionada,
          hora,
          canchaId: cancha.id,
          canchaNombre: cancha.nombre,
          sedeNombre: cancha.sede,
          partidoId: partidoAsignado?.id,
        });
      });
    });
    return slotsArray;
  }, [fechaSeleccionada, horarios, canchas, partidos]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [partidoArrastrado, setPartidoArrastrado] = useState<PartidoReal | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const partido = partidosPendientes.find(p => p.id === active.id);
    if (partido) {
      setPartidoArrastrado(partido);
      setArrastrando(true);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setArrastrando(false);
    setPartidoArrastrado(null);

    if (!over) return;

    const partidoId = active.id as string;
    const slotId = over.id as string;

    // Buscar el slot
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.partidoId) return; // Slot ocupado

    // Buscar el partido
    const partido = partidos.find(p => p.id === partidoId);
    if (!partido) return;

    // Guardar
    try {
      await programacionService.actualizarPartido(
        partidoId,
        slot.fecha,
        slot.hora,
        slot.canchaId
      );
      showSuccess('Éxito', 'Partido programado correctamente');
      onActualizar();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Error al programar');
    }
  };

  // getColorFase se importa desde utils/faseColors

  if (cargando) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full mx-auto mb-4"
        />
        <p className="text-neutral-400">Cargando...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Header con selector de fecha */}
        <div className="flex items-center justify-between bg-white/[0.02] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-[#df2531]" />
            <div>
              <p className="text-sm text-neutral-400">Fecha</p>
              <select
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:border-[#df2531] focus:outline-none"
              >
                {fechasDisponibles.map(fecha => (
                  <option key={fecha} value={fecha}>
                    {new Date(fecha).toLocaleDateString('es-PY', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-400">
            Arrastra los partidos a los slots disponibles
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Panel de partidos pendientes */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-neutral-500" />
              Partidos Pendientes ({partidosPendientes.length})
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {partidosPendientes.map(partido => (
                <DraggablePartido 
                  key={partido.id} 
                  partido={partido} 
                  getColorFase={getColorFase}
                />
              ))}
              
              {partidosPendientes.length === 0 && (
                <div className="bg-white/[0.02] rounded-lg p-4 text-center border border-white/5">
                  <p className="text-sm text-neutral-500">¡Todos los partidos están programados!</p>
                </div>
              )}
            </div>
          </div>

          {/* Grid de slots */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
              {/* Header de canchas */}
              <div 
                className="grid border-b border-white/5 bg-black/20"
                style={{ gridTemplateColumns: `100px repeat(${canchas.length}, 1fr)` }}
              >
                <div className="p-3 border-r border-white/5 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-neutral-500" />
                </div>
                {canchas.map(cancha => (
                  <div key={cancha.id} className="p-3 text-center border-r border-white/5 last:border-r-0">
                    <p className="text-sm font-medium text-white">{cancha.nombre}</p>
                    <p className="text-xs text-neutral-500">{cancha.sede}</p>
                  </div>
                ))}
              </div>

              {/* Filas de horarios */}
              <div className="divide-y divide-white/5">
                {horarios.map(hora => (
                  <div 
                    key={hora}
                    className="grid"
                    style={{ gridTemplateColumns: `100px repeat(${canchas.length}, 1fr)` }}
                  >
                    <div className="p-3 border-r border-white/5 bg-black/10 flex items-center justify-center">
                      <span className="text-sm text-neutral-400">{hora}</span>
                    </div>
                    
                    {canchas.map(cancha => {
                      const slot = slots.find(s => s.hora === hora && s.canchaId === cancha.id);
                      const partidoEnSlot = slot?.partidoId 
                        ? partidos.find(p => p.id === slot.partidoId)
                        : null;

                      return (
                        <DroppableSlot
                          key={`${hora}-${cancha.id}`}
                          slot={slot!}
                          partido={partidoEnSlot}
                          getColorFase={getColorFase}
                          estaArrastrando={arrastrando}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {partidoArrastrado ? (
          <div className="bg-white/[0.1] backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-2xl rotate-3">
            <div className="flex items-center gap-2">
              <ParejaAvatar 
                jugador1={partidoArrastrado.inscripcion1?.jugador1}
                jugador2={partidoArrastrado.inscripcion1?.jugador2}
                size="sm"
              />
              <span className="text-sm text-white">
                {partidoArrastrado.inscripcion1?.jugador1.apellido}
              </span>
              <span className="text-neutral-400 text-xs">vs</span>
              <ParejaAvatar 
                jugador1={partidoArrastrado.inscripcion2?.jugador1}
                jugador2={partidoArrastrado.inscripcion2?.jugador2}
                size="sm"
              />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Componente de partido arrastrable
import { useDraggable } from '@dnd-kit/core';

interface DraggablePartidoProps {
  partido: PartidoReal;
  getColorFase: (fase: string) => string;
}

function DraggablePartido({ partido, getColorFase }: DraggablePartidoProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: partido.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-[#df2531]/50 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
          {partido.fase}
        </span>
        <span className="text-[10px] text-neutral-500">{partido.categoriaNombre}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <ParejaAvatar 
          jugador1={partido.inscripcion1?.jugador1}
          jugador2={partido.inscripcion1?.jugador2}
          size="sm"
        />
        <span className="text-[10px] text-neutral-400">vs</span>
        <ParejaAvatar 
          jugador1={partido.inscripcion2?.jugador1}
          jugador2={partido.inscripcion2?.jugador2}
          size="sm"
        />
      </div>
    </div>
  );
}

// Componente de slot donde se puede soltar
import { useDroppable } from '@dnd-kit/core';

interface DroppableSlotProps {
  slot: Slot;
  partido?: PartidoReal | null;
  getColorFase: (fase: string) => string;
  estaArrastrando: boolean;
}

function DroppableSlot({ slot, partido, getColorFase, estaArrastrando }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    disabled: !!partido, // Deshabilitar si está ocupado
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-2 border-r border-white/5 last:border-r-0 min-h-[80px] transition-all ${
        partido 
          ? 'bg-emerald-500/5' 
          : isOver 
            ? 'bg-[#df2531]/20 border-[#df2531]' 
            : estaArrastrando 
              ? 'bg-white/[0.02] border-dashed border-white/10' 
              : 'bg-transparent'
      }`}
    >
      {partido ? (
        <div className="h-full flex flex-col justify-between">
          <span className={`text-[9px] px-1.5 py-0.5 rounded border self-start ${getColorFase(partido.fase)}`}>
            {partido.fase}
          </span>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <ParejaAvatar 
                jugador1={partido.inscripcion1?.jugador1}
                jugador2={partido.inscripcion1?.jugador2}
                size="sm"
              />
              <span className="text-[10px] text-white truncate">
                {partido.inscripcion1?.jugador1.apellido}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ParejaAvatar 
                jugador1={partido.inscripcion2?.jugador1}
                jugador2={partido.inscripcion2?.jugador2}
                size="sm"
              />
              <span className="text-[10px] text-white truncate">
                {partido.inscripcion2?.jugador1.apellido}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={`h-full flex items-center justify-center transition-all ${
          isOver ? 'scale-110' : ''
        }`}>
          {estaArrastrando && (
            <div className="w-3 h-3 rounded-full bg-[#df2531]/50" />
          )}
        </div>
      )}
    </div>
  );
}
