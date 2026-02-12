import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Checkbox, Loading } from '@/components/ui';
import type { Category, Sede } from '@/types';
import { Modalidad } from '@/types';
import SedeSelector from '../components/SedeSelector';
import { ArrowLeft } from 'lucide-react';

export default function EditTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<Modalidad[]>([]);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    pais: '',
    region: '',
    ciudad: '',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscripcion: '',
    flyerUrl: '',
    costoInscripcion: 0,
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [tournament, cats] = await Promise.all([
        tournamentsService.getById(id!),
        tournamentsService.getCategories(),
      ]);

      setCategories(cats);
      setSelectedCategories(tournament.categorias?.map((tc) => tc.categoryId) || []);
      setSelectedModalidades(tournament.modalidades?.map((tm) => tm.modalidad) || []);
      if (tournament.sedePrincipal) {
        setSelectedSede(tournament.sedePrincipal);
      }

      setFormData({
        nombre: tournament.nombre,
        descripcion: tournament.descripcion || '',
        pais: tournament.pais,
        region: tournament.region,
        ciudad: tournament.ciudad,
        fechaInicio: tournament.fechaInicio?.split('T')[0] || '',
        fechaFin: tournament.fechaFin?.split('T')[0] || '',
        fechaLimiteInscripcion: tournament.fechaLimiteInscr?.split('T')[0] || '',
        flyerUrl: tournament.flyerUrl,
        costoInscripcion: Number(tournament.costoInscripcion),
      });
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError('Error al cargar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cid) => cid !== categoryId)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || formData.nombre.length < 5) {
      setError('El nombre del torneo debe tener al menos 5 caracteres');
      return;
    }

    if (!formData.fechaInicio || !formData.fechaFin || !formData.fechaLimiteInscripcion) {
      setError('Debes completar todas las fechas');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Debes seleccionar al menos una categoría');
      return;
    }

    if (selectedModalidades.length === 0) {
      setError('Debes seleccionar al menos una modalidad');
      return;
    }

    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);
    const fechaLimite = new Date(formData.fechaLimiteInscripcion);

    if (fechaFin <= fechaInicio) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    if (fechaLimite >= fechaInicio) {
      setError('La fecha límite de inscripción debe ser anterior a la fecha de inicio');
      return;
    }

    setSaving(true);

    try {
      await tournamentsService.update(id!, {
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
        sedeId: selectedSede?.id || undefined,
        sede: selectedSede?.nombre || undefined,
        direccion: selectedSede?.direccion || undefined,
        mapsUrl: selectedSede?.mapsUrl || undefined,
        categorias: selectedCategories,
        modalidades: selectedModalidades,
      });
      navigate(`/tournaments/${id}/manage`);
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Error al actualizar el torneo');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  const maleCategories = categories.filter((c) => c.tipo === 'MASCULINO');
  const femaleCategories = categories.filter((c) => c.tipo === 'FEMENINO');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/tournaments/${id}/manage`)}
              className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <CardTitle>Editar Torneo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>

              <Input
                label="Nombre del Torneo *"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-light-text mb-1">
                  Descripción
                </label>
                <textarea
                  className="w-full rounded-md border border-dark-border bg-dark-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <Input
                label="URL del Flyer *"
                type="url"
                value={formData.flyerUrl}
                onChange={(e) => setFormData({ ...formData, flyerUrl: e.target.value })}
                required
              />

              <Input
                label="Costo de Inscripción (Gs.) *"
                type="number"
                value={formData.costoInscripcion}
                onChange={(e) => setFormData({ ...formData, costoInscripcion: Number(e.target.value) })}
                required
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="País *"
                  type="text"
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  required
                />
                <Input
                  label="Región/Departamento *"
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
                onSelect={(sede) => setSelectedSede(sede)}
                ciudad={formData.ciudad}
              />
              {selectedSede && (
                <div className="p-3 bg-primary-500/20 border border-primary-500/50 rounded-md">
                  <p className="text-sm text-primary-400">
                    <strong>Sede seleccionada:</strong> {selectedSede.nombre}
                    {selectedSede.direccion && ` - ${selectedSede.direccion}`}
                  </p>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Fechas</h3>
              <p className="text-sm text-light-secondary">
                La fecha límite de inscripción debe ser <strong>anterior</strong> a la fecha de inicio.
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
                  label="Límite de Inscripción *"
                  type="date"
                  value={formData.fechaLimiteInscripcion}
                  onChange={(e) => setFormData({ ...formData, fechaLimiteInscripcion: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Categorías *</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategories(categories.map((c) => c.id))}
                    className="text-xs px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full hover:bg-primary-500/30 transition-colors"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-xs px-3 py-1 bg-dark-surface text-light-secondary rounded-full hover:bg-dark-hover transition-colors"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-400">Masculino</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const maleIds = maleCategories.map((c) => c.id);
                        const allSelected = maleIds.every((id) => selectedCategories.includes(id));
                        if (allSelected) {
                          setSelectedCategories((prev) => prev.filter((id) => !maleIds.includes(id)));
                        } else {
                          setSelectedCategories((prev) => [...new Set([...prev, ...maleIds])]);
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {maleCategories.every((c) => selectedCategories.includes(c.id)) ? 'Desmarcar' : 'Marcar todos'}
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-pink-400">Femenino</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const femaleIds = femaleCategories.map((c) => c.id);
                        const allSelected = femaleIds.every((id) => selectedCategories.includes(id));
                        if (allSelected) {
                          setSelectedCategories((prev) => prev.filter((id) => !femaleIds.includes(id)));
                        } else {
                          setSelectedCategories((prev) => [...new Set([...prev, ...femaleIds])]);
                        }
                      }}
                      className="text-xs text-pink-400 hover:text-pink-300"
                    >
                      {femaleCategories.every((c) => selectedCategories.includes(c.id)) ? 'Desmarcar' : 'Marcar todas'}
                    </button>
                  </div>
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
                <p className="text-sm text-primary-500">
                  {selectedCategories.length} categoría(s) seleccionada(s)
                </p>
              )}
            </div>

            {/* Modalidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Modalidades *</h3>
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
                onClick={() => navigate(`/tournaments/${id}/manage`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                className="flex-1"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
