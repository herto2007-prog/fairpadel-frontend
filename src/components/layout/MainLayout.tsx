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
      <header className="bg-dark-card border-b border-dark-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary-500">
            FairPadel
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/torneos" className="text-light-secondary hover:text-primary-400">
              Torneos
            </Link>
            <Link to="/rankings" className="text-light-secondary hover:text-primary-400">
              Rankings
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/mis-inscripciones" className="text-light-secondary hover:text-primary-400">
                  Mis Inscripciones
                </Link>
                <Link to={`/perfil/${user?.id}`} className="text-light-secondary hover:text-primary-400">
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
      <footer className="bg-dark-card border-t border-dark-border py-8">
        <div className="container mx-auto px-4 text-center text-light-muted">
          <p>© 2026 FairPadel - La plataforma que conecta a la comunidad del pádel</p>
        </div>
      </footer>
    </div>
  );
};
