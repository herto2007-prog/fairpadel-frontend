import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, AlertTriangle, Loader2, Check } from 'lucide-react';
import { api } from '../../../../services/api';

interface Categoria {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: 'MASCULINO' | 'FEMENINO';
  total: number;
  confirmadas: number;
}

interface Inscripcion {
  id: string;
  categoriaId: string;
  categoriaNombre: string;
  jugador1: { nombre: string; apellido: string };
  jugador2?: { nombre: string; apellido: string };
}

interface ModalCambiarCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  inscripcion: Inscripcion | null;
  categorias: Categoria[];
}

export function ModalCambiarCategoria({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  inscripcion,
  categorias,
}: ModalCambiarCategoriaProps) {
  const [loading, setLoading] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  const handleCambiar = async () => {
    if (!inscripcion || !categoriaSeleccionada) return;
    setLoading(true);
    try {
      await api.put(
        `/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}/cambiar-categoria`,
        { nuevaCategoriaId: categoriaSeleccionada }
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error cambiando categoría');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías del mismo tipo y excluir la actual
  const categoriasDisponibles = categorias.filter(
    (c) => c.categoriaId !== inscripcion?.categoriaId
  );

  if (!isOpen || !inscripcion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Cambiar Categoría</h3>
                <p className="text-sm text-gray-400">Mover inscripción a otra categoría</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#232838] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-4">
            {/* Info actual */}
            <div className="bg-[#0B0E14] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Inscripción actual:</p>
              <p className="text-white font-medium">
                {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                {inscripcion.jugador2 && ` + ${inscripcion.jugador2.nombre} ${inscripcion.jugador2.apellido}`}
              </p>
              <p className="text-sm text-[#df2531] mt-1">
                Categoría actual: {inscripcion.categoriaNombre}
              </p>
            </div>

            {/* Alerta */}
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400">
                Verifica que la categoría destino corresponda al nivel de los jugadores.
                No se puede mover si algún jugador ya está inscrito en la categoría destino.
              </p>
            </div>

            {/* Selector de categoría */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Nueva categoría</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categoriasDisponibles.map((cat) => (
                  <button
                    key={cat.categoriaId}
                    onClick={() => setCategoriaSeleccionada(cat.categoriaId)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      categoriaSeleccionada === cat.categoriaId
                        ? 'bg-[#df2531]/10 border-[#df2531]'
                        : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-white font-medium">{cat.categoriaNombre}</p>
                      <p className="text-sm text-gray-500">
                        {cat.confirmadas} confirmados / {cat.total} total
                      </p>
                    </div>
                    {categoriaSeleccionada === cat.categoriaId && (
                      <Check className="w-5 h-5 text-[#df2531]" />
                    )}
                  </button>
                ))}
              </div>
              {categoriasDisponibles.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay otras categorías disponibles
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#232838] bg-[#0B0E14]">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCambiar}
              disabled={!categoriaSeleccionada || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Mover Inscripción
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
