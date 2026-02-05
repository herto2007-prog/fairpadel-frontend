import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { matchesService } from '@/services/matchesService';
import { tournamentsService } from '@/services/tournamentsService';
import { Loading, Card, CardContent, Select } from '@/components/ui';
import { BracketView } from '../components/BracketView';
import type { Match, Tournament, Category } from '@/types';

const FixturePage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      const tournamentData = await tournamentsService.getById(tournamentId!);
      setTournament(tournamentData);
      
      // Mapear las categorías del torneo correctamente
      if (tournamentData.categorias && tournamentData.categorias.length > 0) {
        const mappedCategories = tournamentData.categorias.map(tc => tc.category);
        setCategories(mappedCategories);
        setSelectedCategory(mappedCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const matchesData = await matchesService.getByCategory(tournamentId!, selectedCategory);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando fixture..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Torneo no encontrado</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{tournament.nombre}</h1>
        <p className="text-gray-600 mt-2">Fixture del torneo</p>
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <Select
            label="Categoría"
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className="w-64"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </Select>
        </div>
      )}

      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Sin partidos</h3>
            <p className="text-gray-600">
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