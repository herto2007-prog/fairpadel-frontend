import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Shield, Users, CheckCircle, XCircle, Copy, Mail, Key, RefreshCw } from 'lucide-react';
import { adminService, User } from '../../../services/adminService';

const ROLES = [
  { id: 'jugador', label: 'Jugador', color: 'bg-blue-500', icon: UserCheck },
  { id: 'organizador', label: 'Organizador', color: 'bg-green-500', icon: Users },
  { id: 'admin', label: 'Admin', color: 'bg-red-500', icon: Shield },
];

type FiltroEstado = 'TODOS' | 'ACTIVO' | 'NO_VERIFICADO';

export function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [saving, setSaving] = useState<string | null>(null);
  const [soporteLoading, setSoporteLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error cargando usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: string, currentRoles: string[]) => {
    setSaving(userId);
    setMessage(null);

    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    try {
      await adminService.updateUserRoles({ userId, roles: newRoles });
      
      // Actualizar estado local
      setUsers(users.map(u => 
        u.id === userId ? { ...u, roles: newRoles } : u
      ));
      
      setMessage({ type: 'success', text: 'Roles actualizados' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error actualizando roles' });
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch =
      user.nombre.toLowerCase().includes(search.toLowerCase()) ||
      user.apellido.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.documento.includes(search);
    const matchEstado = filtroEstado === 'TODOS' || user.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const handleResendVerification = async (email: string) => {
    setSoporteLoading(`verify-${email}`);
    setMessage(null);
    try {
      await adminService.resendVerification(email);
      setMessage({ type: 'success', text: `Email de verificación reenviado a ${email}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error reenviando verificación' });
    } finally {
      setSoporteLoading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setSoporteLoading(`reset-${email}`);
    setMessage(null);
    try {
      await adminService.requestPasswordReset(email);
      setMessage({ type: 'success', text: `Email de recuperación enviado a ${email}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error enviando recuperación' });
    } finally {
      setSoporteLoading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'NO_VERIFICADO':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'SUSPENDIDO':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de Roles</h2>
          <p className="text-gray-400 text-sm">Asigna o quita roles a los usuarios</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex bg-[#151921] border border-[#232838] rounded-xl p-1">
            {(['TODOS', 'ACTIVO', 'NO_VERIFICADO'] as FiltroEstado[]).map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {estado === 'TODOS' ? 'Todos' : estado === 'ACTIVO' ? 'Activos' : 'No verificados'}
                <span className="ml-1.5 text-xs opacity-80">
                  ({estado === 'TODOS' ? users.length : users.filter(u => u.estado === estado).length})
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o documento..."
              className="w-full sm:w-80 bg-[#151921] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Lista de usuarios */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#151921] border-b border-[#232838]">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Documento</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Categoría</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Roles</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232838]">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[#151921]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                        {user.fotoUrl ? (
                          <img
                            src={user.fotoUrl}
                            alt={`${user.nombre} ${user.apellido}`}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className={`text-primary font-semibold relative z-10 ${user.fotoUrl ? 'hidden' : ''}`}>
                          {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.nombre} {user.apellido}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400 bg-[#232838] px-2 py-1 rounded truncate max-w-[120px]">
                        {user.id}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(user.id)}
                        className="p-1.5 hover:bg-[#232838] rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Copiar ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.documento}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#232838] rounded-full text-sm text-gray-300">
                      {user.categoriaActual?.nombre || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${getEstadoBadge(user.estado)}`}>
                      {user.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {ROLES.map((role) => {
                        const hasRole = user.roles.includes(role.id);
                        const Icon = role.icon;
                        
                        return (
                          <button
                            key={role.id}
                            onClick={() => toggleRole(user.id, role.id, user.roles)}
                            disabled={saving === user.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              hasRole
                                ? `${role.color} text-white shadow-lg`
                                : 'bg-[#232838] text-gray-400 hover:bg-[#2a3042]'
                            } ${saving === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Icon className="w-4 h-4" />
                            {role.label}
                            {hasRole && <CheckCircle className="w-3 h-3 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.estado === 'NO_VERIFICADO' && (
                        <button
                          onClick={() => handleResendVerification(user.email)}
                          disabled={soporteLoading === `verify-${user.email}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          title="Reenviar email de verificación"
                        >
                          {soporteLoading === `verify-${user.email}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          Verificar
                        </button>
                      )}
                      <button
                        onClick={() => handlePasswordReset(user.email)}
                        disabled={soporteLoading === `reset-${user.email}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        title="Enviar recuperación de contraseña"
                      >
                        {soporteLoading === `reset-${user.email}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Key className="w-3.5 h-3.5" />
                        )}
                        Reset pass
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">Total Usuarios</p>
          <p className="text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">Activos</p>
          <p className="text-3xl font-bold text-green-400">
            {users.filter(u => u.estado === 'ACTIVO').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">No Verificados</p>
          <p className="text-3xl font-bold text-yellow-400">
            {users.filter(u => u.estado === 'NO_VERIFICADO').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">Administradores</p>
          <p className="text-3xl font-bold text-white">
            {users.filter(u => u.roles.includes('admin')).length}
          </p>
        </div>
      </div>
    </div>
  );
}
