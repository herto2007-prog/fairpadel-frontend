import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Checkbox } from '@/components/ui';
import type { Category, Sede } from '@/types';
import { Modalidad } from '@/types';
import SedeSelector from '../components/SedeSelector';

const CreateTournamentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<Modalidad[]>([Modalidad.TRADICIONAL]);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    pais: 'Paraguay',
    region: 'Alto Parana',
    ciudad: 'Ciudad del Este',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscripcion: '',
    flyerUrl: '',
    costoInscripcion: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await tournamentsService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleModalidadToggle = (modalidad: Modalidad) => {
    setSelectedModalidades((prev) =>
      prev.includes(modalidad)
        ? prev.filter((m) => m !== modalidad)
        : [...prev, modalidad]
    );
  };

  const handleSedeSelect = (sede: Sede | null) => {
    setSelectedSede(sede);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones del frontend
    if (!formData.nombre || formData.nombre.length < 5) {
      setError('El nombre del torneo debe tener al menos 5 caracteres');
      return;
    }

    if (!formData.fechaInicio || !formData.fechaFin || !formData.fechaLimiteInscripcion) {
      setError('Debes completar todas las fechas');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Debes seleccionar al menos una categoria');
      return;
    }

    if (selectedModalidades.length === 0) {
      setError('Debes seleccionar al menos una modalidad');
      return;
    }

    if (!formData.flyerUrl) {
      setError('La URL del flyer es obligatoria');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);
    const fechaLimite = new Date(formData.fechaLimiteInscripcion);

    if (fechaFin <= fechaInicio) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    if (fechaLimite >= fechaInicio) {
      setError('La fecha limite de inscripcion debe ser anterior a la fecha de inicio');
      return;
    }

    setLoading(true);

    try {
      const tournamentData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        pais: formData.pais,
        region: formData.region,
        ciudad: formData.ciudad,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        fechaLimiteInscripcion: formData.fechaLimiteInscripcion,
        flyerUrl: formData.flyerUrl,
        costoInscripcion: Number(formData.costoInscripcion),
        // Nuevo: sede del sistema
        sedeId: selectedSede?.id || undefined,
        // Legacy: auto-fill from sede si existe
        sede: selectedSede?.nombre || undefined,
        direccion: selectedSede?.direccion || undefined,
        mapsUrl: selectedSede?.mapsUrl || undefined,
        categorias: selectedCategories,
        modalidades: selectedModalidades,
      };

      const tournament = await tournamentsService.create(tournamentData);
      navigate(`/tournaments/${tournament.id}`);
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Error al crear el torneo');
      }
    } finally {
      setLoading(false);
    }
  };

  const maleCategories = categories.filter((c) => c.tipo === 'MASCULINO');
  const femaleCategories = categories.filter((c) => c.tipo === 'FEMENINO');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Torneo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Informacion basica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informacion Basica</h3>

              <Input
                label="Nombre del Torneo *"
                type="text"
                placeholder="Ej: Copa FairPadel 2026 (minimo 5 caracteres)"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Describe tu torneo..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <Input
                label="URL del Flyer *"
                type="url"
                placeholder="https://ejemplo.com/flyer.jpg"
                value={formData.flyerUrl}
                onChange={(e) => setFormData({ ...formData, flyerUrl: e.target.value })}
                required
              />

              <Input
                label="Costo de Inscripcion (Gs.) *"
                type="number"
                placeholder="150000"
                value={formData.costoInscripcion}
                onChange={(e) => setFormData({ ...formData, costoInscripcion: Number(e.target.value) })}
                required
              />
            </div>

            {/* Ubicacion */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Ubicacion</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Pais *"
                  type="text"
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  required
                />
                <Input
                  label="Region/Departamento *"
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                />
                <Input
                  label="Ciudad *"
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Sede */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Sede del Torneo</h3>
              <SedeSelector
                selectedSedeId={selectedSede?.id || null}
                onSelect={handleSedeSelect}
                ciudad={formData.ciudad}
              />
              {selectedSede && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <p className="text-sm text-emerald-700">
                    <strong>Sede seleccionada:</strong> {selectedSede.nombre}
                    {selectedSede.direccion && ` - ${selectedSede.direccion}`}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {selectedSede.canchas?.length || 0} cancha(s) disponible(s)
                  </p>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Fechas</h3>
              <p className="text-sm text-gray-500">
                La fecha limite de inscripcion debe ser <strong>anterior</strong> a la fecha de inicio del torneo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Fecha de Inicio *"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  required
                />
                <Input
                  label="Fecha de Fin *"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  required
                />
                <Input
                  label="Limite de Inscripcion *"
                  type="date"
                  value={formData.fechaLimiteInscripcion}
                  onChange={(e) => setFormData({ ...formData, fechaLimiteInscripcion: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Categorias *</h3>
              <p className="text-sm text-gray-500">Selecciona al menos una categoria</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-blue-600">Masculino</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {maleCategories.map((category) => (
                      <Checkbox
                        key={category.id}
                        label={category.nombre}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-pink-600">Femenino</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {femaleCategories.map((category) => (
                      <Checkbox
                        key={category.id}
                        label={category.nombre}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-sm text-emerald-600">
                  {selectedCategories.length} categoria(s) seleccionada(s)
                </p>
              )}
            </div>

            {/* Modalidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Modalidades *</h3>
              <p className="text-sm text-gray-500">Selecciona al menos una modalidad</p>

              <div className="flex flex-wrap gap-4">
                {Object.values(Modalidad).map((modalidad) => (
                  <Checkbox
                    key={modalidad}
                    label={modalidad}
                    checked={selectedModalidades.includes(modalidad)}
                    onChange={() => handleModalidadToggle(modalidad)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                Crear Torneo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTournamentPage;
