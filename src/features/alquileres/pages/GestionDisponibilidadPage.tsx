import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/ToastProvider';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { 
  Clock, Plus, Trash2, ChevronLeft, Lock 
} from 'lucide-react';

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

interface Cancha {
  cancha: {
    id: string;
    nombre: string;
    tipo: string;
  };
  disponibilidades: Disponibilidad[];
}

interface Bloqueo {
  id: string;
  sedeCanchaId?: string;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
  sedeCancha?: {
    id: string;
    nombre: string;
  };
}

const DIAS_SEMANA = [
  { id: 0, nombre: 'Domingo', corto: 'Dom' },
  { id: 1, nombre: 'Lunes', corto: 'Lun' },
  { id: 2, nombre: 'Martes', corto: 'Mar' },
  { id: 3, nombre: 'Miércoles', corto: 'Mié' },
  { id: 4, nombre: 'Jueves', corto: 'Jue' },
  { id: 5, nombre: 'Viernes', corto: 'Vie' },
  { id: 6, nombre: 'Sábado', corto: 'Sáb' },
];

export default function GestionDisponibilidadPage() {
  const { sedeId } = useParams<{ sedeId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'horarios' | 'bloqueos'>('horarios');
  
  // Form para nueva disponibilidad
  const [selectedCancha, setSelectedCancha] = useState('');
  const [selectedDia, setSelectedDia] = useState(1);
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('22:00');
  
  // Form para nuevo bloqueo
  const [bloqueoCancha, setBloqueoCancha] = useState(''); // '' = todas
  const [bloqueoFechaInicio, setBloqueoFechaInicio] = useState('');
  const [bloqueoFechaFin, setBloqueoFechaFin] = useState('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  useEffect(() => {
    if (sedeId) {
      cargarDatos();
    }
  }, [sedeId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dispData, bloqData] = await Promise.all([
        api.get(`/alquileres/sede/${sedeId}/disponibilidades`),
        api.get(`/alquileres/sede/${sedeId}/bloqueos`),
      ]);
      setCanchas(dispData.data);
      setBloqueos(bloqData.data);
    } catch (err) {
      showError('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarDisponibilidad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/alquileres/disponibilidades', {
        sedeCanchaId: selectedCancha,
        diaSemana: selectedDia,
        horaInicio,
        horaFin,
      });
      showSuccess('Éxito', 'Horario agregado correctamente');
      cargarDatos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo agregar el horario');
    }
  };

  const handleEliminarDisponibilidad = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/alquileres/disponibilidades/${id}`);
      showSuccess('Éxito', 'Horario eliminado');
      cargarDatos();
    } catch (err) {
      showError('Error', 'No se pudo eliminar el horario');
    }
  };

  const handleAgregarBloqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/alquileres/bloqueos', {
        sedeId,
        sedeCanchaId: bloqueoCancha || undefined,
        fechaInicio: bloqueoFechaInicio,
        fechaFin: bloqueoFechaFin || bloqueoFechaInicio,
        motivo: bloqueoMotivo,
      });
      showSuccess('Éxito', 'Bloqueo agregado correctamente');
      setBloqueoFechaInicio('');
      setBloqueoFechaFin('');
      setBloqueoMotivo('');
      cargarDatos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo agregar el bloqueo');
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await api.delete(`/alquileres/bloqueos/${id}`);
      showSuccess('Éxito', 'Bloqueo eliminado');
      cargarDatos();
    } catch (err) {
      showError('Error', 'No se pudo eliminar el bloqueo');
    }
  };

  const formatDiaSemana = (dia: number) => DIAS_SEMANA.find(d => d.id === dia)?.nombre || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/mis-torneos')}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Canchas</h1>
            <p className="text-white/60">Configurar horarios y bloqueos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('horarios')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'horarios'
                ? 'text-[#df2531] border-[#df2531]'
                : 'text-white/60 border-transparent hover:text-white'
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            Horarios de Atención
          </button>
          <button
            onClick={() => setActiveTab('bloqueos')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'bloqueos'
                ? 'text-[#df2531] border-[#df2531]'
                : 'text-white/60 border-transparent hover:text-white'
            }`}
          >
            <Lock size={16} className="inline mr-2" />
            Bloqueos (Feriados)
          </button>
        </div>

        {activeTab === 'horarios' ? (
          <div className="space-y-6">
            {/* Form para agregar horario */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Agregar Horario</h2>
              <form onSubmit={handleAgregarDisponibilidad} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Cancha</label>
                  <select
                    value={selectedCancha}
                    onChange={(e) => setSelectedCancha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                    required
                  >
                    <option value="" className="bg-dark">Seleccionar...</option>
                    {canchas.map((c) => (
                      <option key={c.cancha.id} value={c.cancha.id} className="bg-dark">
                        {c.cancha.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Día</label>
                  <select
                    value={selectedDia}
                    onChange={(e) => setSelectedDia(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.id} value={d.id} className="bg-dark">
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Hora Fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Agregar
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de horarios por cancha */}
            <div className="space-y-4">
              {canchas.map((cancha) => (
                <div key={cancha.cancha.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {cancha.cancha.nombre}
                    <span className="text-white/40 text-sm ml-2">({cancha.cancha.tipo})</span>
                  </h3>
                  
                  {cancha.disponibilidades.length === 0 ? (
                    <p className="text-white/40 text-sm">No hay horarios configurados</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {cancha.disponibilidades.map((disp) => (
                        <div
                          key={disp.id}
                          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                        >
                          <div>
                            <p className="text-white font-medium">{formatDiaSemana(disp.diaSemana)}</p>
                            <p className="text-white/60 text-sm">
                              {disp.horaInicio} - {disp.horaFin}
                            </p>
                          </div>
                          <button
                            onClick={() => handleEliminarDisponibilidad(disp.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Form para agregar bloqueo */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Agregar Bloqueo</h2>
              <form onSubmit={handleAgregarBloqueo} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Cancha (opcional)</label>
                  <select
                    value={bloqueoCancha}
                    onChange={(e) => setBloqueoCancha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                  >
                    <option value="" className="bg-dark">Todas las canchas</option>
                    {canchas.map((c) => (
                      <option key={c.cancha.id} value={c.cancha.id} className="bg-dark">
                        {c.cancha.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={bloqueoFechaInicio}
                    onChange={(e) => setBloqueoFechaInicio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Fecha Fin (opcional)</label>
                  <input
                    type="date"
                    value={bloqueoFechaFin}
                    onChange={(e) => setBloqueoFechaFin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Motivo (opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bloqueoMotivo}
                      onChange={(e) => setBloqueoMotivo(e.target.value)}
                      placeholder="Ej: Mantenimiento"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#df2531]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Lista de bloqueos */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bloqueos Activos</h3>
              
              {bloqueos.length === 0 ? (
                <p className="text-white/40 text-sm">No hay bloqueos configurados</p>
              ) : (
                <div className="space-y-3">
                  {bloqueos.map((bloqueo) => (
                    <div
                      key={bloqueo.id}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <Lock size={18} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {bloqueo.fechaInicio === bloqueo.fechaFin 
                              ? bloqueo.fechaInicio
                              : `${bloqueo.fechaInicio} al ${bloqueo.fechaFin}`
                            }
                          </p>
                          <p className="text-white/60 text-sm">
                            {bloqueo.sedeCancha 
                              ? bloqueo.sedeCancha.nombre 
                              : 'Todas las canchas'
                            }
                            {bloqueo.motivo && ` • ${bloqueo.motivo}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEliminarBloqueo(bloqueo.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
