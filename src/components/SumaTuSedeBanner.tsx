import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Clock, Smartphone, BarChart3 } from 'lucide-react';

/**
 * Banda de marketing para que los complejos de canchas se sumen al servicio
 * de reservas. Se usa en la landing y en la página de Canchas.
 */
export function SumaTuSedeBanner() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#3a1f25] bg-[#151921] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#df2531]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#df2531]/18 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-[#df2531]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">¿Tenés un complejo de canchas?</h2>
            <p className="text-gray-400 mt-1 max-w-xl">
              Recibí reservas online desde la app, sin llamadas ni papel. Plan simple de Gs. 50.000/mes.
            </p>
          </div>
          <Link
            to="/suma-tu-sede"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-xl font-semibold transition-colors whitespace-nowrap"
          >
            Sumá tu sede <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-2 mt-5 pt-5 border-t border-[#2a1d22]">
          <span className="flex items-center gap-2 text-sm text-gray-300">
            <Clock className="w-4 h-4 text-[#df2531]" /> Reservas 24/7
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-300">
            <Smartphone className="w-4 h-4 text-[#df2531]" /> Reservan desde el celu
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-300">
            <BarChart3 className="w-4 h-4 text-[#df2531]" /> Panel y estadísticas
          </span>
        </div>
      </div>
    </section>
  );
}
