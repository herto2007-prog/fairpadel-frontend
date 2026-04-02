import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, CreditCard, CheckCircle, AlertCircle, 
  ChevronRight, Settings, MapPin, Calendar, TrendingUp, 
  Users, Clock, Smartphone, Bell, Star
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
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() => navigate(`/sede/${sede.id}/suscripcion`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {sede.alquilerConfig?.suscripcionActiva ? 'Gestionar Suscripción' : 'Suscribirse'}
                  </button>
                  
                  <button
                    onClick={() => navigate(`/sede/${sede.id}/reservas`)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Ver Reservas
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

        {/* Sección Publicitaria - Beneficios de Reservas */}
        <div className="mt-12 bg-gradient-to-br from-[#151921] via-[#1a1f2d] to-[#151921] rounded-2xl border border-[#232838] p-8 relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#df2531]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#df2531]/20 rounded-full mb-4">
                <Star className="w-4 h-4 text-[#df2531]" />
                <span className="text-sm font-medium text-[#df2531]">¡Nuevo en FairPadel!</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Sistema de <span className="text-[#df2531]">Reservas Online</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Activa tu suscripción y transforma la manera de gestionar tu sede. 
                Tus clientes reservan 24/7, vos controlás todo desde un solo panel.
              </p>
            </div>

            {/* Stats atractivos */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-[#0B0E14]/50 rounded-xl">
                <div className="text-3xl font-bold text-[#df2531] mb-1">24/7</div>
                <p className="text-sm text-gray-400">Reservas automáticas</p>
              </div>
              <div className="text-center p-4 bg-[#0B0E14]/50 rounded-xl">
                <div className="text-3xl font-bold text-green-400 mb-1">+40%</div>
                <p className="text-sm text-gray-400">Más ocupación</p>
              </div>
              <div className="text-center p-4 bg-[#0B0E14]/50 rounded-xl">
                <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
                <p className="text-sm text-gray-400">Llamadas perdidas</p>
              </div>
            </div>

            {/* Beneficios principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-[#0B0E14]/50 rounded-xl border border-[#232838]/50 hover:border-[#df2531]/30 transition-colors">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Reservas desde el celular</h4>
                  <p className="text-sm text-gray-400">Tus clientes reservan canchas en segundos, desde cualquier lugar y a cualquier hora.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#0B0E14]/50 rounded-xl border border-[#232838]/50 hover:border-[#df2531]/30 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Notificaciones automáticas</h4>
                  <p className="text-sm text-gray-400">WhatsApp y email confirmando cada reserva. Menos trabajo administrativo para vos.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#0B0E14]/50 rounded-xl border border-[#232838]/50 hover:border-[#df2531]/30 transition-colors">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Gestión inteligente</h4>
                  <p className="text-sm text-gray-400">Disponibilidad en tiempo real, cancelaciones automáticas y lista de espera.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#0B0E14]/50 rounded-xl border border-[#232838]/50 hover:border-[#df2531]/30 transition-colors">
                <div className="p-2 bg-[#df2531]/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#df2531]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Aumentá tus ingresos</h4>
                  <p className="text-sm text-gray-400">Menos canchas vacías, más reservas confirmadas. El sistema trabaja por vos.</p>
                </div>
              </div>
            </div>

            {/* CTA - Call to Action */}
            <div className="bg-[#0B0E14] rounded-xl p-6 border border-[#232838]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">¿Listo para empezar?</h3>
                  <p className="text-gray-400">
                    Suscripción mensual por solo <span className="text-[#df2531] font-bold">$10.00 USD</span>. 
                    Sin contratos, cancelás cuando quieras.
                  </p>
                </div>
                <button
                  onClick={() => sedes.length > 0 && navigate(`/sede/${sedes[0].id}/suscripcion`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#c41f2a] rounded-xl font-semibold transition-colors whitespace-nowrap"
                >
                  <CreditCard className="w-5 h-5" />
                  Activar Ahora
                </button>
              </div>
            </div>

            {/* Testimonio / Social proof */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>Más de <strong className="text-white">50 sedes</strong> ya están usando el sistema de reservas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
