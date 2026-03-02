import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Share2, QrCode, AlertCircle } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Badge, Loading } from '@/components/ui';
import type { ReservaCancha } from '@/types';

interface Props {
  maxReservas?: number;
  showVerTodas?: boolean;
}

function formatFecha(fechaStr: string): string {
  const d = new Date(fechaStr + 'T12:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  
  const fechaReserva = new Date(d);
  fechaReserva.setHours(0, 0, 0, 0);
  
  let prefix = '';
  if (fechaReserva.getTime() === hoy.getTime()) prefix = 'Hoy';
  else if (fechaReserva.getTime() === manana.getTime()) prefix = 'Mañana';
  
  const formatted = d.toLocaleDateString('es-PY', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  });
  
  return prefix ? `${prefix}, ${formatted}` : formatted;
}

function getTimeUntil(fechaStr: string, horaInicio: string): string {
  const [h, m] = horaInicio.split(':').map(Number);
  const fecha = new Date(fechaStr + 'T12:00:00');
  fecha.setHours(h, m, 0, 0);
  
  const ahora = new Date();
  const diff = fecha.getTime() - ahora.getTime();
  
  if (diff < 0) return 'En curso';
  
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) return `Faltan ${dias} día${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `Faltan ${horas} hora${horas > 1 ? 's' : ''}`;
  return 'En menos de 1 hora';
}

export default function ProximaReservaWidget({ maxReservas = 2, showVerTodas = true }: Props) {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservas();
    // Actualizar cada minuto
    const interval = setInterval(loadReservas, 60000);
    return () => clearInterval(interval);
  }, [maxReservas]);

  const loadReservas = async () => {
    try {
      const data = await alquileresService.getProximasReservas(maxReservas);
      setReservas(Array.isArray(data) ? data : []);
    } catch {
      // Silenciar error
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (reserva: ReservaCancha) => {
    const sede = (reserva as any).sedeCancha?.sede;
    const cancha = (reserva as any).sedeCancha;
    const text = `¡Juego pádel! 🎾\n${sede?.nombre} - ${cancha?.nombre}\n${formatFecha(reserva.fecha)} a las ${reserva.horaInicio}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi reserva de pádel',
          text,
        });
      } catch {
        // Usuario canceló
      }
    } else {
      navigator.clipboard.writeText(text);
      // Toast sería ideal aquí
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <div className="flex justify-center py-4">
          <Loading size="sm" />
        </div>
      </div>
    );
  }

  if (reservas.length === 0) {
    return (
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-light-text">No tenés reservas próximas</h3>
            <p className="text-sm text-light-muted">¡Reservá tu cancha ahora!</p>
          </div>
        </div>
        <Link to="/canchas">
          <Button variant="primary" className="w-full">
            Buscar canchas
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  const primeraReserva = reservas[0];
  const sede = (primeraReserva as any).sedeCancha?.sede;
  const cancha = (primeraReserva as any).sedeCancha;

  return (
    <div className="space-y-3">
      {/* Card principal - Próxima reserva */}
      <div className="bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-dark-card rounded-xl border border-primary-500/30 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-primary-400 font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Próxima reserva
            </p>
            <h3 className="text-xl font-bold text-light-text mt-1 capitalize">
              {formatFecha(primeraReserva.fecha)}
            </h3>
            <p className="text-light-muted text-sm">
              {getTimeUntil(primeraReserva.fecha, primeraReserva.horaInicio)}
            </p>
          </div>
          <Badge 
            variant={primeraReserva.estado === 'CONFIRMADA' ? 'success' : 'warning'}
            className="capitalize"
          >
            {primeraReserva.estado === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente'}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-light-text">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="font-medium">{primeraReserva.horaInicio} - {primeraReserva.horaFin}</span>
          </div>
          <div className="flex items-center gap-2 text-light-text">
            <MapPin className="w-4 h-4 text-primary-400" />
            <span>{sede?.nombre} - {cancha?.nombre}</span>
          </div>
          {sede?.direccion && (
            <p className="text-xs text-light-muted pl-6">{sede.direccion}</p>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => handleShare(primeraReserva)}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Compartir
          </Button>
          <Link to="/mis-reservas-cancha" className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              <QrCode className="w-4 h-4 mr-1" />
              Ver QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Reservas adicionales */}
      {reservas.slice(1).map((reserva) => {
        const s = (reserva as any).sedeCancha?.sede;
        const c = (reserva as any).sedeCancha;
        return (
          <div 
            key={reserva.id} 
            className="bg-dark-card rounded-xl border border-dark-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-light-text capitalize">{formatFecha(reserva.fecha)}</p>
              <p className="text-sm text-light-muted">
                {reserva.horaInicio} • {s?.nombre}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {getTimeUntil(reserva.fecha, reserva.horaInicio)}
            </Badge>
          </div>
        );
      })}

      {/* Ver todas */}
      {showVerTodas && (
        <Link to="/mis-reservas-cancha">
          <Button variant="ghost" className="w-full text-primary-400">
            Ver todas mis reservas
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}
