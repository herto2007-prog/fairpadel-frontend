import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/ToastProvider';
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, 
  CreditCard, X, Plus
} from 'lucide-react';

interface Cancha {
  id: string;
  nombre: string;
  tipo: string;
}

interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';
  nombreExterno?: string;
  documentoExterno?: string;
  telefonoExterno?: string;
  notas?: string;
  user?: {
    nombre: string;
    apellido: string;
    telefono?: string;
  };
}

interface Slot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  reserva?: Reserva;
}

interface PanelReservasVisualProps {
  sedeId: string;
}

export default function PanelReservasVisual({ sedeId }: PanelReservasVisualProps) {
  const { showSuccess, showError } = useToast();
  
  // Estado
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de reserva
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{cancha: Cancha, slot: Slot} | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    notas: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, [sedeId, fecha]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar canchas de la sede
      const canchasRes = await api.get(`/sedes/${sedeId}/canchas`);
      setCanchas(canchasRes.data);
      
      // Cargar reservas del día
      const reservasRes = await api.get(`/alquileres/sede/${sedeId}/reservas`, {
        params: { fecha }
      });
      setReservas(reservasRes.data);
      
      // Cargar disponibilidades
      const dispRes = await api.get(`/alquileres/sede/${sedeId}/disponibilidades`);
      setDisponibilidades(dispRes.data);
    } catch (err) {
      showError('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Generar slots para una cancha
  const generarSlots = (canchaId: string): Slot[] => {
    const slots: Slot[] = [];
    
    // Encontrar disponibilidades para esta cancha y día de la semana
    const diaSemana = new Date(fecha).getDay();
    const dispsCancha = disponibilidades.filter(d => 
      d.sedeCanchaId === canchaId && d.diaSemana === diaSemana
    );
    
    // Filtrar reservas activas
    const reservasActivas = reservas.filter(r => 
      r.estado !== 'CANCELADA' && r.estado !== 'RECHAZADA'
    );

    // Generar slots de 1 hora
    for (const disp of dispsCancha) {
      let horaActual = parseTimeToMinutes(disp.horaInicio);
      const horaFin = parseTimeToMinutes(disp.horaFin) || 24 * 60; // 00:00 = 24:00
      
      while (horaActual < horaFin) {
        const slotInicio = formatTimeFromMinutes(horaActual);
        const slotFin = formatTimeFromMinutes(horaActual + 60);
        
        // Verificar si hay reserva en este slot
        const reservaExistente = reservasActivas.find(r => {
          const resInicio = parseTimeToMinutes(r.horaInicio);
          const resFin = parseTimeToMinutes(r.horaFin);
          const slotStart = parseTimeToMinutes(slotInicio);
          const slotEnd = parseTimeToMinutes(slotFin);
          
          // Verificar solapamiento
          return slotStart < resFin && slotEnd > resInicio;
        });
        
        slots.push({
          horaInicio: slotInicio,
          horaFin: slotFin,
          disponible: !reservaExistente,
          reserva: reservaExistente
        });
        
        horaActual += 60;
      }
    }
    
    return slots.sort((a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio));
  };

  // Helpers para manejo de tiempo
  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Navegación de fechas
  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFecha(nuevaFecha.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${dias[date.getDay()]}, ${day} ${meses[date.getMonth()]}`;
  };

  // Handlers
  const handleSlotClick = (cancha: Cancha, slot: Slot) => {
    if (!slot.disponible) return;
    setSelectedSlot({ cancha, slot });
    setFormData({ nombre: '', documento: '', telefono: '', notas: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    try {
      setSubmitting(true);
      
      await api.post('/alquileres/reservas', {
        sedeCanchaId: selectedSlot.cancha.id,
        fecha,
        horaInicio: selectedSlot.slot.horaInicio,
        horaFin: selectedSlot.slot.horaFin,
        duracionMinutos: 60,
        nombreExterno: formData.nombre,
        documentoExterno: formData.documento,
        telefonoExterno: formData.telefono,
        notas: formData.notas
      });
      
      showSuccess('Éxito', 'Reserva creada correctamente');
      setShowModal(false);
      cargarDatos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  // Generar todos los slots para cada cancha
  const slotsPorCancha = useMemo(() => {
    const result: Record<string, Slot[]> = {};
    for (const cancha of canchas) {
      result[cancha.id] = generarSlots(cancha.id);
    }
    return result;
  }, [canchas, disponibilidades, reservas, fecha]);

  // Obtener todas las horas únicas para las filas
  const todasLasHoras = useMemo(() => {
    const horas = new Set<string>();
    for (const slots of Object.values(slotsPorCancha)) {
      for (const slot of slots) {
        horas.add(slot.horaInicio);
      }
    }
    return Array.from(horas).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  }, [slotsPorCancha]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#151921] rounded-xl border border-[#232838] overflow-hidden">
      {/* Header con navegación de fecha */}
      <div className="p-4 border-b border-[#232838] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#df2531]" />
            <span className="text-lg font-semibold min-w-[150px] text-center">
              {formatDateDisplay(fecha)}
            </span>
          </div>
          
          <button
            onClick={() => cambiarFecha(1)}
            className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-[#0B0E14] border border-[#232838] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#df2531]"
        />
      </div>

      {/* Grid de canchas */}
      {canchas.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          No hay canchas configuradas para esta sede
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header de canchas */}
            <div className="grid" style={{ gridTemplateColumns: `80px repeat(${canchas.length}, 1fr)` }}>
              <div className="p-3 border-r border-b border-[#232838] bg-[#0B0E14]">
                <Clock className="w-4 h-4 mx-auto text-gray-400" />
              </div>
              {canchas.map(cancha => (
                <div key={cancha.id} className="p-3 border-r border-b border-[#232838] bg-[#0B0E14] text-center">
                  <p className="font-semibold text-sm">{cancha.nombre}</p>
                  <p className="text-xs text-gray-400">{cancha.tipo}</p>
                </div>
              ))}
            </div>

            {/* Filas de horarios */}
            {todasLasHoras.map(hora => (
              <div 
                key={hora} 
                className="grid" 
                style={{ gridTemplateColumns: `80px repeat(${canchas.length}, 1fr)` }}
              >
                {/* Columna de hora */}
                <div className="p-3 border-r border-b border-[#232838] bg-[#0B0E14] text-center text-sm text-gray-400">
                  {hora}
                </div>
                
                {/* Slots de cada cancha */}
                {canchas.map(cancha => {
                  const slot = slotsPorCancha[cancha.id]?.find(s => s.horaInicio === hora);
                  
                  if (!slot) {
                    return (
                      <div 
                        key={cancha.id} 
                        className="p-2 border-r border-b border-[#232838] bg-[#0B0E14]/50"
                      />
                    );
                  }
                  
                  return (
                    <div
                      key={cancha.id}
                      onClick={() => handleSlotClick(cancha, slot)}
                      className={`
                        p-2 border-r border-b border-[#232838] relative group cursor-pointer
                        transition-all duration-200 min-h-[60px]
                        ${slot.disponible 
                          ? 'bg-green-500/10 hover:bg-green-500/20' 
                          : 'bg-red-500/10 hover:bg-red-500/20'
                        }
                      `}
                    >
                      {slot.disponible ? (
                        <div className="flex items-center justify-center h-full">
                          <Plus className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-center">
                          <p className="text-xs text-red-400 font-medium truncate">
                            Ocupado
                          </p>
                          
                          {/* Tooltip en hover */}
                          <div className="absolute inset-0 bg-[#1a1f2e] border border-[#df2531] rounded m-1 p-2 
                                        opacity-0 group-hover:opacity-100 pointer-events-none z-20
                                        shadow-xl transition-opacity">
                            {slot.reserva?.user ? (
                              <>
                                <p className="text-xs font-semibold text-white">
                                  {slot.reserva.user.nombre} {slot.reserva.user.apellido}
                                </p>
                                {slot.reserva.user.telefono && (
                                  <p className="text-xs text-gray-400">{slot.reserva.user.telefono}</p>
                                )}
                              </>
                            ) : slot.reserva?.nombreExterno ? (
                              <>
                                <p className="text-xs font-semibold text-white">{slot.reserva.nombreExterno}</p>
                                {slot.reserva.documentoExterno && (
                                  <p className="text-xs text-gray-400">CI: {slot.reserva.documentoExterno}</p>
                                )}
                                {slot.reserva.telefonoExterno && (
                                  <p className="text-xs text-gray-400">{slot.reserva.telefonoExterno}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">Reserva sin detalles</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de reserva */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-[#232838] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Nueva Reserva</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 p-3 bg-[#0B0E14] rounded-lg">
              <p className="text-sm text-gray-400">Cancha</p>
              <p className="font-semibold">{selectedSlot.cancha.nombre}</p>
              <p className="text-sm text-gray-400 mt-2">Horario</p>
              <p className="font-semibold">{selectedSlot.slot.horaInicio} - {selectedSlot.slot.horaFin}</p>
              <p className="text-sm text-gray-400 mt-2">Fecha</p>
              <p className="font-semibold">{formatDateDisplay(fecha)}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-2 focus:outline-none focus:border-[#df2531]"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  required
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-2 focus:outline-none focus:border-[#df2531]"
                  placeholder="Ej: 1234567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-2 focus:outline-none focus:border-[#df2531]"
                  placeholder="Ej: 0981 123456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-2 focus:outline-none focus:border-[#df2531] h-20 resize-none"
                  placeholder="Alguna nota especial..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#232838] hover:bg-[#2d3548] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#df2531] hover:bg-[#c41f2a] rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
