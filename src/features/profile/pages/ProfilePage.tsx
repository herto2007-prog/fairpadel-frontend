import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/usersService';
import { rankingsService } from '@/services/rankingsService';
import { Loading, Card, CardContent } from '@/components/ui';
import { FileText, FileSpreadsheet, Crown, Loader2 } from 'lucide-react';
import type { PerfilCompleto } from '@/types';
import ProfileHero from '../components/ProfileHero';
import StatsRadarChart from '../components/StatsRadarChart';
import QuickStatsRow from '../components/QuickStatsRow';
import MatchHistoryList from '../components/MatchHistoryList';
import TournamentHistoryList from '../components/TournamentHistoryList';
import ProfilePhotoGallery from '../components/ProfilePhotoGallery';
import FollowersModal from '../components/FollowersModal';
import BadgeShowcase from '../components/BadgeShowcase';
import AdvancedStats from '../components/AdvancedStats';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  // Route can be /jugadores/:id, /profile/:userId, or /profile (own)
  const params = useParams<{ id?: string; userId?: string }>();
  const { user: currentUser } = useAuthStore();

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Followers modal state
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<'seguidores' | 'siguiendo'>('seguidores');

  // Export state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const profileId = params.id || params.userId || currentUser?.id;

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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await rankingsService.exportCareerPdf();
      toast.success('PDF descargado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al exportar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await rankingsService.exportHistoryExcel();
      toast.success('Excel descargado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al exportar Excel');
    } finally {
      setExportingExcel(false);
    }
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
        {/* Export buttons (own profile only) */}
        {perfil.social.isOwnProfile && (
          <div className="flex items-center justify-end gap-2 mb-3">
            {currentUser?.esPremium ? (
              <>
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Exportar PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {exportingExcel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Exportar Excel
                </button>
              </>
            ) : (
              <Link to="/premium" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors">
                <Crown className="h-3.5 w-3.5" />
                Exportar estadísticas (Premium)
              </Link>
            )}
          </div>
        )}

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

      {/* Badge Showcase */}
      <div className="container mx-auto px-4 mt-4">
        <BadgeShowcase
          userId={profileId!}
          isOwnProfile={perfil.social.isOwnProfile}
        />
      </div>

      {/* Advanced Stats (Premium) */}
      <div className="container mx-auto px-4 mt-4">
        <AdvancedStats
          userId={profileId!}
          isPremiumViewer={!!currentUser?.esPremium}
        />
      </div>

      {/* Match & Tournament History */}
      <div className="container mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MatchHistoryList matches={perfil.partidosRecientes} />
          <TournamentHistoryList historial={perfil.historialTorneos} />
        </div>
      </div>

      {/* Photo Gallery */}
      {((perfil.fotos?.length ?? 0) > 0 || perfil.social.isOwnProfile) && (
        <div className="container mx-auto px-4 mt-4 pb-8">
          <ProfilePhotoGallery
            fotos={perfil.fotos || []}
            totalFotos={perfil.totalFotos}
            isOwnProfile={perfil.social.isOwnProfile}
            userId={profileId}
            onPhotosChange={loadProfile}
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
