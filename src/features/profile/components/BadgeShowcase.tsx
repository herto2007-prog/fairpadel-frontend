import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { logrosService } from '@/services/logrosService';
import type { Logro } from '@/types';
import {
  Trophy, Star, Crown, Flame, Zap, Sparkles, ShieldCheck,
  Medal, Award, TrendingUp, Shield, Swords, Users, Heart,
  Lock, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Trophy, Star, Crown, Flame, Zap, Sparkles, ShieldCheck,
  Medal, Award, TrendingUp, Shield, Swords, Users, Heart,
};

interface BadgeShowcaseProps {
  userId: string;
  isOwnProfile?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  torneo: 'Torneos',
  racha: 'Rachas',
  ranking: 'Rankings',
  social: 'Social',
  general: 'General',
};

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ userId, isOwnProfile = false }) => {
  const [logros, setLogros] = useState<Logro[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const cargarLogros = async () => {
      try {
        setLoading(true);
        if (isOwnProfile) {
          const data = await logrosService.getMisLogros();
          setLogros(data);
        } else {
          const data = await logrosService.getLogrosUsuario(userId);
          setLogros(data);
        }
      } catch {
        // Silently fail — badges are non-critical
      } finally {
        setLoading(false);
      }
    };
    cargarLogros();
  }, [userId, isOwnProfile]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </CardContent>
      </Card>
    );
  }

  if (logros.length === 0) return null;

  // Group by category
  const grouped = logros.reduce((acc, logro) => {
    const cat = logro.categoria || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(logro);
    return acc;
  }, {} as Record<string, Logro[]>);

  const categoryOrder = ['torneo', 'racha', 'ranking', 'social', 'general'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary-400" />
          {isOwnProfile ? 'Mis Logros' : 'Logros'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoryOrder.map((cat) => {
          const catLogros = grouped[cat];
          if (!catLogros || catLogros.length === 0) return null;

          return (
            <div key={cat} className="mb-4 last:mb-0">
              <h4 className="text-xs font-semibold text-light-secondary uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat] || cat}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {catLogros.map((logro) => (
                  <BadgeItem
                    key={logro.id}
                    logro={logro}
                    isPremiumUser={user?.esPremium || false}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

interface BadgeItemProps {
  logro: Logro;
  isPremiumUser: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ logro, isPremiumUser }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const IconComponent = ICON_MAP[logro.icono] || Trophy;
  const isUnlocked = logro.desbloqueado;
  const isLocked = !isUnlocked;
  const isPremiumLocked = logro.requierePremium && !isPremiumUser;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`
          flex flex-col items-center justify-center p-3 rounded-lg border text-center
          transition-all duration-200 min-h-[80px]
          ${isUnlocked
            ? 'bg-dark-surface border-primary-500/30 hover:border-primary-500/60'
            : 'bg-dark-bg border-dark-border opacity-50'
          }
        `}
      >
        <div className="relative">
          <IconComponent
            className={`h-6 w-6 mb-1 ${
              isUnlocked ? 'text-primary-400' : 'text-light-secondary/40'
            }`}
          />
          {isLocked && (
            <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-light-secondary/60" />
          )}
          {isPremiumLocked && (
            <Crown className="h-3 w-3 absolute -top-0.5 -right-1 text-yellow-500" />
          )}
        </div>
        <span
          className={`text-[10px] leading-tight mt-1 ${
            isUnlocked ? 'text-light-text' : 'text-light-secondary/40'
          }`}
        >
          {logro.nombre}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs pointer-events-none">
          <p className="font-semibold text-light-text mb-1">{logro.nombre}</p>
          <p className="text-light-secondary">{logro.descripcion}</p>
          {isUnlocked && logro.fechaDesbloqueo && (
            <p className="text-primary-400 mt-1">
              Desbloqueado: {formatDate(logro.fechaDesbloqueo)}
            </p>
          )}
          {isPremiumLocked && (
            <p className="text-yellow-500 mt-1 flex items-center gap-1">
              <Crown className="h-3 w-3" /> Requiere Premium
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeShowcase;
