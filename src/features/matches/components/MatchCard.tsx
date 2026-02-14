import { Card, CardContent, Badge, Button } from '@/components/ui';
import type { Match } from '@/types';
import { MatchStatus } from '@/types';
import { Calendar, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  showActions?: boolean;
  onCargarResultado?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  showActions = false,
  onCargarResultado 
}) => {
  const getStatusBadge = (status: MatchStatus) => {
    const variants: Record<MatchStatus, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [MatchStatus.PROGRAMADO]: { variant: 'default', label: 'Programado' },
      [MatchStatus.EN_JUEGO]: { variant: 'warning', label: 'En Juego' },
      [MatchStatus.FINALIZADO]: { variant: 'success', label: 'Finalizado' },
      [MatchStatus.SUSPENDIDO]: { variant: 'danger', label: 'Suspendido' },
      [MatchStatus.WO]: { variant: 'danger', label: 'W.O.' },
      [MatchStatus.CANCELADO]: { variant: 'danger', label: 'Cancelado' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getParejaName = (parejaNum: 1 | 2) => {
    const pareja = parejaNum === 1 ? match.pareja1 : match.pareja2;
    if (!pareja) return 'TBD';
    
    const j1 = pareja.jugador1;
    const j2 = pareja.jugador2;
    
    if (!j1) return 'TBD';
    
    const name1 = `${j1.nombre?.charAt(0)}. ${j1.apellido}`;
    const name2 = j2 ? `${j2.nombre?.charAt(0)}. ${j2.apellido}` : 'TBD';
    
    return `${name1} / ${name2}`;
  };

  const getScore = (parejaNum: 1 | 2) => {
    if (match.estado !== MatchStatus.FINALIZADO) return null;
    
    const scores = [];
    if (match.set1Pareja1 !== null && match.set1Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set1Pareja1 : match.set1Pareja2);
    }
    if (match.set2Pareja1 !== null && match.set2Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set2Pareja1 : match.set2Pareja2);
    }
    if (match.set3Pareja1 !== null && match.set3Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set3Pareja1 : match.set3Pareja2);
    }
    
    return scores.length > 0 ? scores.join(' - ') : null;
  };

  const isWinner = (parejaNum: 1 | 2) => {
    const parejaId = parejaNum === 1 ? match.pareja1Id : match.pareja2Id;
    return match.parejaGanadoraId === parejaId;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-dark-surface border-b border-dark-border">
          <span className="text-sm font-medium">{
            match.ronda === 'ACOMODACION_1' ? 'Acomodación 1' :
            match.ronda === 'ACOMODACION_2' ? 'Acomodación 2' :
            match.ronda.replace('_', ' ')
          }</span>
          {getStatusBadge(match.estado)}
        </div>

        {/* Fecha y hora */}
        {(match.fechaProgramada || match.horaProgramada) && (
          <div className="flex gap-4 px-4 py-2 text-sm text-light-secondary border-b border-dark-border">
            {match.fechaProgramada && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(match.fechaProgramada).toLocaleDateString()}
              </span>
            )}
            {match.horaProgramada && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {match.horaProgramada}
              </span>
            )}
          </div>
        )}

        {/* Pareja 1 */}
        <div className={`flex justify-between items-center px-4 py-3 border-b border-dark-border ${
          isWinner(1) ? 'bg-green-900/30' : ''
        }`}>
          <span className={`${isWinner(1) ? 'font-semibold' : ''}`}>
            {getParejaName(1)}
          </span>
          <span className="font-mono font-semibold text-lg">
            {getScore(1)}
          </span>
        </div>

        {/* Pareja 2 */}
        <div className={`flex justify-between items-center px-4 py-3 ${
          isWinner(2) ? 'bg-green-900/30' : ''
        }`}>
          <span className={`${isWinner(2) ? 'font-semibold' : ''}`}>
            {getParejaName(2)}
          </span>
          <span className="font-mono font-semibold text-lg">
            {getScore(2)}
          </span>
        </div>

        {/* Info adicional */}
        <div className="px-4 py-2 bg-dark-surface text-sm text-light-secondary">
          {match.torneoCancha?.sedeCancha && (
            <p>🎾 Cancha: {match.torneoCancha.sedeCancha.nombre}</p>
          )}
          {match.observaciones && (
            <p className="text-light-secondary italic">💬 {match.observaciones}</p>
          )}
        </div>

        {/* Acciones */}
        {showActions && match.estado === MatchStatus.PROGRAMADO && (
          <div className="px-4 py-3 border-t border-dark-border">
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => onCargarResultado?.(match.id)}
            >
              Cargar Resultado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCard;