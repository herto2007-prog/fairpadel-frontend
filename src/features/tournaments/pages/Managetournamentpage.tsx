import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Loading } from '@/components/ui';
import  tournamentsService  from '@/services/tournamentsService';
import { formatDate } from '@/lib/utils';
import type { Tournament } from '@/types';

export default function ManageTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadTournament();
  }, [id]);

  const loadTournament = async () => {
    try {
      const data = await tournamentsService.getById(id!);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return <div>Torneo no encontrado</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tournament.nombre}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>📍 {tournament.ciudad}</span>
          <span>📅 {formatDate(tournament.fechaInicio)}</span>
          <Badge>{tournament.estado}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/organizador/torneos/${id}/inscripciones`)}>
          <h3 className="font-bold text-lg mb-2">Inscripciones</h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
          <p className="text-sm text-gray-500">parejas inscritas</p>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/organizador/torneos/${id}/canchas`)}>
          <h3 className="font-bold text-lg mb-2">Canchas</h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
          <p className="text-sm text-gray-500">canchas configuradas</p>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/organizador/torneos/${id}/partidos`)}>
          <h3 className="font-bold text-lg mb-2">Partidos</h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
          <p className="text-sm text-gray-500">partidos programados</p>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={() => navigate(`/organizador/torneos/${id}/editar`)}>
          Editar Torneo
        </Button>
        <Button variant="outline" onClick={() => navigate('/organizador/torneos')}>
          Volver a Mis Torneos
        </Button>
      </div>
    </div>
  );
}