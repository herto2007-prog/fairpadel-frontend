import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Loading } from '@/components/ui';
import  tournamentsService from '@/services/tournamentsService';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament } from '@/types';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTournament();
    }
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

  const handleInscribirse = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/torneos/${id}` } });
      return;
    }
    navigate(`/inscripciones/nueva?tournamentId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-gray-500">Torneo no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/torneos')}>
            Volver a Torneos
          </Button>
        </Card>
      </div>
    );
  }

  const canInscribe = tournament.estado === 'PUBLICADO' && 
                      new Date(tournament.fechaLimiteInscr) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Estilos para animación del botón */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px #22c55e, 0 0 10px #22c55e, 0 0 20px #22c55e;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 10px #22c55e, 0 0 25px #22c55e, 0 0 40px #22c55e;
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .btn-inscribirse {
          animation: pulse-glow 2s ease-in-out infinite;
          background: linear-gradient(
            90deg, 
            #22c55e 0%, 
            #4ade80 25%, 
            #86efac 50%, 
            #4ade80 75%, 
            #22c55e 100%
          );
          background-size: 200% auto;
        }
        
        .btn-inscribirse:hover {
          animation: pulse-glow 1s ease-in-out infinite, shimmer 1.5s linear infinite;
        }
      `}</style>

      {/* Hero Image */}
      <div className="relative h-96 bg-gray-900">
        <img
          src={tournament.flyerUrl || 'https://via.placeholder.com/1200x400'}
          alt={tournament.nombre}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Badge className="mb-4">{tournament.estado}</Badge>
            <h1 className="text-4xl font-bold text-white mb-2">
              {tournament.nombre}
            </h1>
            <p className="text-white/90 text-lg">
              📍 {tournament.ciudad}, {tournament.pais}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {tournament.descripcion || 'Sin descripción disponible'}
              </p>
            </Card>

            {/* Categorías */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Categorías</h2>
              <div className="flex flex-wrap gap-2">
                {tournament.categorias?.map((cat: any) => (
                  <Badge key={cat.id} variant="outline">
                    {cat.category?.nombre || 'Categoría'}
                  </Badge>
                )) || <p className="text-gray-500">Sin categorías</p>}
              </div>
            </Card>

            {/* Modalidades */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Modalidades</h2>
              <div className="flex flex-wrap gap-2">
                {tournament.modalidades?.map((mod: any) => (
                  <Badge key={mod.id} variant="outline">
                    {mod.modalidad}
                  </Badge>
                )) || <p className="text-gray-500">Sin modalidades</p>}
              </div>
            </Card>

            {/* Sede */}
            {tournament.sede && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Sede</h2>
                <div className="space-y-2">
                  <p className="font-medium">{tournament.sede}</p>
                  {tournament.direccion && (
                    <p className="text-gray-600">{tournament.direccion}</p>
                  )}
                  {tournament.mapsUrl && (
                    <a
                      href={tournament.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      📍 Ver en Google Maps
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Información</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de inicio</p>
                  <p className="font-medium">{formatDate(tournament.fechaInicio)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de fin</p>
                  <p className="font-medium">{formatDate(tournament.fechaFin)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Límite inscripción</p>
                  <p className="font-medium">{formatDate(tournament.fechaLimiteInscr)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Costo</p>
                  <p className="font-bold text-2xl text-primary-600">
                    {tournament.costoInscripcion > 0 
                      ? formatCurrency(Number(tournament.costoInscripcion))
                      : 'Gratis'}
                  </p>
                </div>
              </div>

              {canInscribe ? (
                <button
                  onClick={handleInscribirse}
                  className="btn-inscribirse w-full py-4 px-6 text-white text-xl font-bold rounded-xl 
                             transition-all duration-300 hover:scale-105 active:scale-95
                             flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">🎾</span>
                  <span>¡INSCRIBIRSE AHORA!</span>
                  <span className="text-2xl">🏆</span>
                </button>
              ) : tournament.estado === 'PUBLICADO' ? (
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⏰ Inscripciones cerradas
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Torneo {tournament.estado.toLowerCase()}
                  </p>
                </div>
              )}
            </Card>

            {/* Organizador Card */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Organizador</h3>
              <p className="text-gray-600">
                ID: {tournament.organizadorId?.slice(0, 8)}...
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}