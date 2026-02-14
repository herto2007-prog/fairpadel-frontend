import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { socialService } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { Modal, Loading, Button } from '@/components/ui';
import { UserPlus, UserMinus } from 'lucide-react';
import type { UserBrief } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  userId: string;
  tab: 'seguidores' | 'siguiendo';
  isOpen: boolean;
  onClose: () => void;
}

const FollowersModal = ({ userId, tab: initialTab, isOpen, onClose }: Props) => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [list, setList] = useState<UserBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen, activeTab, userId]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data =
        activeTab === 'seguidores'
          ? await socialService.getSeguidores(userId)
          : await socialService.getSiguiendo(userId);
      setList(data);

      // Load who the current user follows to show follow/unfollow buttons
      if (currentUser) {
        const myFollowing = await socialService.getSiguiendo(currentUser.id);
        setFollowingSet(new Set(myFollowing.map((u) => u.id)));
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetId: string) => {
    try {
      if (followingSet.has(targetId)) {
        await socialService.dejarDeSeguir(targetId);
        setFollowingSet((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        toast.success('Dejaste de seguir');
      } else {
        await socialService.seguir(targetId);
        setFollowingSet((prev) => new Set(prev).add(targetId));
        toast.success('Ahora sigues a este jugador');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      {/* Tabs */}
      <div className="flex border-b border-dark-border mb-4">
        <button
          onClick={() => setActiveTab('seguidores')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'seguidores'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-light-tertiary hover:text-white'
          }`}
        >
          Seguidores
        </button>
        <button
          onClick={() => setActiveTab('siguiendo')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'siguiendo'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-light-tertiary hover:text-white'
          }`}
        >
          Siguiendo
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-light-tertiary text-sm">
            {activeTab === 'seguidores' ? 'Sin seguidores aún' : 'No sigue a nadie aún'}
          </div>
        ) : (
          list.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-surface transition-colors"
            >
              {/* Avatar */}
              <Link
                to={`/profile/${user.id}`}
                onClick={onClose}
                className="flex-shrink-0"
              >
                <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-400 overflow-hidden">
                  {user.fotoUrl ? (
                    <img
                      src={user.fotoUrl}
                      alt={user.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
                  )}
                </div>
              </Link>

              {/* Name */}
              <Link
                to={`/profile/${user.id}`}
                onClick={onClose}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-white truncate">
                  {user.nombre} {user.apellido}
                </div>
              </Link>

              {/* Follow/Unfollow button */}
              {currentUser && currentUser.id !== user.id && (
                <Button
                  variant={followingSet.has(user.id) ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleFollow(user.id)}
                  className="flex-shrink-0"
                >
                  {followingSet.has(user.id) ? (
                    <UserMinus className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default FollowersModal;
