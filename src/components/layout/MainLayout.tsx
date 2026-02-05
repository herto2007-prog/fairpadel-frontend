import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui';

interface MainLayoutProps {
  children: ReactNode; // ✅ CORREGIDO: agregado children
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            FairPadel
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/torneos" className="hover:text-primary">
              Torneos
            </Link>
            <Link to="/rankings" className="hover:text-primary">
              Rankings
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/mis-inscripciones" className="hover:text-primary">
                  Mis Inscripciones
                </Link>
                <Link to={`/perfil/${user?.id}`} className="hover:text-primary">
                  Perfil
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 FairPadel - La plataforma que conecta a la comunidad del pádel</p>
        </div>
      </footer>
    </div>
  );
};