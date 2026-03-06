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
    fechaInicioInscripcion: '',
    fechaFinInscripcion: '',
    maxParejas: undefined,
    minParejas: undefined,
    puntosRanking: undefined,
    premio: '',
    flyerUrl: '',
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
      toast.error(error.response?.data?.message || 'Error al crear torneo');
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
  const categoriesByTipo = categories.reduce((acc, category) => {
    if (!acc[category.tipo]) {
      acc[category.tipo] = [];
    }
    acc[category.tipo].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/tournaments">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Torneos
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold text-white">Crear Nuevo Torneo</h1>
          <p className="text-dark-400 mt-2">Completa los datos para crear tu torneo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Torneo *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Torneo de Verano 2024"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  placeholder="Describe tu torneo, premios, reglas, etc."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flyerUrl">URL del Flyer (opcional)</Label>
                <Input
                  id="flyerUrl"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.flyerUrl}
                  onChange={(e) => setFormData({ ...formData, flyerUrl: e.target.value })}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicioInscripcion">Inicio de Inscripciones</Label>
                  <Input
                    id="fechaInicioInscripcion"
                    type="datetime-local"
                    value={formData.fechaInicioInscripcion}
                    onChange={(e) => setFormData({ ...formData, fechaInicioInscripcion: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFinInscripcion">Fin de Inscripciones</Label>
                  <Input
                    id="fechaFinInscripcion"
                    type="datetime-local"
                    value={formData.fechaFinInscripcion}
                    onChange={(e) => setFormData({ ...formData, fechaFinInscripcion: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxParejas">Cupo Máximo de Parejas</Label>
                  <Input
                    id="maxParejas"
                    type="number"
                    placeholder="Sin límite"
                    value={formData.maxParejas || ''}
                    onChange={(e) => setFormData({ ...formData, maxParejas: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minParejas">Mínimo de Parejas</Label>
                  <Input
                    id="minParejas"
                    type="number"
                    placeholder="0"
                    value={formData.minParejas || ''}
                    onChange={(e) => setFormData({ ...formData, minParejas: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puntosRanking">Puntos de Ranking</Label>
                  <Input
                    id="puntosRanking"
                    type="number"
                    placeholder="0"
                    value={formData.puntosRanking || ''}
                    onChange={(e) => setFormData({ ...formData, puntosRanking: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premio">Premio</Label>
                  <Input
                    id="premio"
                    placeholder="Ej: Trofeo + Gs. 1.000.000"
                    value={formData.premio}
                    onChange={(e) => setFormData({ ...formData, premio: e.target.value })}
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
              
              {selectedCategories.length > 0 && (
                <div className="mt-4 p-3 bg-primary-600/10 border border-primary-600/20 rounded-lg">
                  <p className="text-sm text-primary-400">
                    {selectedCategories.length} categoría(s) seleccionada(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link to="/tournaments" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
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
