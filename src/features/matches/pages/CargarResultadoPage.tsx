import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesService } from '@/services/matchesService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui';
import type { Match, CargarResultadoDto } from '@/types';

const CargarResultadoPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    set1Pareja1: 0,
    set1Pareja2: 0,
    set2Pareja1: 0,
    set2Pareja2: 0,
    set3Pareja1: 0,
    set3Pareja2: 0,
    observaciones: '',
  });

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const matchData = await matchesService.getById(matchId!);
      setMatch(matchData);
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const resultData: CargarResultadoDto = {
        matchId: matchId!,
        set1Pareja1: formData.set1Pareja1,
        set1Pareja2: formData.set1Pareja2,
        set2Pareja1: formData.set2Pareja1,
        set2Pareja2: formData.set2Pareja2,
        set3Pareja1: formData.set3Pareja1 || undefined,
        set3Pareja2: formData.set3Pareja2 || undefined,
        observaciones: formData.observaciones || undefined,
      };

      await matchesService.cargarResultado(matchId!, resultData);
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el resultado');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando partido..." />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Partido no encontrado</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pareja1Name = match.pareja1
    ? `${match.pareja1.jugador1?.nombre} ${match.pareja1.jugador1?.apellido} / ${match.pareja1.jugador2?.nombre || 'TBD'}`
    : 'Pareja 1';

  const pareja2Name = match.pareja2
    ? `${match.pareja2.jugador1?.nombre} ${match.pareja2.jugador1?.apellido} / ${match.pareja2.jugador2?.nombre || 'TBD'}`
    : 'Pareja 2';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Cargar Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{match.ronda}</p>
            <div className="flex justify-between items-center">
              <span className="font-medium">{pareja1Name}</span>
              <span className="text-gray-400">vs</span>
              <span className="font-medium">{pareja2Name}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Set 1 */}
            <div>
              <h3 className="font-medium mb-2">Set 1</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={pareja1Name}
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set1Pareja1}
                  onChange={(e) => setFormData({ ...formData, set1Pareja1: Number(e.target.value) })}
                  required
                />
                <Input
                  label={pareja2Name}
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set1Pareja2}
                  onChange={(e) => setFormData({ ...formData, set1Pareja2: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Set 2 */}
            <div>
              <h3 className="font-medium mb-2">Set 2</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set2Pareja1}
                  onChange={(e) => setFormData({ ...formData, set2Pareja1: Number(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set2Pareja2}
                  onChange={(e) => setFormData({ ...formData, set2Pareja2: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Set 3 (opcional) */}
            <div>
              <h3 className="font-medium mb-2">Set 3 (opcional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set3Pareja1}
                  onChange={(e) => setFormData({ ...formData, set3Pareja1: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.set3Pareja2}
                  onChange={(e) => setFormData({ ...formData, set3Pareja2: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Notas adicionales..."
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting} className="flex-1">
                Guardar Resultado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CargarResultadoPage;
