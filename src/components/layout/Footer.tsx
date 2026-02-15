import React from 'react';
import { Link } from 'react-router-dom';
import logoWhite from '@/assets/Asset 1fair padel.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-card border-t border-dark-border text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Logo y descripción */}
          <div className="col-span-2 sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoWhite} alt="FairPadel" className="h-10 w-auto" />
            </div>
            <p className="text-light-muted text-sm">
              La plataforma líder de gestión de torneos de pádel en Paraguay.
              Inscripciones, fixtures, rankings y más.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm text-light-muted">
              <li><Link to="/tournaments" className="hover:text-primary-400 transition-colors">Torneos</Link></li>
              <li><Link to="/rankings" className="hover:text-primary-400 transition-colors">Rankings</Link></li>
              <li><Link to="/circuitos" className="hover:text-primary-400 transition-colors">Circuitos</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-sm text-light-muted">
              <li><a href="mailto:soporte@fairpadel.com" className="hover:text-primary-400 transition-colors">Contacto</a></li>
              <li><Link to="/terminos" className="hover:text-primary-400 transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-light-muted">
          <p>&copy; {new Date().getFullYear()} FairPadel. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
