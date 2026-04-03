import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/ToastProvider';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  ChevronLeft, User, Filter 
} from 'lucide-react';

interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  precio?: number; // Opcional - los precios se manejan fuera de la plataforma
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';
  user?: {
    nombre: string;
    apellido: string;
    telefono?: string;
  };
  sedeCancha?: {
    nombre: string;
  };
  createdAt: string;
}

export default function ReservasSedePage() {
  const { sedeId } = useParams<{ sedeId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [fechaFiltro, setFechaFiltro] = useState('');

  useEffect(() => {
    if (sedeId) {
      cargarReservas();
    }
  }, [sedeId]);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (fechaFiltro) params.fecha = fechaFiltro;
      
      const response = await api.get(`/alquileres/sede/${sedeId}/reservas`, { params });
      setReservas(response.data);
    } catch (err) {
      showError('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (reservaId: string) => {
    try {
      await api.post(`/alquileres/reservas/${reservaId}/aprobar`);
      showSuccess('Éxito', 'Reserva aprobada');
      cargarReservas();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo aprobar');
    }
  };

  const handleRechazar = async (reservaId: string) => {
    const motivo = prompt('Motivo del rechazo (opcional):');
    try {
      await api.post(`/alquileres/reservas/${reservaId}/rechazar`, { motivo });
      showSuccess('Éxito', 'Reserva rechazada');
      cargarReservas();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo rechazar');
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA': return 'bg-green-500/20 text-green-400';
      case 'PENDIENTE': return 'bg-yellow-500/20 text-yellow-400';
      case 'CANCELADA':
      case 'RECHAZADA': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA': return <CheckCircle className="w-4 h-4" />;
      case 'PENDIENTE': return <AlertCircle className="w-4 h-4" />;
      case 'CANCELADA':
      case 'RECHAZADA': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const reservasFiltradas = reservas.filter(r => 
    filtroEstado === 'TODAS' || r.estado === filtroEstado
  );

  const reservasPendientes = reservas.filter(r => r.estado === 'PENDIENTE').length;
  const reservasHoy = reservas.filter(r => {
    const hoy = new Date().toISOString().split('T')[0];
    return r.fecha === hoy;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/mis-sedes')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Reservas</h1>
            <p className="text-gray-400">Gestiona las reservas de tu sede</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Total Reservas</p>
            <p className="text-2xl font-bold">{reservas.length}</p>
          </div>
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-400">{reservasPendientes}</p>
          </div>
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Hoy</p>
            <p className="text-2xl font-bold text-primary">{reservasHoy}</p>
          </div>
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Confirmadas</p>
            <p className="text-2xl font-bold text-green-400">
              {reservas.filter(r => r.estado === 'CONFIRMADA').length}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-[#0B0E14] border border-[#232838] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#df2531]"
              >
                <option value="TODAS">Todas las reservas</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-[#0B0E14] border border-[#232838] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#df2531]"
              />
              {fechaFiltro && (
                <button
                  onClick={() => setFechaFiltro('')}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Limpiar
                </button>
              )}
            </div>

            <button
              onClick={cargarReservas}
              className="ml-auto px-4 py-2 bg-[#df2531] hover:bg-[#c41f2a] rounded-lg text-sm font-medium transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Lista de Reservas */}
        <div className="space-y-4">
          {reservasFiltradas.length === 0 ? (
            <div className="bg-[#151921] rounded-xl border border-[#232838] p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay reservas</h3>
              <p className="text-gray-400">
                {filtroEstado === 'TODAS' 
                  ? 'Aún no tienes reservas en tu sede'
                  : `No hay reservas con estado "${filtroEstado}"`
                }
              </p>
            </div>
          ) : (
            reservasFiltradas.map((reserva) => (
              <div
                key={reserva.id}
                className="bg-[#151921] rounded-xl border border-[#232838] p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getEstadoColor(reserva.estado)}`}>
                      {getEstadoIcon(reserva.estado)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                          {reserva.estado}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDate(reserva.fecha)}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {reserva.sedeCancha?.nombre || 'Cancha'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {reserva.horaInicio} - {reserva.horaFin}
                        </span>
                        {reserva.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {reserva.user.nombre} {reserva.user.apellido}
                          </span>
                        )}
                      </div>
                      {reserva.user?.telefono && (
                        <p className="text-sm text-gray-500 mt-1">
                          Tel: {reserva.user.telefono}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-xs text-gray-500">
                        Solicitada: {new Date(reserva.createdAt).toLocaleDateString('es-PY')}
                      </p>
                    </div>
                    
                    {reserva.estado === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => handleAprobar(reserva.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(reserva.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
