import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Calendar, Users, GraduationCap, 
  TrendingUp, Newspaper, LogOut, Menu, X,
  Bell, Search, Plus, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';

const navItems = [
  { id: 'torneos', label: 'Torneos', icon: Trophy, href: '/torneos' },
  { id: 'alquileres', label: 'Alquileres', icon: Calendar, href: '/alquileres' },
  { id: 'instructores', label: 'Instructores', icon: GraduationCap, href: '/instructores' },
  { id: 'jugadores', label: 'Jugadores', icon: Users, href: '/jugadores' },
  { id: 'ranking', label: 'Ranking', icon: TrendingUp, href: '/ranking' },
  { id: 'novedades', label: 'Novedades', icon: Newspaper, href: '/novedades' },
];

export const NovedadesPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Simular logout
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Background Effects */}
      <BackgroundEffects variant="subtle" showGrid={false} />
      
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex flex-col w-72 glass border-r border-gray-800 fixed h-full z-20"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link to="/novedades" className="flex items-center gap-3">
            <img 
              src="/logos/Asset 2fair padel.png" 
              alt="FairPadel" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-white">FairPadel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-gray-400 hover:bg-dark-100 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Link to="/novedades" className="flex items-center gap-2">
            <img 
              src="/logos/Asset 2fair padel.png" 
              alt="FairPadel" 
              className="h-8 w-auto"
            />
            <span className="text-lg font-bold text-white">FairPadel</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-dark-100 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-dark-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
          className="overflow-hidden border-t border-gray-800"
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-400 hover:bg-dark-100 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </nav>
        </motion.div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-gray-800 pb-safe">
        <nav className="flex items-center justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 glass border-b border-gray-800 px-6 py-4 hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar jugadores, torneos..."
                className="w-full bg-dark-100 border border-gray-700 rounded-full py-2.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-dark-100 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Nueva publicación</span>
            </button>
          </div>
        </header>

        {/* Feed Content */}
        <div className="p-6 max-w-2xl mx-auto">
          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            >
              <Newspaper className="w-16 h-16 text-primary/60" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Bienvenido a tu feed!
            </h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Aquí verás las novedades de tus amigos, torneos que sigues, 
              resultados en vivo y mucho más.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Buscar jugadores para seguir
            </motion.button>
          </motion.div>

          {/* Coming Soon Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 border border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Próximamente</h3>
                <p className="text-gray-400 text-sm">
                  Estamos trabajando para traerte la mejor experiencia social del pádel. 
                  ¡Muy pronto podrás compartir tus victorias y seguir a tus jugadores favoritos!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Action Button - Mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="lg:hidden fixed right-4 bottom-24 z-30 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};
