import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/ToastProvider';
import { 
  Calendar, Clock, Users, MapPin, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, BarChart3, PieChart
} from 'lucide-react';

interface EstadisticasData {
  periodo: {
    mes: number;
    año: number;
    fechaInicio: string;
    fechaFin: string;
  };
  resumen: {
    totalReservas: number;
    variacionReservas: number;
    confirmadas: number;
    pendientes: number;
    canceladas: number;
    rechazadas: number;
    tasaCancelacion: number;
    horasAlquiladas: number;
  };
  reservasPorCancha: {
    canchaId: string;
    canchaNombre: string;
    total: number;
    confirmadas: number;
    horas: number;
  }[];
  horariosTop: { hora: string; count: number }[];
  diasTop: { dia: string; count: number }[];
  clientesTop: { nombre: string; count: number }[];
}

interface EstadisticasReservasProps {
  sedeId: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function EstadisticasReservas({ sedeId }: EstadisticasReservasProps) {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EstadisticasData | null>(null);
  
  // Mes seleccionado (default: mes actual)
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    cargarEstadisticas();
  }, [sedeId, mesSeleccionado]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/alquileres/sede/${sedeId}/estadisticas`, {
        params: { mes: mesSeleccionado }
      });
      setData(response.data);
    } catch (err) {
      showError('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (direccion: number) => {
    const [año, mes] = mesSeleccionado.split('-').map(Number);
    const nuevaFecha = new Date(año, mes - 1 + direccion, 1);
    const nuevoMes = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}`;
    setMesSeleccionado(nuevoMes);
  };

  const formatMes = (mesStr: string) => {
    const [año, mes] = mesStr.split('-').map(Number);
    return `${MESES[mes - 1]} ${año}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-gray-400">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación de mes */}
      <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#df2531]" />
            Resumen del Mes
          </h3>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-lg font-semibold min-w-[150px] text-center">
              {formatMes(mesSeleccionado)}
            </span>
            
            <button
              onClick={() => cambiarMes(1)}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Reservas</p>
            <Calendar className="w-4 h-4 text-[#df2531]" />
          </div>
          <p className="text-2xl font-bold">{data.resumen.totalReservas}</p>
          <div className={`flex items-center gap-1 text-sm mt-1 ${
            data.resumen.variacionReservas >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.resumen.variacionReservas >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(data.resumen.variacionReservas)}% vs mes ant.
          </div>
        </div>

        <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Horas Alquiladas</p>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold">{data.resumen.horasAlquiladas}h</p>
          <p className="text-xs text-gray-500 mt-1">Solo confirmadas/pendientes</p>
        </div>

        <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Tasa Cancelación</p>
            <PieChart className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold">{data.resumen.tasaCancelacion}%</p>
          <p className="text-xs text-gray-500 mt-1">{data.resumen.canceladas} canceladas</p>
        </div>

        <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Confirmadas</p>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
          </div>
          <p className="text-2xl font-bold text-green-400">{data.resumen.confirmadas}</p>
          <p className="text-xs text-gray-500 mt-1">{data.resumen.pendientes} pendientes</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservas por cancha */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#df2531]" />
            Por Cancha
          </h4>
          
          {data.reservasPorCancha.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay datos</p>
          ) : (
            <div className="space-y-3">
              {data.reservasPorCancha.map(c => {
                const maxHoras = Math.max(...data.reservasPorCancha.map(x => x.horas), 1);
                const porcentaje = (c.horas / maxHoras) * 100;
                
                return (
                  <div key={c.canchaId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{c.canchaNombre}</span>
                      <span className="text-gray-400">{c.horas}h / {c.total} reservas</span>
                    </div>
                    <div className="h-2 bg-[#232838] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#df2531] rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Horarios más ocupados */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#df2531]" />
            Horarios Más Ocupados
          </h4>
          
          {data.horariosTop.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay datos</p>
          ) : (
            <div className="space-y-3">
              {data.horariosTop.map((h, i) => {
                const maxCount = data.horariosTop[0]?.count || 1;
                const porcentaje = (h.count / maxCount) * 100;
                
                return (
                  <div key={h.hora}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#232838] text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        {h.hora}
                      </span>
                      <span className="text-gray-400">{h.count} reservas</span>
                    </div>
                    <div className="h-2 bg-[#232838] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Días más ocupados */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#df2531]" />
            Días Más Solicitados
          </h4>
          
          {data.diasTop.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay datos</p>
          ) : (
            <div className="space-y-3">
              {data.diasTop.map((d, i) => {
                const maxCount = data.diasTop[0]?.count || 1;
                const porcentaje = (d.count / maxCount) * 100;
                
                return (
                  <div key={d.dia}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#232838] text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        {d.dia}
                      </span>
                      <span className="text-gray-400">{d.count} reservas</span>
                    </div>
                    <div className="h-2 bg-[#232838] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clientes más frecuentes */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#df2531]" />
            Clientes Más Frecuentes
          </h4>
          
          {data.clientesTop.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay datos</p>
          ) : (
            <div className="space-y-3">
              {data.clientesTop.map((c, i) => {
                const maxCount = data.clientesTop[0]?.count || 1;
                const porcentaje = (c.count / maxCount) * 100;
                
                return (
                  <div key={c.nombre}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded bg-[#232838] text-xs flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="truncate">{c.nombre}</span>
                      </span>
                      <span className="text-gray-400 flex-shrink-0">{c.count} reservas</span>
                    </div>
                    <div className="h-2 bg-[#232838] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
