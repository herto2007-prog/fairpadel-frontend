import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loading } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';

/**
 * Resolves a tournament slug (e.g. /t/copa-fairpadel-2025) to its actual tournament page.
 * Redirects to /tournaments/:id
 */
export default function TournamentSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      navigate('/tournaments', { replace: true });
      return;
    }

    tournamentsService
      .getBySlug(slug)
      .then((tournament) => {
        navigate(`/tournaments/${tournament.id}`, { replace: true });
      })
      .catch(() => {
        setError('Torneo no encontrado');
      });
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🏸</p>
          <h2 className="text-xl font-bold mb-2">Torneo no encontrado</h2>
          <p className="text-light-secondary mb-4">El enlace que seguiste no es válido o el torneo ya no existe.</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Ver todos los torneos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Cargando torneo..." />
    </div>
  );
}
