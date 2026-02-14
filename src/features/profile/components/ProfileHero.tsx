import { MapPin, Calendar, Crown } from 'lucide-react';
import type { PerfilCompleto } from '@/types';
import SocialActions from './SocialActions';

interface Props {
  perfil: PerfilCompleto;
  onFollowToggle: () => void;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}

const ProfileHero = ({ perfil, onFollowToggle, onShowFollowers, onShowFollowing }: Props) => {
  const { usuario, social } = perfil;
  const initials = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`;

  const memberSince = new Date(usuario.createdAt).getFullYear();

  return (
    <div className="relative">
      {/* Gradient banner */}
      <div className="h-36 sm:h-48 bg-gradient-to-r from-primary-900 via-primary-700 to-primary-900 rounded-t-xl" />

      {/* Content section overlapping the banner */}
      <div className="relative px-4 sm:px-6 pb-6 -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-dark-surface border-4 border-dark-card flex items-center justify-center text-4xl sm:text-5xl font-bold text-primary-400 overflow-hidden shadow-xl">
              {usuario.fotoUrl ? (
                <img
                  src={usuario.fotoUrl}
                  alt={usuario.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {/* Premium crown badge */}
            {usuario.esPremium && (
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1.5 shadow-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Info + social actions */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {usuario.nombre} {usuario.apellido}
              </h1>
              {usuario.esPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-full">
                  <Crown className="h-3 w-3" />
                  Premium
                </span>
              )}
            </div>

            {usuario.bio && (
              <p className="text-light-secondary text-sm mb-2 max-w-lg">{usuario.bio}</p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-light-tertiary mb-3">
              {usuario.ciudad && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {usuario.ciudad}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Miembro desde {memberSince}
              </span>
            </div>

            {/* Social counts */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
              <button
                onClick={onShowFollowers}
                className="hover:text-primary-400 transition-colors"
              >
                <span className="font-bold text-white">{social.seguidores}</span>{' '}
                <span className="text-light-tertiary">seguidores</span>
              </button>
              <button
                onClick={onShowFollowing}
                className="hover:text-primary-400 transition-colors"
              >
                <span className="font-bold text-white">{social.siguiendo}</span>{' '}
                <span className="text-light-tertiary">siguiendo</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0">
            <SocialActions
              perfil={perfil}
              onFollowToggle={onFollowToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
