import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, UserPlus, Search, Crown, User, 
  CreditCard, CheckCircle, X, Check
} from 'lucide-react';
import { sedesAdminService, SedeConDueno } from '../../../services/sedesAdminService';
import { useToast } from '../../../components/ui/ToastProvider';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

export function SedesDuenosManager() {
  const { showSuccess, showError } = useToast();
  const [sedes, setSedes] = useState<SedeConDueno[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSede, setSearchSede] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [asignandoSedeId, setAsignandoSedeId] = useState<string | null>(null);

  useEffect(() => {
    loadSedes();
    loadUsers();
  }, []);

  const loadSedes = async () => {
    try {
      const data = await sedesAdminService.getSedesConDuenos();
      setSedes(data);
    } catch (error) {
      showError('Error', 'No se pudieron cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Usar el endpoint existente de admin para obtener usuarios
      const { adminService } = await import('../../../services/adminService');
      const data = await adminService.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleAsignarDueno = async (sedeId: string, userId: string) => {
    try {
      await sedesAdminService.asignarDueno(sedeId, userId);
      showSuccess('Éxito', 'Dueño asignado correctamente');
      await loadSedes();
      setAsignandoSedeId(null);
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Error asignando dueño');
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredSedes = sedes.filter(sede =>
    sede.nombre.toLowerCase().includes(searchSede.toLowerCase()) ||
    sede.ciudad.toLowerCase().includes(searchSede.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    `${user.nombre} ${user.apellido}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando sedes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de Dueños</h2>
          <p className="text-gray-400 text-sm">Asigna dueños a las sedes para gestionar suscripciones</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Total Sedes</p>
          <p className="text-2xl font-bold text-white">{sedes.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Con Dueño</p>
          <p className="text-2xl font-bold text-green-400">
            {sedes.filter(s => s.dueno).length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Sin Dueño</p>
          <p className="text-2xl font-bold text-yellow-400">
            {sedes.filter(s => !s.dueno).length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Suscripción Activa</p>
          <p className="text-2xl font-bold text-primary">
            {sedes.filter(s => s.alquilerConfig?.suscripcionActiva).length}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchSede}
          onChange={(e) => setSearchSede(e.target.value)}
          placeholder="Buscar sedes..."
          className="w-full bg-[#151921] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Lista de Sedes */}
      <div className="space-y-4">
        {filteredSedes.map((sede) => (
          <motion.div
            key={sede.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className={`p-5 ${!sede.activa ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    sede.activa ? 'bg-primary/20' : 'bg-gray-700'
                  }`}>
                    <Building2 className={`w-6 h-6 ${sede.activa ? 'text-primary' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{sede.nombre}</h4>
                    <p className="text-sm text-gray-400">{sede.ciudad}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sede.alquilerConfig?.suscripcionActiva && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Suscripción Activa
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sede.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {sede.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              {/* Dueño actual */}
              <div className="mt-4 p-4 bg-[#0B0E14] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dueño Actual</p>
                    {sede.dueno ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {sede.dueno.nombre} {sede.dueno.apellido}
                          </p>
                          <p className="text-sm text-gray-400">{sede.dueno.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-yellow-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Sin dueño asignado
                      </p>
                    )}
                  </div>

                  {/* Estado de suscripción */}
                  {sede.alquilerConfig?.suscripcionActiva && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Vencimiento</p>
                      <p className="text-white">{formatDate(sede.alquilerConfig.suscripcionVenceEn)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setAsignandoSedeId(asignandoSedeId === sede.id ? null : sede.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm"
                >
                  {asignandoSedeId === sede.id ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {sede.dueno ? 'Cambiar Dueño' : 'Asignar Dueño'}
                    </>
                  )}
                </button>

                {sede.dueno && (
                  <a
                    href={`/sede/${sede.id}/suscripcion`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg transition-colors text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Ver Suscripción
                  </a>
                )}
              </div>

              {/* Formulario de asignación */}
              {asignandoSedeId === sede.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-[#0B0E14] border border-[#232838] rounded-xl"
                >
                  <p className="text-sm text-gray-400 mb-3">Selecciona un usuario para asignar como dueño:</p>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Buscar usuario..."
                      className="w-full bg-[#151921] border border-[#232838] rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredUsers.slice(0, 10).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAsignarDueno(sede.id, user.id)}
                        className="w-full flex items-center gap-3 p-3 bg-[#151921] hover:bg-[#232838] rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {user.nombre} {user.apellido}
                          </p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                        <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No se encontraron usuarios
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSedes.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron sedes</p>
        </div>
      )}
    </div>
  );
}
