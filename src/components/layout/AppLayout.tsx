import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, MapPin, Users, Award, Calendar, LogOut, Menu, X, Target, User } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Items base para todos los usuarios
  const baseNavItems = [
    { path: '/tournaments', label: 'Torneos', icon: Trophy },
    { path: '/sedes', label: 'Sedes', icon: MapPin },
    { path: '/instructores', label: 'Instructores', icon: Users },
    { path: '/rankings', label: 'Rankings', icon: Award },
    { path: '/alquileres', label: 'Alquileres', icon: Calendar },
  ];

  // Items solo para organizadores y admin
  const isOrganizador = user?.roles?.includes('organizador') || user?.roles?.includes('admin');
  
  const navItems = isOrganizador
    ? [
        ...baseNavItems.slice(0, 1), // Torneos
        { path: '/mis-torneos', label: 'Mis Torneos', icon: Target },
        ...baseNavItems.slice(1), // Resto
      ]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white compact-ui">
      {/* Header */}
      <header className="bg-[#151921] border-b border-[#232838] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src="/logos/Asset 2fair padel.png" alt="FairPadel" className="h-8 w-auto" />
              <span className="font-bold text-xl hidden sm:block">FairPadel</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#df2531] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#232838]'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    to="/perfil"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg transition-colors"
                  >
                    <User size={18} />
                    <span>
                      {user.nombre} {user.apellido}
                    </span>
                    {user.roles?.includes('admin') && (
                      <span className="ml-1 text-xs bg-[#df2531] px-2 py-0.5 rounded">Admin</span>
                    )}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#232838]">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-[#df2531] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#232838]'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
              {user && (
                <>
                  <Link
                    to="/perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#232838]"
                  >
                    <User size={20} />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg text-sm font-medium"
                  >
                    <LogOut size={20} />
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
