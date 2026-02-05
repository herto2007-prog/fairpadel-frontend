import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">FairPadel</span>
            </div>
            <p className="text-gray-400 text-sm">
              La plataforma líder de gestión de torneos de pádel en Paraguay.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/torneos" className="hover:text-white">Torneos</Link></li>
              <li><Link to="/rankings" className="hover:text-white">Rankings</Link></li>
              <li><Link to="/premium" className="hover:text-white">Premium</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="mailto:soporte@fairpadel.com" className="hover:text-white">Contacto</a></li>
              <li><Link to="/ayuda" className="hover:text-white">Ayuda</Link></li>
              <li><Link to="/terminos" className="hover:text-white">Términos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 FairPadel. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;