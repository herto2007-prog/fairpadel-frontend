import { Card } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament } from '@/types';
import { Calendar, Clock, MapPin, DollarSign, Link2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResumenInfoCardProps {
  tournament: Tournament;
}

export function ResumenInfoCard({ tournament }: ResumenInfoCardProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/t/${tournament.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm text-light-secondary mb-4 uppercase tracking-wider">Informacion del Torneo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fechas */}
        <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-secondary">Fechas</p>
            <p className="text-sm font-medium truncate">{formatDate(tournament.fechaInicio)} - {formatDate(tournament.fechaFin)}</p>
          </div>
        </div>

        {/* Limite inscripcion */}
        <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
          <div className="p-2 bg-amber-900/30 rounded-lg">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-secondary">Inscripcion hasta</p>
            <p className="text-sm font-medium truncate">{formatDate(tournament.fechaLimiteInscr)}</p>
          </div>
        </div>

        {/* Ciudad */}
        <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
          <div className="p-2 bg-green-900/30 rounded-lg">
            <MapPin className="w-4 h-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-secondary">Ubicacion</p>
            <p className="text-sm font-medium truncate">{tournament.ciudad}, {tournament.pais}</p>
          </div>
        </div>

        {/* Costo */}
        <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-secondary">Costo inscripcion</p>
            <p className="text-sm font-medium">{formatCurrency(Number(tournament.costoInscripcion))}</p>
          </div>
        </div>

        {/* Link de inscripcion */}
        {tournament.slug && (
          <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
            <div className="p-2 bg-primary-900/30 rounded-lg">
              <Link2 className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-light-secondary">Link de inscripcion</p>
              <code className="text-sm font-medium text-primary-400 truncate block">
                {window.location.origin}/t/{tournament.slug}
              </code>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors flex-shrink-0"
              title="Copiar link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
