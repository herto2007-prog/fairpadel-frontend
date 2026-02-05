import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Debug: Ver estructura de roles
  useEffect(() => {
    if (user?.roles) {
      console.log('Estructura de roles:', JSON.stringify(user.roles, null, 2));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Función para obtener el nombre del rol
  const getRoleName = (userRole: any): string => {
    // Intentar diferentes estructuras posibles
    if (userRole.role?.nombre) return userRole.role.nombre;
    if (userRole.roleName) return userRole.roleName;
    if (typeof userRole === 'string') return userRole;
    return 'Rol';
  };

  // Verificar si el usuario es organizador
  const isOrganizer = user?.roles?.some((r: any) => {
    const roleName = getRoleName(r).toLowerCase();
    return roleName === 'organizador' || roleName === 'organizer';
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">FairPadel</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {user?.nombre} {user?.apellido}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Bienvenido, {user?.nombre}! 🎾
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Información del Usuario */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Tu Información</h3>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Documento:</span> {user?.documento}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Género:</span> {user?.genero}</p>
                <p><span className="font-medium">Ciudad:</span> {user?.ciudad || 'No especificada'}</p>
                <p>
                  <span className="font-medium">Tipo de cuenta:</span>{' '}
                  {user?.esPremium ? (
                    <span className="text-yellow-600 font-semibold">⭐ Premium</span>
                  ) : (
                    <span className="text-gray-600">Gratuita</span>
                  )}
                </p>
                
                {/* Roles */}
                <div className="pt-2">
                  <p className="font-medium mb-2">Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((userRole: any, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {getRoleName(userRole)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Sin roles asignados</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Próximas Funcionalidades */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Próximamente</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Sistema de autenticación completo</li>
                <li>✅ Módulo de torneos</li>
                <li>⏳ Inscribirse en torneos</li>
                <li>⏳ Ver fixture y resultados</li>
                <li>⏳ Rankings automáticos</li>
                <li>⏳ Perfil de usuario</li>
                <li>⏳ Galería de fotos</li>
                <li>⏳ Sistema Premium</li>
              </ul>
            </div>
          </div>

          {/* Panel de Organizador */}
          {isOrganizer && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🏆 Panel de Organizador
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/dashboard/my-tournaments')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center transition-colors"
                >
                  📋 Mis Torneos
                </button>
                <button
                  onClick={() => navigate('/dashboard/tournaments/create')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center transition-colors"
                >
                  ➕ Crear Torneo
                </button>
              </div>
            </div>
          )}

          {/* Ver Todos los Torneos */}
          <div className="mt-6">
            <button
              onClick={() => navigate('/tournaments')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              🎾 Ver Todos los Torneos
            </button>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              🎉 ¡Sprint 1-2 Completado!
            </h3>
            <p className="text-green-700 text-sm">
              Has completado exitosamente los Sprints 1 y 2. El sistema de autenticación 
              está 100% funcional y ahora puedes crear y gestionar torneos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}