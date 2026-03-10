import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../features/auth/context/AuthContext';
import AppLayout from '../layout/AppLayout';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

export function RoleProtectedRoute({ allowedRoles, children }: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  // No autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si tiene alguno de los roles permitidos
  const hasRequiredRole = user?.roles?.some((role: string) => 
    allowedRoles.includes(role)
  ) ?? false;

  // Admin siempre tiene acceso a todo (soporte de emergencia)
  const isAdmin = user?.roles?.includes('admin') ?? false;

  if (!hasRequiredRole && !isAdmin) {
    // No tiene permisos suficientes
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-12 max-w-md"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
              <p className="text-gray-400 mb-6">
                No tienes permisos para acceder a esta sección. 
                Esta área es exclusiva para organizadores de torneos.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-[#232838] hover:bg-[#2d3548] text-white rounded-xl font-medium transition-colors"
                >
                  Volver
                </button>
                <a
                  href="/"
                  className="px-6 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-colors"
                >
                  Ir al inicio
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tiene permisos
  return children ? <>{children}</> : <Outlet />;
}

// Hook helper para verificar roles
export function useHasRole(roles: string[]): boolean {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const hasRole = user?.roles?.some((role: string) => roles.includes(role)) ?? false;
  return isAdmin || hasRole;
}
