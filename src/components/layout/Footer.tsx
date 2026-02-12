import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-card border-t border-dark-border text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold">FairPadel</span>
            </div>
            <p className="text-light-muted text-sm">
              La plataforma líder de gestión de torneos de pádel en Paraguay.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm text-light-muted">
              <li><Link to="/torneos" className="hover:text-primary-400">Torneos</Link></li>
              <li><Link to="/rankings" className="hover:text-primary-400">Rankings</Link></li>
              <li><Link to="/premium" className="hover:text-primary-400">Premium</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-sm text-light-muted">
              <li><a href="mailto:soporte@fairpadel.com" className="hover:text-primary-400">Contacto</a></li>
              <li><Link to="/ayuda" className="hover:text-primary-400">Ayuda</Link></li>
              <li><Link to="/terminos" className="hover:text-primary-400">Términos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-border mt-8 pt-8 text-center text-sm text-light-muted">
          <p>&copy; 2026 FairPadel. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
