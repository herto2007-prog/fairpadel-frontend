import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Badge } from '@/components/ui';
import {
  Menu,
  X,
  User,
  LogOut,
  Trophy,
  Calendar,
  Home,
  BarChart2,
  Settings,
  Crown,
  MapPin,
  UserPlus,
  Shield,
  CreditCard,
} from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = hasRole('admin');
const isOrganizador = hasRole('organizador') || isAdmin; // Admin tiene todos los permisos

  const navLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/tournaments', label: 'Torneos', icon: Calendar },
    { to: '/rankings', label: 'Rankings', icon: BarChart2 },
  ];

  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <span className="font-bold text-xl text-primary-500">FairPadel</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-light-secondary hover:text-primary-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:bg-dark-hover rounded-lg px-3 py-2"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
                    {user?.fotoUrl ? (
                      <img
                        src={user.fotoUrl}
                        alt={user.nombre}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      user?.nombre?.charAt(0) || 'U'
                    )}
                  </div>
                  <span className="font-medium text-light-text">{user?.nombre}</span>
                  {user?.esPremium && (
                    <Badge variant="premium">
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-dark-surface rounded-lg shadow-xl border border-dark-border py-2">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                    >
                      <User className="h-4 w-4" />
                      Mi Perfil
                    </Link>
                    <Link
                      to="/inscripciones"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                    >
                      <Calendar className="h-4 w-4" />
                      Mis Inscripciones
                    </Link>
                    {isOrganizador && (
                      <Link
                        to="/my-tournaments"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                      >
                        <Trophy className="h-4 w-4" />
                        Mis Torneos
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <Settings className="h-4 w-4" />
                          Administracion
                        </Link>
                        <Link
                          to="/admin/sedes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <MapPin className="h-4 w-4" />
                          Gestionar Sedes
                        </Link>
                        <Link
                          to="/admin/organizadores"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <UserPlus className="h-4 w-4" />
                          Organizadores
                        </Link>
                        <Link
                          to="/admin/moderacion"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <Shield className="h-4 w-4" />
                          Moderación
                        </Link>
                        <Link
                          to="/admin/suscripciones"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <CreditCard className="h-4 w-4" />
                          Suscripciones
                        </Link>
                        <Link
                          to="/admin/configuracion"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                        >
                          <Settings className="h-4 w-4" />
                          Configuración
                        </Link>
                      </>
                    )}
                    <hr className="my-2 border-dark-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-900/20 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-light-text"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-border">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <>
                  <hr className="my-2 border-dark-border" />
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    Mi Perfil
                  </Link>
                  <Link
                    to="/inscripciones"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                  >
                    <Calendar className="h-5 w-5" />
                    Mis Inscripciones
                  </Link>
                  {isOrganizador && (
                    <Link
                      to="/my-tournaments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                    >
                      <Trophy className="h-5 w-5" />
                      Mis Torneos
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-900/20 rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2 border-dark-border" />
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2"
                  >
                    <Button variant="ghost" className="w-full">Iniciar Sesión</Button>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2"
                  >
                    <Button variant="primary" className="w-full">Registrarse</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
