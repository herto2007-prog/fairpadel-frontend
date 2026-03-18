import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, ChevronLeft, ChevronRight, 
  MapPin, Plus, AlertCircle
} from 'lucide-react';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';
import { getColorFase } from '../../utils/faseColors';
import { PartidoReal } from './ProgramacionManager';
import { formatDatePY, parseDatePY } from '../../../../utils/date';

interface VistaCalendarioProps {
  partidos: PartidoReal[];
  canchas: { id: string; nombre: string; sede: string }[];
  cargando: boolean;
  onEditar: (partido: PartidoReal) => void;
  onProgramarNuevo: (fecha: string, hora: string, canchaId: string) => void;
}

export function VistaCalendario({ 
  partidos, 
  canchas,
  cargando, 
  onEditar,
  onProgramarNuevo 
}: VistaCalendarioProps) {
  // Obtener fechas únicas de los partidos programados
  const fechasDisponibles = useMemo(() => {
    const fechas = new Set<string>();
    partidos.forEach(p => {
      if (p.fechaProgramada) {
        fechas.add(new Date(p.fechaProgramada).toISOString().split('T')[0]);
      }
    });
    return Array.from(fechas).sort();
  }, [partidos]);

  // Fecha seleccionada (por defecto la primera)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(fechasDisponibles[0] || '');

  // Usar canchas pasadas como prop (del torneo), no extraer de partidos
  // Esto permite ver el calendario aunque no haya partidos programados

  // Horarios disponibles (de 08:00 a 22:00 cada 1.5h)
  const horarios = useMemo(() => {
    const horas: string[] = [];
    for (let h = 8; h < 22; h += 1.5) {
      const hora = Math.floor(h);
      const minutos = (h % 1) * 60;
      horas.push(`${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
    }
    return horas;
  }, []);

  // Construir grid de slots
  const grid = useMemo(() => {
    if (!fechaSeleccionada || canchas.length === 0) return [];

    return horarios.map(hora => {
      return canchas.map(cancha => {
        // Buscar si hay un partido en este slot
        const partido = partidos.find(p => {
          if (!p.fechaProgramada || !p.horaProgramada) return false;
          const fechaP = new Date(p.fechaProgramada).toISOString().split('T')[0];
          return fechaP === fechaSeleccionada && 
                 p.horaProgramada === hora && 
                 p.torneoCanchaId === cancha.id;
        });

        return {
          fecha: fechaSeleccionada,
          hora,
          canchaId: cancha.id,
          canchaNombre: cancha.nombre,
          sedeNombre: cancha.sede,
          partido,
          disponible: !partido,
        };
      });
    });
  }, [fechaSeleccionada, canchas, horarios, partidos]);

  // Partidos pendientes para la fecha seleccionada
  const partidosPendientes = useMemo(() => {
    return partidos.filter(p => !p.fechaProgramada || !p.horaProgramada);
  }, [partidos]);

  // getColorFase se importa desde utils/faseColors

  if (cargando) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full mx-auto mb-4"
        />
        <p className="text-neutral-400">Cargando calendario...</p>
      </div>
    );
  }

  if (canchas.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-8 text-center">
        <MapPin className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Sin canchas configuradas</h3>
        <p className="text-sm text-neutral-500">
          Primero debes configurar las canchas y sus horarios en el tab "Canchas".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con selector de fecha */}
      <div className="flex items-center justify-between bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-[#df2531]" />
          <div>
            <p className="text-sm text-neutral-400">Fecha seleccionada</p>
            <p className="text-lg font-medium text-white">
              {fechaSeleccionada 
                ? parseDatePY(fechaSeleccionada).toLocaleDateString('es-PY', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'Sin fechas disponibles'
              }
            </p>
          </div>
        </div>

        {fechasDisponibles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idx = fechasDisponibles.indexOf(fechaSeleccionada);
                if (idx > 0) setFechaSeleccionada(fechasDisponibles[idx - 1]);
              }}
              disabled={fechasDisponibles.indexOf(fechaSeleccionada) === 0}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <select
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
            >
              {fechasDisponibles.map(fecha => (
                <option key={fecha} value={fecha}>
                  {formatDatePY(fecha)}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                const idx = fechasDisponibles.indexOf(fechaSeleccionada);
                if (idx < fechasDisponibles.length - 1) setFechaSeleccionada(fechasDisponibles[idx + 1]);
              }}
              disabled={fechasDisponibles.indexOf(fechaSeleccionada) === fechasDisponibles.length - 1}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid de Calendario */}
      {grid.length > 0 && (
        <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
          {/* Header de canchas */}
          <div className="grid border-b border-white/5" style={{ gridTemplateColumns: `80px repeat(${canchas.length}, 1fr)` }}>
            <div className="p-3 border-r border-white/5 bg-black/20">
              <Clock className="w-4 h-4 text-neutral-500 mx-auto" />
            </div>
            {canchas.map(cancha => (
              <div key={cancha.id} className="p-3 text-center border-r border-white/5 last:border-r-0 bg-black/20">
                <p className="text-sm font-medium text-white">{cancha.nombre}</p>
                <p className="text-xs text-neutral-500">{cancha.sede}</p>
              </div>
            ))}
          </div>

          {/* Filas de horarios */}
          <div className="divide-y divide-white/5">
            {grid.map((fila, idx) => (
              <div key={horarios[idx]} className="grid" style={{ gridTemplateColumns: `80px repeat(${canchas.length}, 1fr)` }}>
                {/* Columna de hora */}
                <div className="p-3 border-r border-white/5 bg-black/10 flex items-center justify-center">
                  <span className="text-sm text-neutral-400">{horarios[idx]}</span>
                </div>

                {/* Celdas de canchas */}
                {fila.map((slot) => (
                  <div 
                    key={`${slot.hora}-${slot.canchaId}`}
                    className={`p-2 border-r border-white/5 last:border-r-0 min-h-[80px] transition-colors ${
                      slot.partido 
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                        : 'bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer'
                    }`}
                    onClick={() => {
                      if (slot.partido) {
                        onEditar(slot.partido);
                      } else if (partidosPendientes.length > 0) {
                        onProgramarNuevo(slot.fecha, slot.hora, slot.canchaId);
                      }
                    }}
                  >
                    {slot.partido ? (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getColorFase(slot.partido.fase)}`}>
                            {slot.partido.fase}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <ParejaAvatar 
                              jugador1={slot.partido.inscripcion1?.jugador1}
                              jugador2={slot.partido.inscripcion1?.jugador2}
                              size="sm"
                            />
                            <span className="text-[10px] text-white truncate">
                              {slot.partido.inscripcion1?.jugador1.apellido}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ParejaAvatar 
                              jugador1={slot.partido.inscripcion2?.jugador1}
                              jugador2={slot.partido.inscripcion2?.jugador2}
                              size="sm"
                            />
                            <span className="text-[10px] text-white truncate">
                              {slot.partido.inscripcion2?.jugador1.apellido}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        {partidosPendientes.length > 0 && (
                          <Plus className="w-5 h-5 text-neutral-600 hover:text-[#df2531] transition-colors" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel de partidos pendientes */}
      {partidosPendientes.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-medium text-amber-400">
              Partidos pendientes de programar ({partidosPendientes.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {partidosPendientes.slice(0, 6).map(partido => (
              <div 
                key={partido.id}
                className="bg-white/[0.03] rounded-lg p-2 border border-white/5 hover:border-amber-500/30 transition-colors cursor-pointer"
                onClick={() => onEditar(partido)}
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
            ))}
            {partidosPendientes.length > 6 && (
              <div className="flex items-center justify-center text-xs text-neutral-500">
                +{partidosPendientes.length - 6} más
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
