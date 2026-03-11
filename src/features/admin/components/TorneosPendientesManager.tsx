import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, User, CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

interface TorneoPendiente {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  flyerUrl?: string;
  estado: 'BORRADOR' | 'PENDIENTE_APROBACION';
  createdAt: string;
  organizador: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  categorias: Array<{
    category: {
      nombre: string;
      tipo: string;
    };
  }>;
  _count: {
    inscripciones: number;
  };
}

export function TorneosPendientesManager() {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState<TorneoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/torneos/pendientes-aprobacion');
      if (data.success) {
        setTorneos(data.torneos);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando torneos');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id: string) => {
    if (!confirm('¿Estás seguro de aprobar este torneo? Aparecerá públicamente en la lista de torneos.')) return;
    
    setProcessing(id);
    try {
      const { data } = await api.post(`/admin/torneos/${id}/aprobar`);
      if (data.success) {
        setTorneos(prev => prev.filter(t => t.id !== id));
        alert('Torneo aprobado exitosamente');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error aprobando torneo');
    } finally {
      setProcessing(null);
    }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt('¿Por qué deseas rechazar este torneo? (opcional)');
    if (motivo === null) return; // Cancelado
    
    setProcessing(id);
    try {
      const { data } = await api.post(`/admin/torneos/${id}/rechazar`, { motivo });
      if (data.success) {
        setTorneos(prev => prev.filter(t => t.id !== id));
        alert('Torneo rechazado');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error rechazando torneo');
    } finally {
      setProcessing(null);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <button 
          onClick={loadTorneos}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (torneos.length === 0) {
    return (
      <div className="bg-[#151921] border border-[#232838] rounded-xl p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">¡Todo al día!</h3>
        <p className="text-gray-400">No hay torneos pendientes de aprobación</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#151921] border border-[#232838] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{torneos.length}</p>
              <p className="text-gray-400 text-sm">Pendientes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#151921] border border-[#232838] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {torneos.filter(t => t.estado === 'BORRADOR').length}
              </p>
              <p className="text-gray-400 text-sm">En borrador</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#151921] border border-[#232838] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {torneos.filter(t => t.estado === 'PENDIENTE_APROBACION').length}
              </p>
              <p className="text-gray-400 text-sm">Por aprobar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de torneos */}
      <div className="grid grid-cols-1 gap-4">
        {torneos.map((torneo) => (
          <motion.div
            key={torneo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#151921] border border-[#232838] rounded-xl overflow-hidden hover:border-[#df2531]/50 transition-colors"
          >
            <div className="flex flex-col md:flex-row">
              {/* Flyer */}
              <div className="w-full md:w-48 h-32 md:h-auto bg-[#0B0E14] flex-shrink-0">
                {torneo.flyerUrl ? (
                  <img 
                    src={torneo.flyerUrl} 
                    alt={torneo.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Trophy className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        torneo.estado === 'BORRADOR' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {torneo.estado === 'BORRADOR' ? 'Borrador' : 'Pendiente Aprobación'}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Creado {new Date(torneo.createdAt).toLocaleDateString('es-PY')}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{torneo.nombre}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatFecha(torneo.fechaInicio)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {torneo.ciudad}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {torneo.organizador.nombre} {torneo.organizador.apellido}
                      </div>
                    </div>

                    {torneo.categorias.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {torneo.categorias.map((cat, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-1 rounded text-xs ${
                              cat.category.tipo === 'FEMENINO'
                                ? 'bg-pink-500/20 text-pink-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {cat.category.nombre}
                          </span>
                        ))}
                      </div>
                    )}

                    {torneo.descripcion && (
                      <p className="text-gray-400 text-sm line-clamp-2">{torneo.descripcion}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/t/${torneo.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#232838] text-gray-300 rounded-lg hover:bg-[#2d3548] transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver
                    </button>
                    
                    <button
                      onClick={() => handleAprobar(torneo.id)}
                      disabled={processing === torneo.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                    >
                      {processing === torneo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Aprobar
                    </button>
                    
                    <button
                      onClick={() => handleRechazar(torneo.id)}
                      disabled={processing === torneo.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
