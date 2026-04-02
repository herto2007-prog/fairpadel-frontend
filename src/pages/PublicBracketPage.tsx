import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChampionshipBracket } from '../components/bracket';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { api } from '../services/api';

export function PublicBracketPage() {
  const { id } = useParams<{ id: string }>();
  const [, setTorneo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTorneo();
    }
  }, [id]);

  const loadTorneo = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/public/torneos/${id}`);
      if (data.success) {
        setTorneo(data.torneo);
        // Verificar si el bracket está publicado
        if (!data.torneo.bracketPublicado) {
          setError('El bracket de este torneo aún no ha sido publicado');
        }
      }
    } catch (err: any) {
      setError('Torneo no encontrado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={true} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={true} />
        <div className="text-center z-10">
          <h1 className="text-4xl font-bold text-white mb-4">FairPadel</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div className="relative z-10 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img 
            src="/logos/logo.png"
            alt="FairPadel"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-16 mx-auto"
          />
          <p className="text-gray-400 mt-2">Bracket Oficial</p>
        </div>

        {/* Bracket */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ChampionshipBracket 
            tournamentId={id!}
            isPublic={true}
          />
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>fairpadel.com • Organización de torneos de pádel</p>
        </div>
      </div>
    </div>
  );
}
