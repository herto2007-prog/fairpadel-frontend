import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Trophy, Users, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { inscripcionService } from '../../../services/inscripcionService';
import { tournamentService, Tournament } from '../../../services/tournamentService';
import { useAuthStore } from '../../../store/authStore';

export function InscripcionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [jugador2Documento, setJugador2Documento] = useState('');
  const [jugador2Email, setJugador2Email] = useState('');
  const [modoPago, setModoPago] = useState<'COMPLETO' | 'INDIVIDUAL'>('COMPLETO');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadTournament();
  }, [id]);

  const loadTournament = async () => {
    try {
      setIsLoading(true);
      const data = await tournamentService.getById(id!);
      setTournament(data);
    } catch (error) {
      toast.error('Error al cargar torneo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast.error('Selecciona una categoría');
      return;
    }

    if (!jugador2Documento) {
      toast.error('Ingresa el documento de tu compañero');
      return;
    }

    try {
      setIsSubmitting(true);
      await inscripcionService.create({
        tournamentId: id!,
        categoryId: selectedCategory,
        jugador2Documento,
        jugador2Email: jugador2Email || undefined,
        modoPago,
      });
      toast.success('Inscripción realizada correctamente');
      navigate('/inscripciones/my');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al inscribirse');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Torneo no encontrado</h2>
          <Button onClick={() => navigate('/tournaments')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Torneos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al torneo
        </button>

        <div className="bg-gradient-to-r from-[#df2531]/20 to-transparent rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Inscribirse al Torneo</h1>
          <h2 className="text-xl text-[#df2531] font-semibold">{tournament.nombre}</h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-[#151921] border border-[#232838] rounded-xl p-6 space-y-6">
          {/* Info del jugador 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Jugador 1 (Tú)
            </label>
            <div className="bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white">
              {user?.nombre} {user?.apellido} - {user?.documento}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Trophy className="w-4 h-4 inline mr-1 text-[#df2531]" />
              Categoría *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#df2531]"
              required
            >
              <option value="">Selecciona una categoría</option>
              {tournament.categories?.map((tc) => (
                <option key={tc.category.id} value={tc.category.id}>
                  {tc.category.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Jugador 2 */}
          <div className="border-t border-[#232838] pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              <Users className="w-4 h-4 inline mr-1 text-[#df2531]" />
              Compañero de Pareja
            </label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Documento (C.I.) *</label>
                <input
                  type="text"
                  value={jugador2Documento}
                  onChange={(e) => setJugador2Documento(e.target.value)}
                  placeholder="Número de documento de tu compañero"
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={jugador2Email}
                  onChange={(e) => setJugador2Email(e.target.value)}
                  placeholder="Email de tu compañero (para notificarle)"
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531]"
                />
              </div>
            </div>
          </div>

          {/* Modo de pago */}
          <div className="border-t border-[#232838] pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Modo de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModoPago('COMPLETO')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  modoPago === 'COMPLETO'
                    ? 'border-[#df2531] bg-[#df2531]/10'
                    : 'border-[#232838] bg-[#0B0E14] hover:border-[#df2531]/50'
                }`}
              >
                <div className="font-medium text-white">Pago Completo</div>
                <div className="text-xs text-gray-400 mt-1">Un jugador paga por ambos</div>
              </button>
              <button
                type="button"
                onClick={() => setModoPago('INDIVIDUAL')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  modoPago === 'INDIVIDUAL'
                    ? 'border-[#df2531] bg-[#df2531]/10'
                    : 'border-[#232838] bg-[#0B0E14] hover:border-[#df2531]/50'
                }`}
              >
                <div className="font-medium text-white">Pago Individual</div>
                <div className="text-xs text-gray-400 mt-1">Cada uno paga su parte</div>
              </button>
            </div>
          </div>

          {/* Info importante */}
          <div className="bg-[#0B0E14] border border-[#232838] rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#df2531] mb-2">Importante:</h4>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>El pago se realiza directamente con el organizador</li>
              <li>Tu inscripción quedará pendiente hasta ser confirmada</li>
              <li>El organizador te contactará para coordinar el pago</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/tournaments/${id}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscribiendo...
                </>
              ) : (
                'Confirmar Inscripción'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
