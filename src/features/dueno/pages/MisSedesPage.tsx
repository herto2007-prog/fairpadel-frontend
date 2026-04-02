import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, CreditCard, CheckCircle, AlertCircle, 
  ChevronRight, Settings, MapPin 
} from 'lucide-react';
import { duenoService, SedeDelDueno } from '../../../services/duenoService';
import { useToast } from '../../../components/ui/ToastProvider';

export default function MisSedesPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [sedes, setSedes] = useState<SedeDelDueno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMisSedes();
  }, []);

  const loadMisSedes = async () => {
    try {
      setLoading(true);
      const data = await duenoService.getMisSedes();
      setSedes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron cargar tus sedes');
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Sedes</h1>
          <p className="text-gray-400">
            Gestiona tus sedes y suscripciones
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Total Sedes</p>
            <p className="text-2xl font-bold">{sedes.length}</p>
          </div>
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Suscripción Activa</p>
            <p className="text-2xl font-bold text-green-400">
              {sedes.filter(s => s.alquilerConfig?.suscripcionActiva).length}
            </p>
          </div>
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-4">
            <p className="text-gray-400 text-sm">Sin Suscripción</p>
            <p className="text-2xl font-bold text-yellow-400">
              {sedes.filter(s => !s.alquilerConfig?.suscripcionActiva).length}
            </p>
          </div>
        </div>

        {/* Lista de Sedes */}
        <div className="space-y-4">
          {sedes.map((sede) => (
            <motion.div
              key={sede.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#151921] rounded-xl border border-[#232838] overflow-hidden"
            >
              <div className={`p-6 ${!sede.activa ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      sede.activa ? 'bg-[#df2531]/20' : 'bg-gray-700'
                    }`}>
                      <Building2 className={`w-7 h-7 ${sede.activa ? 'text-[#df2531]' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{sede.nombre}</h3>
                      <p className="text-gray-400 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {sede.ciudad}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sede.alquilerConfig?.suscripcionActiva ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Activa
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Sin suscripción
                      </span>
                    )}
                  </div>
                </div>

                {/* Info de suscripción */}
                {sede.alquilerConfig?.suscripcionActiva && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-400">
                          Suscripción activa hasta:
                        </p>
                        <p className="text-white font-medium">
                          {formatDate(sede.alquilerConfig.suscripcionVenceEn)}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => navigate(`/sede/${sede.id}/suscripcion`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {sede.alquilerConfig?.suscripcionActiva ? 'Gestionar Suscripción' : 'Suscribirse'}
                  </button>
                  
                  <button
                    onClick={() => navigate(`/sede/${sede.id}/disponibilidad`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Gestionar Canchas
                  </button>

                  <div className="ml-auto flex items-center gap-2 text-gray-400 text-sm">
                    <span>{sede._count?.canchas || 0} canchas</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {sedes.length === 0 && (
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes sedes asignadas</h3>
            <p className="text-gray-400 mb-4">
              Contacta al administrador para que te asigne como dueño de una sede.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
