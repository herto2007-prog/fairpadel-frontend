import { useState, useEffect } from 'react';

import { 
  Building2, Users, Crown,
  AlertCircle, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Filter, DollarSign,
  Calendar, MapPin, Phone, Mail
} from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';

// Tipos
type TabSuscripcion = 'sedes' | 'instructores' | 'jugadores';
type FiltroSede = 'todas' | 'activas' | 'por-vencer' | 'vencidas';

interface SuscripcionSede {
  sedeId: string;
  sedeNombre: string;
  sedeCiudad: string;
  dueno: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  } | null;
  canchasCount: number;
  suscripcionActiva: boolean;
  suscripcionVenceEn: string | null;
  tipoSuscripcion: string | null;
  diasRestantes: number;
  ultimoPago: {
    fecha: string;
    monto: number;
  } | null;
}

interface Estadisticas {
  resumen: {
    totalSedes: number;
    activas: number;
    porVencer: number;
    vencidas: number;
    tasaActivacion: number;
  };
  financiero: {
    recaudadoMes: number;
    recaudadoMesUSD: string;
  };
  historial: Array<{
    mes: string;
    cantidad: number;
    total: number;
  }>;
}

export function SuscripcionesManager() {
  const [activeTab, setActiveTab] = useState<TabSuscripcion>('sedes');
  const [filtro, setFiltro] = useState<FiltroSede>('todas');
  const [loading, setLoading] = useState(false);
  const [suscripciones, setSuscripciones] = useState<SuscripcionSede[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showError } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Cargar suscripciones
  const cargarSuscripciones = async () => {
    if (activeTab !== 'sedes') return; // Solo cargar para sedes
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/admin/suscripciones/sedes?filtro=${filtro}&page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar suscripciones');

      const data = await response.json();
      setSuscripciones(data.data);
      setTotalPages(data.meta.totalPages);
    } catch (err: any) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    if (activeTab !== 'sedes') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/admin/suscripciones/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      setEstadisticas(data);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  useEffect(() => {
    cargarSuscripciones();
    cargarEstadisticas();
  }, [activeTab, filtro, page]);

  const tabs = [
    { id: 'sedes' as TabSuscripcion, label: 'Sedes y Alquileres', icon: Building2, color: 'bg-blue-500' },
    { id: 'instructores' as TabSuscripcion, label: 'Instructores', icon: Users, color: 'bg-purple-500', proximamente: true },
    { id: 'jugadores' as TabSuscripcion, label: 'Jugadores Premium', icon: Crown, color: 'bg-amber-500', proximamente: true },
  ];

  const getEstadoBadge = (suscripcion: SuscripcionSede) => {
    if (!suscripcion.suscripcionActiva || suscripcion.diasRestantes <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
          <AlertCircle className="w-4 h-4" />
          Vencida
        </span>
      );
    }
    if (suscripcion.diasRestantes <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
          <Clock className="w-4 h-4" />
          Por vencer ({suscripcion.diasRestantes} días)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
        <CheckCircle className="w-4 h-4" />
        Activa
      </span>
    );
  };

  const formatMonto = (centavos: number) => {
    return `$${(centavos / 100).toFixed(2)} USD`;
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PY');
  };

  return (
    <div className="space-y-6">
      {/* Header con tabs */}
      <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
        <h2 className="text-xl font-bold text-white mb-2">Gestión de Suscripciones</h2>
        <p className="text-gray-400 mb-6">Monitorea y administra las suscripciones del sistema</p>

        {/* Tabs de tipo de suscripción */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.proximamente}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? `${tab.color} text-white shadow-lg`
                    : tab.proximamente
                    ? 'bg-[#0B0E14] text-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-[#0B0E14] text-gray-400 hover:text-white hover:bg-[#232838]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.proximamente && (
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                    Próx.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido según tab */}
      {activeTab === 'sedes' && (
        <>
          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Sedes</span>
                  <Building2 className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-2xl font-bold">{estadisticas.resumen.totalSedes}</p>
              </div>
              
              <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Suscripciones Activas</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-400">{estadisticas.resumen.activas}</p>
                <p className="text-xs text-gray-500">{estadisticas.resumen.tasaActivacion}% de activación</p>
              </div>
              
              <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Por Vencer (7 días)</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{estadisticas.resumen.porVencer}</p>
              </div>
              
              <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Recaudado este Mes</span>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-400">${estadisticas.financiero.recaudadoMesUSD}</p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4 bg-[#151921] rounded-xl border border-[#232838] p-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Filtrar:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'activas', label: 'Activas' },
                { id: 'por-vencer', label: 'Por Vencer' },
                { id: 'vencidas', label: 'Vencidas' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFiltro(f.id as FiltroSede);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtro === f.id
                      ? 'bg-[#df2531] text-white'
                      : 'bg-[#0B0E14] text-gray-400 hover:text-white hover:bg-[#232838]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de suscripciones */}
          <div className="bg-[#151921] rounded-xl border border-[#232838] overflow-hidden">
            <div className="p-4 border-b border-[#232838]">
              <h3 className="font-semibold">Listado de Suscripciones</h3>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#df2531]"></div>
              </div>
            ) : suscripciones.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay suscripciones para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#232838] bg-[#0B0E14]/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Sede</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Dueño</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Vencimiento</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Último Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suscripciones.map((suscripcion) => (
                      <tr key={suscripcion.sedeId} className="border-b border-[#232838]/50 hover:bg-[#232838]/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#df2531]/20 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#df2531]" />
                            </div>
                            <div>
                              <p className="font-medium">{suscripcion.sedeNombre}</p>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {suscripcion.sedeCiudad}
                              </p>
                              <p className="text-xs text-gray-500">
                                {suscripcion.canchasCount} canchas
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {suscripcion.dueno ? (
                            <div>
                              <p className="font-medium">
                                {suscripcion.dueno.nombre} {suscripcion.dueno.apellido}
                              </p>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {suscripcion.dueno.email}
                              </p>
                              {suscripcion.dueno.telefono && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {suscripcion.dueno.telefono}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Sin dueño</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {getEstadoBadge(suscripcion)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatFecha(suscripcion.suscripcionVenceEn)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {suscripcion.ultimoPago ? (
                            <div>
                              <p className="font-medium text-green-400">
                                {formatMonto(suscripcion.ultimoPago.monto)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFecha(suscripcion.ultimoPago.fecha)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#232838] flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tabs próximamente */}
      {(activeTab === 'instructores' || activeTab === 'jugadores') && (
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-12 text-center">
          <div className="w-20 h-20 bg-[#232838] rounded-full flex items-center justify-center mx-auto mb-6">
            {activeTab === 'instructores' ? (
              <Users className="w-10 h-10 text-purple-500" />
            ) : (
              <Crown className="w-10 h-10 text-amber-500" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {activeTab === 'instructores' ? 'Suscripciones de Instructores' : 'Jugadores Premium'}
          </h3>
          <p className="text-gray-400 mb-4">
            Esta funcionalidad estará disponible próximamente
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0E14] rounded-full text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            En desarrollo
          </div>
        </div>
      )}
    </div>
  );
}
