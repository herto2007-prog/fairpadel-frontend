import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesService } from '@/services/matchesService';
import { tournamentsService } from '@/services/tournamentsService';
import { Loading, Card, CardContent, Select, Button } from '@/components/ui';
import { BracketView } from '../components/BracketView';
import { Printer, AlertTriangle } from 'lucide-react';
import type { Match, Tournament, Category } from '@/types';

const FixturePage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedCategory && tournamentId) {
      loadMatches();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoadError(false);
      const tournamentData = await tournamentsService.getById(tournamentId!);
      setTournament(tournamentData);

      // Mapear las categorías del torneo correctamente
      if (tournamentData.categorias && tournamentData.categorias.length > 0) {
        const mappedCategories = tournamentData.categorias
          .map(tc => tc.category)
          .filter(Boolean);
        setCategories(mappedCategories);
        if (mappedCategories.length > 0) {
          setSelectedCategory(mappedCategories[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const data = await matchesService.obtenerFixture(tournamentId!, selectedCategory);
      const catData = data[selectedCategory];
      if (catData?.rondas) {
        const allMatches = Object.values(catData.rondas).flat() as Match[];
        setMatches(allMatches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando fixture..." />
      </div>
    );
  }

  if (loadError || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">
              {loadError ? 'Error al cargar el torneo' : 'Torneo no encontrado'}
            </h3>
            <p className="text-light-secondary mb-4">
              {loadError ? 'Hubo un problema de conexión. Intentá de nuevo.' : 'El torneo que buscás no existe.'}
            </p>
            <div className="flex gap-3 justify-center">
              {loadError && (
                <Button variant="primary" onClick={() => { setLoading(true); loadData(); }}>
                  Reintentar
                </Button>
              )}
              <Link to="/tournaments">
                <Button variant="outline">Ver torneos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8 no-print">
        <h1 className="text-xl sm:text-3xl font-bold text-light-text line-clamp-2">{tournament.nombre}</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Fixture del torneo</p>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end gap-3 no-print">
          <Select
            label="Categoría"
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-64"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </Select>
          {matches.length > 0 && (
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Fixture
            </Button>
          )}
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">{tournament.nombre}</h1>
        <p className="text-sm text-gray-600">
          Fixture — {categories.find(c => c.id === selectedCategory)?.nombre || ''}
        </p>
      </div>

      {matchesLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando partidos..." />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-10 w-10 text-light-muted mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Fixture no disponible</h3>
            <p className="text-light-secondary">
              Aún no se ha generado el fixture para esta categoría
            </p>
          </CardContent>
        </Card>
      ) : (
        <BracketView matches={matches} />
      )}
    </div>
  );
};

export default FixturePage;