import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { tournamentService, Category, CreateTournamentData } from '../../../services/tournamentService';

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateTournamentData>({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscr: '',
    ciudad: '',
    pais: 'Paraguay',
    costoInscripcion: '',
    minutosPorPartido: 90,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await tournamentService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      toast.error('Selecciona al menos una categoría');
      return;
    }

    setIsLoading(true);

    try {
      const data: CreateTournamentData = {
        ...formData,
        categoryIds: selectedCategories,
      };
      
      const tournament = await tournamentService.create(data);
      toast.success('Torneo creado exitosamente');
      navigate(`/tournaments/${tournament.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear torneo');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Group categories by tipo
  const categoriesByTipo = categories.reduce((acc, cat) => {
    if (!acc[cat.tipo]) acc[cat.tipo] = [];
    acc[cat.tipo].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link to="/tournaments">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Crear Torneo</h1>
              <p className="text-dark-400 text-sm">Completa los datos de tu torneo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Torneo *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Torneo Apertura 2026"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-dark-800 text-dark-100 placeholder:text-dark-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all duration-200 resize-none"
                  placeholder="Describe tu torneo..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="datetime-local"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha de Fin *</Label>
                  <Input
                    id="fechaFin"
                    type="datetime-local"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaLimiteInscr">Fecha Límite de Inscripción *</Label>
                <Input
                  id="fechaLimiteInscr"
                  type="datetime-local"
                  value={formData.fechaLimiteInscr}
                  onChange={(e) => setFormData({ ...formData, fechaLimiteInscr: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ej: Asunción"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costos */}
          <Card>
            <CardHeader>
              <CardTitle>Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costoInscripcion">Costo de Inscripción (Gs)</Label>
                  <Input
                    id="costoInscripcion"
                    type="number"
                    placeholder="0"
                    value={formData.costoInscripcion}
                    onChange={(e) => setFormData({ ...formData, costoInscripcion: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minutosPorPartido">Minutos por Partido</Label>
                  <Input
                    id="minutosPorPartido"
                    type="number"
                    value={formData.minutosPorPartido}
                    onChange={(e) => setFormData({ ...formData, minutosPorPartido: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorías */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoriesByTipo).map(([tipo, cats]) => (
                  <div key={tipo}>
                    <h4 className="text-sm font-semibold text-dark-400 mb-2 uppercase">
                      {tipo === 'MASCULINO' ? 'Caballeros' : tipo === 'FEMENINO' ? 'Damas' : 'Mixto'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cats.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedCategories.includes(category.id)
                              ? 'bg-primary-600 text-white'
                              : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                          }`}
                        >
                          {category.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Link to="/tournaments" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Crear Torneo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
