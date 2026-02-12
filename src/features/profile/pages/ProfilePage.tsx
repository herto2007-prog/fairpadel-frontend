import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/usersService';
import { rankingsService } from '@/services/rankingsService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import type { User, Ranking } from '@/types';
import { Edit, Trophy, Calendar, MapPin, Mail, Phone } from 'lucide-react';

const ProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profileId = userId || currentUser?.id;
      if (!profileId) return;

      if (isOwnProfile && currentUser) {
        setProfile(currentUser);
      } else {
        const userData = await usersService.getById(profileId);
        setProfile(userData);
      }

      // Cargar ranking
      const rankings = await rankingsService.getByUser(profileId);
      if (rankings && rankings.length > 0) {
        setRanking(rankings[0]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Usuario no encontrado</h3>
            <p className="text-light-secondary">El perfil que buscas no existe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar y datos principales */}
            <div className="flex flex-col items-center md:items-start">
              <div className="h-32 w-32 rounded-full bg-primary-500/20 flex items-center justify-center text-4xl font-bold text-primary-500 overflow-hidden">
                {profile.fotoUrl ? (
                  <img
                    src={profile.fotoUrl}
                    alt={profile.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`
                )}
              </div>
              {isOwnProfile && (
                <Link to="/profile/edit" className="mt-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                </Link>
              )}
            </div>

            {/* Información */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.nombre} {profile.apellido}
                </h1>
                {profile.esPremium && (
                  <Badge variant="premium">Premium</Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-light-secondary mb-4">{profile.bio}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-light-secondary">
                {profile.ciudad && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.ciudad}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                {isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile.telefono}</span>
                  </div>
                )}
                {profile.fechaNacimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(profile.fechaNacimiento).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            {ranking && (
              <div className="bg-dark-surface rounded-lg p-4 min-w-[200px]">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Ranking</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-secondary">Posición</span>
                    <span className="font-bold text-primary-500">#{ranking.posicion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-secondary">Puntos</span>
                    <span className="font-bold">{ranking.puntosTotales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-secondary">Torneos</span>
                    <span className="font-bold">{ranking.torneosJugados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-secondary">V/D</span>
                    <span className="font-bold">
                      <span className="text-green-400">{ranking.victorias}</span>
                      /
                      <span className="text-red-400">{ranking.derrotas}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-secondary">Campeonatos</span>
                    <span className="font-bold">{ranking.campeonatos}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
