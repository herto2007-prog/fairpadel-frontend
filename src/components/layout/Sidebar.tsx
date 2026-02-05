import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, Award, Image, Settings, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { to: '/', icon: Home, label: 'Inicio', auth: false },
  { to: '/torneos', icon: Trophy, label: 'Torneos', auth: false },
  { to: '/rankings', icon: Award, label: 'Rankings', auth: false },
  { to: '/mis-inscripciones', icon: Users, label: 'Mis Inscripciones', auth: true },
  { to: '/galeria', icon: Image, label: 'Galería', auth: false },
  { to: '/configuracion', icon: Settings, label: 'Configuración', auth: true },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  const visibleItems = menuItems.filter(item => !item.auth || isAuthenticated);

  return (
    <>
      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg transition-transform lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menú</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;