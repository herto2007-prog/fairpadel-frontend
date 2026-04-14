import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, MapPin, Users, Award, Calendar, LogOut, Menu, X, Target, User, Building2, UserCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Items base para todos los usuarios
  const baseNavItems = [
    { path: '/tournaments', label: 'Torneos', icon: Trophy },
    { path: '/sedes', label: 'Canchas', icon: MapPin },
    { path: '/comunidad', label: 'Comunidad', icon: UserCircle },
    { path: '/instructores', label: 'Instructores', icon: Users },
    { path: '/rankings', label: 'Rankings', icon: Award },
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
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 relative">
                  {/* Avatar con Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="relative group"
                      title="Menú de usuario"
                      aria-label="Menú de usuario"
                    >
                      {user.fotoUrl ? (
                        <img 
                          src={user.fotoUrl} 
                          alt={`${user.nombre} ${user.apellido}`}
                          className="w-9 h-9 rounded-full object-cover hover:ring-2 hover:ring-[#df2531]/50 transition-all"
                          width="36" height="36"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff4757] flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-[#df2531]/50 transition-all">
                          {user.nombre[0]}{user.apellido[0]}
                        </div>
                      )}
                      {user.roles?.includes('admin') && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#df2531] border-2 border-[#151921] rounded-full" title="Admin"></span>
                      )}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#151921] border border-[#232838] rounded-lg shadow-xl z-20 py-1">
                          <Link
                            to="/perfil"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#232838] transition-colors"
                          >
                            <User size={16} />
                            Mi Perfil
                          </Link>
                          <Link
                            to="/mis-reservas"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#232838] transition-colors"
                          >
                            <Calendar size={16} />
                            Mis Reservas
                          </Link>
                          {user?.roles?.includes('dueño') && (
                            <Link
                              to="/mis-sedes"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#232838] transition-colors"
                            >
                              <Building2 size={16} />
                              Mis Sedes
                            </Link>
                          )}
                          <div className="border-t border-[#232838] my-1" />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-[#232838] transition-colors"
                          >
                            <LogOut size={16} />
                            Cerrar sesión
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
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
                  <div className="flex items-center gap-3 px-4 py-3">
                    {user.fotoUrl ? (
                      <img 
                        src={user.fotoUrl} 
                        alt={`${user.nombre} ${user.apellido}`}
                        className="w-10 h-10 rounded-full object-cover"
                        width="40" height="40"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff4757] flex items-center justify-center text-white font-semibold">
                        {user.nombre[0]}{user.apellido[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{user.nombre} {user.apellido}</p>
                      {user.roles?.includes('admin') && (
                        <span className="text-xs text-[#df2531]">Administrador</span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#232838]"
                  >
                    <User size={20} />
                    Mi Perfil
                  </Link>
                  <Link
                    to="/mis-reservas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#232838]"
                  >
                    <Calendar size={20} />
                    Mis Reservas
                  </Link>
                  {user?.roles?.includes('dueño') && (
                    <Link
                      to="/mis-sedes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#232838]"
                    >
                      <Building2 size={20} />
                      Mis Sedes
                    </Link>
                  )}
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
