import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/usersService';
import { Loading, Card, CardContent } from '@/components/ui';
import type { PerfilCompleto } from '@/types';
import ProfileHero from '../components/ProfileHero';
import StatsRadarChart from '../components/StatsRadarChart';
import QuickStatsRow from '../components/QuickStatsRow';
import MatchHistoryList from '../components/MatchHistoryList';
import TournamentHistoryList from '../components/TournamentHistoryList';
import ProfilePhotoGallery from '../components/ProfilePhotoGallery';
import FollowersModal from '../components/FollowersModal';

const ProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuthStore();

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Followers modal state
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<'seguidores' | 'siguiendo'>('seguidores');

  const profileId = userId || currentUser?.id;

  const loadProfile = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await usersService.getPerfilCompleto(profileId);
      setPerfil(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = () => {
    // Reload profile to get updated social counts + isFollowing
    loadProfile();
  };

  const handleShowFollowers = () => {
    setFollowersTab('seguidores');
    setFollowersModalOpen(true);
  };

  const handleShowFollowing = () => {
    setFollowersTab('siguiendo');
    setFollowersModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-white">Usuario no encontrado</h3>
            <p className="text-light-secondary">El perfil que buscás no existe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero section */}
      <div className="container mx-auto px-4 pt-4">
        <Card className="overflow-hidden">
          <ProfileHero
            perfil={perfil}
            onFollowToggle={handleFollowToggle}
            onShowFollowers={handleShowFollowers}
            onShowFollowing={handleShowFollowing}
          />
        </Card>
      </div>

      {/* Stats section */}
      <div className="container mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Radar Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Estadísticas del Jugador
              </h3>
              <StatsRadarChart stats={perfil.estadisticas} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <QuickStatsRow ranking={perfil.ranking} />
          </div>
        </div>
      </div>

      {/* Match & Tournament History */}
      <div className="container mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MatchHistoryList matches={perfil.partidosRecientes} />
          <TournamentHistoryList historial={perfil.historialTorneos} />
        </div>
      </div>

      {/* Photo Gallery */}
      {(perfil.fotos.length > 0 || perfil.social.isOwnProfile) && (
        <div className="container mx-auto px-4 mt-4 pb-8">
          <ProfilePhotoGallery
            fotos={perfil.fotos}
            isOwnProfile={perfil.social.isOwnProfile}
          />
        </div>
      )}

      {/* Followers Modal */}
      {profileId && (
        <FollowersModal
          userId={profileId}
          tab={followersTab}
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
