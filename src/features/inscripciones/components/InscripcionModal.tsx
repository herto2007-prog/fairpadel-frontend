import { useState, useEffect } from 'react';
import { Modal, Select, Input, Button } from '@/components/ui';
import { inscripcionesService, CreateInscripcionDto } from '@/services/inscripcionesService';
import { tournamentsService } from '@/services/tournamentsService';
import type { Tournament, Category } from '@/types';
import { Modalidad } from '@/types';

interface InscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onSuccess?: () => void;
}

export const InscripcionModal: React.FC<InscripcionModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateInscripcionDto>({
    tournamentId: tournament.id,
    categoryId: '',
    modalidad: 'TRADICIONAL',
    jugador2Documento: '',
    metodoPago: 'EFECTIVO',
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const data = await tournamentsService.getCategories();
      // Filtrar solo las categorías del torneo
      const tournamentCategoryIds = tournament.categorias?.map(c => c.categoryId || c.category?.id) || [];
      setCategories(data.filter(c => tournamentCategoryIds.includes(c.id)));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId) {
      setError('Debes seleccionar una categoría');
      return;
    }

    if (!formData.jugador2Documento) {
      setError('Debes ingresar el documento de tu pareja');
      return;
    }

    setLoading(true);

    try {
      await inscripcionesService.create(formData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al inscribirse');
    } finally {
      setLoading(false);
    }
  };

  // Obtener modalidades del torneo
  const tournamentModalidades = tournament.modalidades?.map(m => m.modalidad) || [Modalidad.TRADICIONAL];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inscribirse al Torneo" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-dark-surface rounded-lg">
          <h3 className="font-semibold">{tournament.nombre}</h3>
          <p className="text-sm text-light-secondary">
            {new Date(tournament.fechaInicio).toLocaleDateString()} - {tournament.ciudad}
          </p>
          <p className="text-sm font-medium text-primary-500 mt-1">
            Costo: Gs. {new Intl.NumberFormat('es-PY').format(tournament.costoInscripcion)}
          </p>
        </div>

        <Select
          label="Categoría"
          value={formData.categoryId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          required
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </Select>

        <Select
          label="Modalidad"
          value={formData.modalidad}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFormData({ ...formData, modalidad: e.target.value as 'TRADICIONAL' | 'MIXTO' | 'SUMA' })
          }
          required
        >
          {tournamentModalidades.map((mod) => (
            <option key={mod} value={mod}>
              {mod}
            </option>
          ))}
        </Select>

        <Select
          label="Método de Pago"
          value={formData.metodoPago}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFormData({ ...formData, metodoPago: e.target.value as 'BANCARD' | 'TRANSFERENCIA' | 'EFECTIVO' })
          }
          required
        >
          <option value="BANCARD">Tarjeta de Crédito/Débito (Bancard)</option>
          <option value="TRANSFERENCIA">Transferencia Bancaria</option>
          <option value="EFECTIVO">Efectivo (Presencial)</option>
        </Select>

        <Input
          label="Documento de tu Pareja"
          type="text"
          placeholder="Ej: 4567890"
          value={formData.jugador2Documento}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, jugador2Documento: e.target.value })
          }
          required
        />

        <p className="text-xs text-light-secondary">
          Tu pareja debe estar registrada en FairPadel con este documento.
        </p>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1">
            Inscribirse
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InscripcionModal;