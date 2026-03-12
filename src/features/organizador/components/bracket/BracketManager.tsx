import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Settings, Users, AlertCircle, Swords, ChevronRight, Lock, Unlock } from 'lucide-react';
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

const MINIMO_PARA_SORTEAR = 8;

export function BracketManager({ tournamentId }: BracketManagerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cerrandoInscripciones, setCerrandoInscripciones] = useState<string | null>(null);

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

  const handleCerrarInscripciones = async (categoria: Categoria) => {
    setCerrandoInscripciones(categoria.id);
    try {
      const { data } = await api.post(`/admin/categorias/${categoria.id}/cerrar-inscripciones`);
      if (data.success) {
        loadCategorias();
      }
    } catch (error: any) {
      console.error('Error cerrando inscripciones:', error);
      alert(error.response?.data?.message || 'Error cerrando inscripciones');
    } finally {
      setCerrandoInscripciones(null);
    }
  };

  const handleAbrirInscripciones = async (categoria: Categoria) => {
    try {
      const { data } = await api.post(`/admin/categorias/${categoria.id}/abrir-inscripciones`);
      if (data.success) {
        loadCategorias();
      }
    } catch (error: any) {
      console.error('Error abriendo inscripciones:', error);
      alert(error.response?.data?.message || 'Error abriendo inscripciones');
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
      case 'INSCRIPCIONES_CERRADAS':
        return 'text-yellow-400';
      case 'FIXTURE_BORRADOR':
        return 'text-orange-400';
      case 'SORTEO_REALIZADO':
        return 'text-blue-400';
      case 'EN_CURSO':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getEstadoLabel = (estado: string) => {
    return estado.replace(/_/g, ' ');
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

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <span className="font-medium">Flujo del sorteo:</span> Las categorías se sortean de forma independiente. 
          Necesitas cerrar inscripciones y tener al menos {MINIMO_PARA_SORTEAR} parejas para generar el bracket.
        </p>
      </div>

      {/* Lista de categorías */}
      <div className="grid gap-3">
        {categorias.map((categoria) => {
          const puedeCerrarInscripciones = categoria.estado === 'INSCRIPCIONES_ABIERTAS' && categoria.inscripcionesCount >= MINIMO_PARA_SORTEAR;
          const puedeAbrirInscripciones = categoria.estado === 'INSCRIPCIONES_CERRADAS' && !categoria.fixtureVersionId;
          const puedeConfigurar = (categoria.estado === 'INSCRIPCIONES_CERRADAS' || categoria.estado === 'INSCRIPCIONES_ABIERTAS') && 
                                   categoria.inscripcionesCount >= MINIMO_PARA_SORTEAR && 
                                   !categoria.fixtureVersionId;
          const faltanParaMinimo = Math.max(0, MINIMO_PARA_SORTEAR - categoria.inscripcionesCount);

          return (
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
                    <div className="flex items-center gap-3 text-sm mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        {categoria.inscripcionesCount} inscritos
                      </span>
                      <span className={`text-sm ${getEstadoColor(categoria.estado)}`}>
                        {getEstadoLabel(categoria.estado)}
                      </span>
                      {faltanParaMinimo > 0 && (
                        <span className="text-xs text-yellow-500">
                          (Faltan {faltanParaMinimo} para sortear)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cerrar inscripciones */}
                  {puedeCerrarInscripciones && (
                    <button
                      onClick={() => handleCerrarInscripciones(categoria)}
                      disabled={cerrandoInscripciones === categoria.id}
                      className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-yellow-500/30 transition-colors"
                    >
                      {cerrandoInscripciones === categoria.id ? (
                        <div className="w-4 h-4 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Cerrar Inscripciones
                    </button>
                  )}

                  {/* Abrir inscripciones */}
                  {puedeAbrirInscripciones && (
                    <button
                      onClick={() => handleAbrirInscripciones(categoria)}
                      className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-green-500/30 transition-colors"
                    >
                      <Unlock className="w-4 h-4" />
                      Reabrir
                    </button>
                  )}

                  {/* Ver Bracket */}
                  {categoria.fixtureVersionId ? (
                    <button
                      onClick={() => setCategoriaSeleccionada(categoria)}
                      className="px-4 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                      Ver Bracket
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : puedeConfigurar ? (
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
                      {faltanParaMinimo > 0 ? (
                        <span>Faltan {faltanParaMinimo} parejas</span>
                      ) : categoria.estado === 'INSCRIPCIONES_ABIERTAS' ? (
                        <span>Cerrar inscripciones</span>
                      ) : (
                        <span>No disponible</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
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
