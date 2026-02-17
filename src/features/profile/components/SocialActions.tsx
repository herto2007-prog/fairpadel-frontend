import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/services/socialService';
import { Button, Modal } from '@/components/ui';
import {
  Edit,
  UserPlus,
  UserMinus,
  MessageCircle,
  Gamepad2,
  MoreVertical,
  Shield,
  ShieldOff,
  Flag,
  LogIn,
  Crown,
  Loader2,
} from 'lucide-react';
import type { PerfilCompleto } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  perfil: PerfilCompleto;
  onFollowToggle: () => void;
}

const REPORT_REASONS = [
  'Conducta inapropiada',
  'Spam o publicidad',
  'Suplantacion de identidad',
  'Contenido ofensivo',
  'Acoso',
  'Otro',
];

const SocialActions = ({ perfil, onFollowToggle }: Props) => {
  const { user: currentUser } = useAuthStore();
  const { social, usuario } = perfil;
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Block confirmation modal
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  // Not logged in
  if (!currentUser) {
    return (
      <Link to="/login">
        <Button variant="outline" size="sm">
          <LogIn className="h-4 w-4 mr-2" />
          Iniciar sesion
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
    setBlockLoading(true);
    try {
      await socialService.bloquear(usuario.id);
      toast.success('Usuario bloqueado');
      setIsBlocked(true);
      setShowBlockConfirm(false);
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al bloquear');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async () => {
    setBlockLoading(true);
    try {
      await socialService.desbloquear(usuario.id);
      toast.success('Usuario desbloqueado');
      setIsBlocked(false);
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al desbloquear');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Selecciona un motivo');
      return;
    }
    setReportLoading(true);
    try {
      const motivo = reportReason === 'Otro' && reportDetail.trim()
        ? reportDetail.trim()
        : reportReason;
      await socialService.reportar(usuario.id, { motivo });
      toast.success('Reporte enviado');
      setShowReportModal(false);
      setReportReason('');
      setReportDetail('');
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al reportar');
    } finally {
      setReportLoading(false);
    }
  };

  const handleInviteToPlay = async () => {
    setInviteLoading(true);
    try {
      await socialService.enviarSolicitudJugar({
        receptorId: usuario.id,
        mensaje: '¡Juguemos un partido!',
      });
      toast.success('Solicitud enviada');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al enviar solicitud');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
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

        {/* Message — free for all */}
        <Link to={`/mensajes/${usuario.id}`}>
          <Button variant="ghost" size="sm" title="Enviar mensaje">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </Link>

        {/* Invite to play — visible for all, premium-gated */}
        {currentUser.esPremium ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleInviteToPlay}
            disabled={inviteLoading}
            title="Invitar a jugar"
          >
            {inviteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Gamepad2 className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Link to="/premium">
            <Button variant="ghost" size="sm" title="Invitar a jugar (Premium)" className="opacity-50">
              <Gamepad2 className="h-4 w-4" />
              <Crown className="h-3 w-3 text-yellow-500 ml-0.5" />
            </Button>
          </Link>
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
              <div className="absolute right-0 top-full mt-1 z-50 bg-dark-card border border-dark-border rounded-lg shadow-xl py-1 min-w-[180px]">
                {isBlocked ? (
                  <button
                    onClick={handleUnblock}
                    disabled={blockLoading}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-dark-surface transition-colors disabled:opacity-50"
                  >
                    {blockLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldOff className="h-4 w-4" />
                    )}
                    Desbloquear
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowBlockConfirm(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-secondary hover:bg-dark-surface transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Bloquear
                  </button>
                )}
                <button
                  onClick={() => { setShowReportModal(true); setShowMenu(false); }}
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

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        title="Bloquear usuario"
        size="sm"
      >
        <p className="text-sm text-light-secondary mb-4">
          ¿Estas seguro de que quieres bloquear a {usuario.nombre} {usuario.apellido}?
          No podra ver tu perfil ni interactuar contigo.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBlockConfirm(false)}
            disabled={blockLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBlock}
            loading={blockLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            Bloquear
          </Button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportReason(''); setReportDetail(''); }}
        title="Reportar usuario"
        size="sm"
      >
        <p className="text-sm text-light-secondary mb-4">
          ¿Por que quieres reportar a {usuario.nombre} {usuario.apellido}?
        </p>
        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                reportReason === reason
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-border hover:bg-dark-surface'
              }`}
            >
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={reportReason === reason}
                onChange={() => setReportReason(reason)}
                className="accent-primary-500"
              />
              <span className="text-sm text-light-text">{reason}</span>
            </label>
          ))}
        </div>
        {reportReason === 'Otro' && (
          <textarea
            value={reportDetail}
            onChange={(e) => setReportDetail(e.target.value)}
            placeholder="Describe el motivo..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder:text-light-muted text-sm resize-none focus:outline-none focus:border-primary-500 mb-4"
          />
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowReportModal(false); setReportReason(''); setReportDetail(''); }}
            disabled={reportLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleReport}
            loading={reportLoading}
            disabled={!reportReason}
          >
            Enviar reporte
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default SocialActions;
