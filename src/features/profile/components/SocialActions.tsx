import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/services/socialService';
import { Button } from '@/components/ui';
import { Edit, UserPlus, UserMinus, MessageCircle, Gamepad2, MoreVertical, Shield, Flag, LogIn } from 'lucide-react';
import type { PerfilCompleto } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  perfil: PerfilCompleto;
  onFollowToggle: () => void;
}

const SocialActions = ({ perfil, onFollowToggle }: Props) => {
  const { user: currentUser } = useAuthStore();
  const { social, usuario } = perfil;
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Not logged in
  if (!currentUser) {
    return (
      <Link to="/login">
        <Button variant="outline" size="sm">
          <LogIn className="h-4 w-4 mr-2" />
          Iniciar sesión
        </Button>
      </Link>
    );
  }

  // Own profile
  if (social.isOwnProfile) {
    return (
      <Link to="/profile/edit">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      </Link>
    );
  }

  // Other user's profile
  const handleFollow = async () => {
    setLoading(true);
    try {
      if (social.isFollowing) {
        await socialService.dejarDeSeguir(usuario.id);
        toast.success('Dejaste de seguir');
      } else {
        await socialService.seguir(usuario.id);
        toast.success('Ahora sigues a este jugador');
      }
      onFollowToggle();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    try {
      await socialService.bloquear(usuario.id);
      toast.success('Usuario bloqueado');
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al bloquear');
    }
  };

  const handleReport = async () => {
    try {
      await socialService.reportar(usuario.id, { motivo: 'Conducta inapropiada' });
      toast.success('Reporte enviado');
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al reportar');
    }
  };

  const handleInviteToPlay = async () => {
    try {
      await socialService.enviarSolicitudJugar({
        receptorId: usuario.id,
        mensaje: '¡Juguemos un partido!',
      });
      toast.success('Solicitud enviada');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al enviar solicitud');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Follow/Unfollow */}
      <Button
        onClick={handleFollow}
        variant={social.isFollowing ? 'outline' : 'primary'}
        size="sm"
        disabled={loading}
      >
        {social.isFollowing ? (
          <>
            <UserMinus className="h-4 w-4 mr-1.5" />
            Siguiendo
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Seguir
          </>
        )}
      </Button>

      {/* Message (Premium) */}
      {currentUser.esPremium && (
        <Link to={`/mensajes/${usuario.id}`}>
          <Button variant="ghost" size="sm" title="Enviar mensaje">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* Invite to play (Premium) */}
      {currentUser.esPremium && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInviteToPlay}
          title="Invitar a jugar"
        >
          <Gamepad2 className="h-4 w-4" />
        </Button>
      )}

      {/* More menu */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-dark-card border border-dark-border rounded-lg shadow-xl py-1 min-w-[160px]">
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-secondary hover:bg-dark-surface transition-colors"
              >
                <Shield className="h-4 w-4" />
                Bloquear
              </button>
              <button
                onClick={handleReport}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-dark-surface transition-colors"
              >
                <Flag className="h-4 w-4" />
                Reportar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialActions;
