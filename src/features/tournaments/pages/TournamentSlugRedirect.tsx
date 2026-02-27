import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loading } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
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
    // Reset error when slug changes
    setError('');

    if (!slug) {
      navigate('/tournaments', { replace: true });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    tournamentsService
      .getBySlug(slug)
      .then((tournament) => {
        navigate(`/tournaments/${tournament.id}`, { replace: true });
      })
      .catch(() => {
        setError('Torneo no encontrado');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Torneo no encontrado</h2>
          <p className="text-light-secondary mb-4">El enlace que seguiste no es válido o el torneo ya no existe.</p>
          <Link
            to="/tournaments"
            className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Ver todos los torneos
          </Link>
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
