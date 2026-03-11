import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Settings, Users, AlertCircle, Swords, ChevronRight } from 'lucide-react';
import { api } from '../../../../services/api';
import { BracketView } from './BracketView';
import { ConfigurarBracketModal } from './ConfigurarBracketModal';

interface Categoria {
  id: string;
  categoryId: string;
  category: {
    id: string;
    nombre: string;
    tipo: string;
  };
  inscripcionAbierta: boolean;
  estado: string;
  fixtureVersionId: string | null;
  inscripcionesCount: number;
}

interface BracketManagerProps {
  tournamentId: string;
}

export function BracketManager({ tournamentId }: BracketManagerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, [tournamentId]);

  const loadCategorias = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/categorias`);
      if (data.success) {
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurar = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria);
    setShowConfigModal(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'INSCRIPCIONES_ABIERTAS':
        return 'text-green-400';
      case 'FIXTURE_BORRADOR':
        return 'text-yellow-400';
      case 'SORTEO_REALIZADO':
        return 'text-blue-400';
      case 'EN_CURSO':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  // Si hay una categoría seleccionada con bracket generado, mostrar el bracket
  if (categoriaSeleccionada?.fixtureVersionId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← Volver a categorías
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium">
              Publicar Bracket
            </button>
          </div>
        </div>
        <BracketView 
          tournamentId={tournamentId}
          categoriaId={categoriaSeleccionada.categoryId}
          fixtureVersionId={categoriaSeleccionada.fixtureVersionId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#df2531]" />
          Bracket por Categoría
        </h2>
        <span className="text-sm text-gray-400">
          {categorias.length} categorías
        </span>
      </div>

      {/* Lista de categorías */}
      <div className="grid gap-3">
        {categorias.map((categoria) => (
          <motion.div
            key={categoria.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#df2531]/10 flex items-center justify-center">
                  <Swords className="w-6 h-6 text-[#df2531]" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{categoria.category.nombre}</h3>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Users className="w-4 h-4" />
                      {categoria.inscripcionesCount} inscritos
                    </span>
                    <span className={`text-sm ${getEstadoColor(categoria.estado)}`}>
                      {categoria.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {categoria.fixtureVersionId ? (
                  <button
                    onClick={() => setCategoriaSeleccionada(categoria)}
                    className="px-4 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    Ver Bracket
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : categoria.inscripcionesCount >= 3 ? (
                  <button
                    onClick={() => handleConfigurar(categoria)}
                    className="px-4 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Mínimo 3 parejas
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de configuración */}
      {showConfigModal && categoriaSeleccionada && (
        <ConfigurarBracketModal
          categoria={categoriaSeleccionada}
          onClose={() => setShowConfigModal(false)}
          onGenerado={() => {
            setShowConfigModal(false);
            loadCategorias();
          }}
        />
      )}
    </div>
  );
}
