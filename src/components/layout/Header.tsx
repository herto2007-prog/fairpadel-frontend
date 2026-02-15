import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Badge } from '@/components/ui';
import { notificacionesService } from '@/services/notificacionesService';
import type { Notificacion } from '@/types';
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
  Layers,
  Bell,
  CheckCheck,
  Mail,
  Swords,
  TrendingUp,
  ClipboardCheck,
  Megaphone,
  Newspaper,
  Users,
} from 'lucide-react';
import logoIcon from '@/assets/Asset 4fair padel.png';

// ═══════════════════════════════════════════
// HELPER: formatTimeAgo
// ═══════════════════════════════════════════
function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
}

function getNotifIcon(tipo: string) {
  switch (tipo) {
    case 'PARTIDO': return Swords;
    case 'INSCRIPCION': return ClipboardCheck;
    case 'RANKING': return TrendingUp;
    case 'TORNEO': return Trophy;
    case 'PAGO': return CreditCard;
    case 'MENSAJE': return Mail;
    default: return Bell;
  }
}

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Notification state
  const [notifCount, setNotifCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = hasRole('admin');
  const isOrganizador = hasRole('organizador') || isAdmin;

  // Poll for unread count every 30s
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificacionesService.contarNoLeidas();
      setNotifCount(data.count);
    } catch {
      // silently ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications when dropdown opens
  const openNotifDropdown = async () => {
    setNotifDropdownOpen(true);
    setUserMenuOpen(false);
    setLoadingNotifs(true);
    try {
      const data = await notificacionesService.obtenerNotificaciones();
      setNotifications(data);
    } catch {
      // silently ignore
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotifClick = async (notif: Notificacion) => {
    if (!notif.leida) {
      try {
        await notificacionesService.marcarComoLeida(notif.id);
        setNotifCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)),
        );
      } catch {
        // ignore
      }
    }
    setNotifDropdownOpen(false);
    if (notif.enlace) {
      navigate(notif.enlace);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setNotifCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      // ignore
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/tournaments', label: 'Torneos', icon: Calendar },
    { to: '/jugadores', label: 'Jugadores', icon: Users },
    { to: '/circuitos', label: 'Circuitos', icon: Trophy },
    { to: '/rankings', label: 'Rankings', icon: BarChart2 },
    ...(isAuthenticated ? [{ to: '/feed', label: 'Feed', icon: Newspaper }] : []),
  ];

  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="FairPadel" className="h-8 w-8" />
            <span className="font-bold text-xl text-primary-500">Fair<span className="text-light-text">Padel</span></span>
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
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      if (notifDropdownOpen) {
                        setNotifDropdownOpen(false);
                      } else {
                        openNotifDropdown();
                      }
                    }}
                    className="relative p-2 hover:bg-dark-hover rounded-lg transition-colors"
                    title="Notificaciones"
                  >
                    <Bell className="h-5 w-5 text-light-secondary" />
                    {notifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {notifCount > 99 ? '99+' : notifCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-dark-surface rounded-lg shadow-xl border border-dark-border overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                        <span className="font-semibold text-light-text text-sm">Notificaciones</span>
                        {notifCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Marcar todas
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {loadingNotifs ? (
                          <div className="px-4 py-6 text-center text-light-muted text-sm">Cargando...</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-light-muted text-sm">
                            Sin notificaciones
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((notif) => {
                            const Icon = getNotifIcon(notif.tipo);
                            return (
                              <button
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-dark-hover transition-colors border-b border-dark-border/50 ${
                                  !notif.leida ? 'bg-primary-500/5' : ''
                                }`}
                              >
                                <div className={`mt-0.5 flex-shrink-0 ${!notif.leida ? 'text-primary-400' : 'text-light-muted'}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {notif.titulo && (
                                    <p className={`text-xs font-semibold truncate ${!notif.leida ? 'text-light-text' : 'text-light-secondary'}`}>
                                      {notif.titulo}
                                    </p>
                                  )}
                                  <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.leida ? 'text-light-secondary' : 'text-light-muted'}`}>
                                    {notif.contenido}
                                  </p>
                                  <p className="text-[10px] text-light-muted mt-1">
                                    {formatTimeAgo(notif.createdAt)}
                                  </p>
                                </div>
                                {!notif.leida && (
                                  <div className="flex-shrink-0 mt-2">
                                    <div className="h-2 w-2 rounded-full bg-primary-400" />
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotifDropdownOpen(false);
                    }}
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
                      <Link
                        to="/premium"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-dark-hover"
                      >
                        <Crown className="h-4 w-4" />
                        {user?.esPremium ? 'Mi Suscripción' : 'Premium'}
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
                            to="/admin/circuitos"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                          >
                            <Trophy className="h-4 w-4" />
                            Circuitos
                          </Link>
                          <Link
                            to="/admin/categorias"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                          >
                            <Layers className="h-4 w-4" />
                            Categorías
                          </Link>
                          <Link
                            to="/admin/publicidad"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover hover:text-light-text"
                          >
                            <Megaphone className="h-4 w-4" />
                            Publicidad
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
              </>
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

          {/* Mobile menu button + bell */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  if (notifDropdownOpen) {
                    setNotifDropdownOpen(false);
                  } else {
                    openNotifDropdown();
                  }
                }}
                className="relative p-2 text-light-text"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-light-text"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Notification Dropdown */}
        {notifDropdownOpen && (
          <div className="md:hidden border-t border-dark-border bg-dark-surface">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
              <span className="font-semibold text-light-text text-sm">Notificaciones</span>
              {notifCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loadingNotifs ? (
                <div className="px-4 py-6 text-center text-light-muted text-sm">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-light-muted text-sm">Sin notificaciones</div>
              ) : (
                notifications.slice(0, 10).map((notif) => {
                  const Icon = getNotifIcon(notif.tipo);
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-dark-hover border-b border-dark-border/50 ${
                        !notif.leida ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${!notif.leida ? 'text-primary-400' : 'text-light-muted'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {notif.titulo && (
                          <p className={`text-xs font-semibold truncate ${!notif.leida ? 'text-light-text' : 'text-light-secondary'}`}>
                            {notif.titulo}
                          </p>
                        )}
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.leida ? 'text-light-secondary' : 'text-light-muted'}`}>
                          {notif.contenido}
                        </p>
                        <p className="text-[10px] text-light-muted mt-1">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.leida && (
                        <div className="flex-shrink-0 mt-2">
                          <div className="h-2 w-2 rounded-full bg-primary-400" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

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
                  <Link
                    to="/premium"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-dark-hover rounded-lg"
                  >
                    <Crown className="h-5 w-5" />
                    {user?.esPremium ? 'Mi Suscripción' : 'Premium'}
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
                  {isAdmin && (
                    <>
                      <hr className="my-2 border-dark-border" />
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Settings className="h-5 w-5" />
                        Administración
                      </Link>
                      <Link
                        to="/admin/sedes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <MapPin className="h-5 w-5" />
                        Gestionar Sedes
                      </Link>
                      <Link
                        to="/admin/organizadores"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <UserPlus className="h-5 w-5" />
                        Organizadores
                      </Link>
                      <Link
                        to="/admin/moderacion"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Shield className="h-5 w-5" />
                        Moderación
                      </Link>
                      <Link
                        to="/admin/suscripciones"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <CreditCard className="h-5 w-5" />
                        Suscripciones
                      </Link>
                      <Link
                        to="/admin/circuitos"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Trophy className="h-5 w-5" />
                        Circuitos
                      </Link>
                      <Link
                        to="/admin/categorias"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Layers className="h-5 w-5" />
                        Categorías
                      </Link>
                      <Link
                        to="/admin/publicidad"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Megaphone className="h-5 w-5" />
                        Publicidad
                      </Link>
                      <Link
                        to="/admin/configuracion"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-light-secondary hover:bg-dark-hover rounded-lg"
                      >
                        <Settings className="h-5 w-5" />
                        Configuración
                      </Link>
                    </>
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
