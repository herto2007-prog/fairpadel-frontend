import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Lock, Unlock, Eye, CheckSquare, Square, X, Globe, ExternalLink, Trophy, Download } from 'lucide-react';
import { api } from '../../../../services/api';
import { matchService } from '../../../../services/matchService';
import { BracketView } from './BracketView';
import { ConfigurarBracketModal } from './ConfigurarBracketModal';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Categoria {
  id: string;
  categoryId: string;
  category: {
    id: string;
    nombre: string;
    tipo: string; // 'DAMAS' | 'CABALLEROS' | 'MIXTO'
    orden: number;
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
  const [finalizandoCategoria, setFinalizandoCategoria] = useState<string | null>(null);
  
  // Estado para selección múltiple
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<Set<string>>(new Set());
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [cerrandoGrupo, setCerrandoGrupo] = useState(false);
  const [reSorteando, setReSorteando] = useState(false);
  
  const { confirm, ...confirmState } = useConfirm();
  const { showSuccess, showError } = useToast();

  // Estado para publicación (DEBE estar antes de cualquier return condicional)
  const [publicando, setPublicando] = useState(false);
  const [urlPublica, setUrlPublica] = useState<string | null>(null);
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  const handleDescargarPartidosExcel = async () => {
    try {
      setDescargandoExcel(true);
      await matchService.descargarPartidosExcel(tournamentId);
      showSuccess('Excel descargado', 'El reporte de partidos se generó correctamente');
    } catch (error) {
      console.error('Error generando Excel de partidos:', error);
      showError('Error', 'No se pudo generar el Excel de partidos');
    } finally {
      setDescargandoExcel(false);
    }
  };

  useEffect(() => {
    loadCategorias();
    loadEstadoPublicacion();
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

  const loadEstadoPublicacion = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/estado-publicacion`);
      if (data.success) {
        setUrlPublica(data.urlPublica);
      }
    } catch (error) {
      console.error('Error cargando estado de publicación:', error);
    }
  };

  // Agrupar y ordenar categorías por género
  const categoriasAgrupadas = useMemo(() => {
    const grupos: Record<string, Categoria[]> = {
      DAMAS: [],
      CABALLEROS: [],
      MIXTO: [],
    };

    categorias.forEach((cat) => {
      const tipo = cat.category.tipo?.toUpperCase() || '';
      
      // El tipo viene como MASCULINO o FEMENINO (enum Gender)
      if (tipo === 'FEMENINO') {
        grupos.DAMAS.push(cat);
      } else if (tipo === 'MASCULINO') {
        grupos.CABALLEROS.push(cat);
      } else {
        // Si no tiene tipo definido, intentar inferir por nombre
        const nombre = cat.category.nombre?.toUpperCase() || '';
        if (nombre.includes('FEMENIN') || nombre.includes('DAMA')) {
          grupos.DAMAS.push(cat);
        } else if (nombre.includes('MASCULIN') || nombre.includes('CABALLERO')) {
          grupos.CABALLEROS.push(cat);
        } else {
          grupos.MIXTO.push(cat);
        }
      }
    });

    // Ordenar cada grupo por orden ascendente
    Object.keys(grupos).forEach((key) => {
      grupos[key].sort((a, b) => a.category.orden - b.category.orden);
    });

    return grupos;
  }, [categorias]);

  const handleCerrarInscripciones = async (categoria: Categoria) => {
    setCerrandoInscripciones(categoria.id);
    try {
      const { data } = await api.post(`/admin/categorias/${categoria.id}/cerrar-inscripciones`);
      if (data.success) {
        showSuccess('Inscripciones cerradas', data.message);
        loadCategorias();
      } else {
        // Manejar success: false del backend
        showError('Error', data.message || 'No se pudieron cerrar las inscripciones');
      }
    } catch (error: any) {
      console.error('Error cerrando inscripciones:', error);
      showError('Error', error.response?.data?.message || 'Error cerrando inscripciones');
    } finally {
      setCerrandoInscripciones(null);
    }
  };

  const handleAbrirInscripciones = async (categoria: Categoria) => {
    try {
      const { data } = await api.post(`/admin/categorias/${categoria.id}/abrir-inscripciones`);
      if (data.success) {
        showSuccess('Inscripciones reabiertas', data.message);
        loadCategorias();
      } else {
        // Manejar success: false del backend
        showError('Error', data.message || 'No se pudieron reabrir las inscripciones');
      }
    } catch (error: any) {
      console.error('Error abriendo inscripciones:', error);
      showError('Error', error.response?.data?.message || 'Error abriendo inscripciones');
    }
  };

  // Funciones para selección múltiple
  const toggleSeleccion = (categoriaId: string) => {
    const newSet = new Set(categoriasSeleccionadas);
    if (newSet.has(categoriaId)) {
      newSet.delete(categoriaId);
    } else {
      newSet.add(categoriaId);
    }
    setCategoriasSeleccionadas(newSet);
  };

  const seleccionarTodas = () => {
    const seleccionables = categorias.filter(
      c => c.estado === 'INSCRIPCIONES_ABIERTAS' && c.inscripcionesCount >= MINIMO_PARA_SORTEAR
    );
    setCategoriasSeleccionadas(new Set(seleccionables.map(c => c.id)));
  };

  const limpiarSeleccion = () => {
    setCategoriasSeleccionadas(new Set());
    setModoSeleccion(false);
  };

  const handleCerrarGrupo = async () => {
    const categoriasACerrar = categorias.filter(c => categoriasSeleccionadas.has(c.id));
    
    if (categoriasACerrar.length === 0) return;

    const confirmed = await confirm({
      title: `¿Cerrar ${categoriasACerrar.length} categorías?`,
      message: `Se cerrarán las inscripciones para: ${categoriasACerrar.map(c => c.category.nombre).join(', ')}`,
      variant: 'warning',
    });

    if (!confirmed) return;

    setCerrandoGrupo(true);
    try {
      // Cierre por lotes: una sola llamada, una sola transacción en el backend
      const { data } = await api.post(`/admin/torneos/${tournamentId}/categorias/cerrar-lote`, {
        categoriaIds: categoriasACerrar.map(c => c.id),
      });

      const cerradas: any[] = data?.cerradas || [];
      const omitidas: any[] = data?.omitidas || [];

      if (cerradas.length > 0) {
        showSuccess('Inscripciones cerradas', `${cerradas.length} categorías cerradas exitosamente`);
      }
      if (omitidas.length > 0) {
        const detalle = omitidas
          .slice(0, 3)
          .map((o: any) => `${o.nombre || 'Categoría'}: ${o.motivo}`)
          .join('\n') + (omitidas.length > 3 ? `\n... y ${omitidas.length - 3} más` : '');
        showError('Algunas categorías no se cerraron', detalle);
      }

      limpiarSeleccion();
      loadCategorias();
    } catch (error) {
      console.error('Error cerrando grupo:', error);
      showError('Error', 'No se pudieron cerrar las inscripciones');
    } finally {
      setCerrandoGrupo(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'INSCRIPCIONES_ABIERTAS':
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Inscripciones abiertas' };
      case 'INSCRIPCIONES_CERRADAS':
        return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Inscripciones cerradas' };
      case 'FIXTURE_BORRADOR':
        return { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Sorteo en borrador' };
      case 'SORTEO_REALIZADO':
        return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Sorteo publicado' };
      case 'EN_CURSO':
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'En curso' };
      case 'FINALIZADA':
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Finalizada' };
      default:
        return { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: estado };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-neutral-600 border-t-neutral-300 rounded-full"
        />
      </div>
    );
  }

  // Publicar el cuadro de ESTA categoría (no toca las demás).
  const handlePublicarBracket = async () => {
    if (!categoriaSeleccionada?.fixtureVersionId) return;
    setPublicando(true);
    try {
      const { data } = await api.post(
        `/admin/bracket/${categoriaSeleccionada.fixtureVersionId}/publicar`,
      );
      if (data.success) {
        showSuccess(
          'Cuadro publicado',
          `${categoriaSeleccionada.category.nombre} ya es visible para los jugadores.`,
        );
        await loadCategorias();
        await loadEstadoPublicacion();
        setCategoriaSeleccionada(prev => (prev ? { ...prev, estado: 'SORTEO_REALIZADO' } : prev));
      } else {
        showError('Error', data.message || 'No se pudo publicar el cuadro');
      }
    } catch (error: any) {
      console.error('Error publicando cuadro:', error);
      showError('Error', error.response?.data?.message || 'Error al publicar');
    } finally {
      setPublicando(false);
    }
  };

  // Despublicar el cuadro de ESTA categoría (vuelve a borrador, no borra nada).
  const handleDespublicarBracket = async () => {
    if (!categoriaSeleccionada?.fixtureVersionId) return;
    const confirmar = await confirm({
      title: '¿Despublicar este cuadro?',
      message: `Los jugadores ya no verán el cuadro de ${categoriaSeleccionada.category.nombre}. Las demás categorías no se tocan.`,
      variant: 'warning',
    });
    if (!confirmar) return;
    try {
      const { data } = await api.post(
        `/admin/bracket/${categoriaSeleccionada.fixtureVersionId}/despublicar`,
      );
      if (data.success) {
        showSuccess('Cuadro despublicado', data.message);
        await loadCategorias();
        await loadEstadoPublicacion();
        setCategoriaSeleccionada(prev => (prev ? { ...prev, estado: 'FIXTURE_BORRADOR' } : prev));
      }
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Error al despublicar');
    }
  };

  // Una categoría está publicada (visible al público) cuando su cuadro pasó a
  // PUBLICADO: la categoría queda en SORTEO_REALIZADO o más allá.
  const categoriaPublicada = (estado: string) =>
    ['SORTEO_REALIZADO', 'EN_CURSO', 'FINALIZADA'].includes(estado);

  const handleFinalizarCategoria = async (categoria: Categoria) => {
    const confirmed = await confirm({
      title: '¿Finalizar categoría?',
      message: `Se marcará ${categoria.category.nombre} como finalizada y se calcularán automáticamente los puntos de ranking. Esta acción no se puede deshacer.`,
      variant: 'warning',
      confirmText: 'Finalizar y calcular puntos',
    });

    if (!confirmed) return;

    setFinalizandoCategoria(categoria.id);
    try {
      const { data } = await api.post(
        `/admin/torneos/${tournamentId}/categorias/${categoria.categoryId}/finalizar`
      );
      if (data.success) {
        showSuccess('Categoría finalizada', data.message);
        loadCategorias();
      } else {
        showError('Error', data.message || 'No se pudo finalizar la categoría');
      }
    } catch (error: any) {
      console.error('Error finalizando categoría:', error);
      showError('Error', error.response?.data?.message || 'Error al finalizar la categoría');
    } finally {
      setFinalizandoCategoria(null);
    }
  };

  // Handler para re-sortear bracket
  const handleReSortear = async () => {
    console.log('[Re-Sortear] Handler llamado');
    if (!categoriaSeleccionada?.fixtureVersionId) {
      console.log('[Re-Sortear] No hay fixtureVersionId');
      return;
    }
    
    console.log('[Re-Sortear] Mostrando confirmación...');
    const confirmed = await confirm({
      title: '¿Re-sortear bracket?',
      message: 'Se eliminará el bracket actual y se generará uno nuevo. Las parejas se asignarán nuevamente.',
      variant: 'warning',
    });
    console.log('[Re-Sortear] Confirmación:', confirmed);
    
    if (!confirmed) return;
    
    setReSorteando(true);
    try {
      console.log('[Re-Sortear] Iniciando re-sorteo para fixture:', categoriaSeleccionada.fixtureVersionId);
      const { data } = await api.post(
        `/admin/bracket/${categoriaSeleccionada.fixtureVersionId}/sortear-nuevo`,
        { usarSemillas: false }
      );
      console.log('[Re-Sortear] Respuesta:', data);
      if (data.success) {
        showSuccess('Bracket re-sorteado', 'Se generó un nuevo sorteo con las parejas asignadas');
        // El API devuelve el nuevo fixtureVersionId
        const nuevoFixtureVersionId = data.fixtureVersionId;
        console.log('[Re-Sortear] Nuevo fixtureVersionId:', nuevoFixtureVersionId);
        // Actualizar la categoría seleccionada con el nuevo fixtureVersionId
        if (categoriaSeleccionada && nuevoFixtureVersionId) {
          const categoriaActualizada = {
            ...categoriaSeleccionada,
            fixtureVersionId: nuevoFixtureVersionId
          };
          // Primero limpiar para forzar re-render
          setCategoriaSeleccionada(null);
          // Luego setear la actualizada
          await loadCategorias();
          setTimeout(() => {
            setCategoriaSeleccionada(categoriaActualizada);
          }, 50);
        } else {
          await loadCategorias();
          setCategoriaSeleccionada(null);
        }
      }
    } catch (error: any) {
      console.error('[Re-Sortear] Error:', error);
      showError('Error', error.response?.data?.message || 'Error al re-sortear');
    } finally {
      setReSorteando(false);
    }
  };
  
  // Si hay una categoría seleccionada con bracket generado, mostrar el bracket
  if (categoriaSeleccionada?.fixtureVersionId) {
    const estaPublicada = categoriaPublicada(categoriaSeleccionada.estado);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Volver a categorías
          </button>
          <div className="flex items-center gap-2">
            {estaPublicada && urlPublica && (
              <a
                href={urlPublica}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver público
              </a>
            )}
            <button
              onClick={handleDescargarPartidosExcel}
              disabled={descargandoExcel}
              className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] text-white hover:bg-[#232838] border border-[#232838] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {descargandoExcel ? 'Generando...' : 'Partidos (Excel)'}
            </button>
            <button
              onClick={() => {
                console.log('[Re-Sortear] Botón clickeado');
                handleReSortear();
              }}
              disabled={reSorteando}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {reSorteando ? 'Sorteando...' : 'Re-Sortear'}
            </button>
            {estaPublicada ? (
              <button
                onClick={handleDespublicarBracket}
                className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Despublicar cuadro
              </button>
            ) : (
              <button
                onClick={handlePublicarBracket}
                disabled={publicando}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {publicando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Publicar cuadro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <BracketView 
          tournamentId={tournamentId}
          categoriaId={categoriaSeleccionada.categoryId}
          fixtureVersionId={categoriaSeleccionada.fixtureVersionId}
        />
        {/* Modal de confirmación */}
        <ConfirmModal 
          isOpen={confirmState.isOpen}
          onClose={confirmState.close}
          onConfirm={confirmState.handleConfirm}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header minimalista */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-light text-white tracking-tight">Fixture</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Gestiona el sorteo por categoría
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 px-3 py-1 bg-white/5 rounded-full">
            {categorias.length} categorías
          </span>
          {!modoSeleccion ? (
            <button
              onClick={() => setModoSeleccion(true)}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Selección múltiple
            </button>
          ) : (
            <button
              onClick={limpiarSeleccion}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de categorías por género */}
      <div className="space-y-8">
        {['CABALLEROS', 'DAMAS', 'MIXTO'].map((tipo) => {
          const cats = categoriasAgrupadas[tipo];
          if (cats.length === 0) return null;

          return (
            <section key={tipo} className="space-y-3">
              {/* Título de sección */}
              <div className="flex items-center gap-3 pb-2">
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {tipo === 'CABALLEROS' ? 'Caballeros' : tipo === 'DAMAS' ? 'Damas' : 'Mixto'}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
              </div>

              {/* Grid de categorías */}
              <div className="grid gap-2">
                {cats.map((categoria, index) => {
                  const estadoInfo = getEstadoInfo(categoria.estado);
                  const faltanParaMinimo = Math.max(0, MINIMO_PARA_SORTEAR - categoria.inscripcionesCount);
                  
                  // Acciones disponibles
                  const puedeCerrar = categoria.estado === 'INSCRIPCIONES_ABIERTAS' && categoria.inscripcionesCount >= MINIMO_PARA_SORTEAR;
                  const puedeAbrir = categoria.estado === 'INSCRIPCIONES_CERRADAS' && !categoria.fixtureVersionId;
                  const yaSorteado = !!categoria.fixtureVersionId;

                  return (
                    <motion.div
                      key={categoria.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-lg p-4 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Info principal */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Checkbox en modo selección */}
                          {modoSeleccion && puedeCerrar && (
                            <button
                              onClick={() => toggleSeleccion(categoria.id)}
                              className="text-neutral-400 hover:text-white transition-colors"
                            >
                              {categoriasSeleccionadas.has(categoria.id) ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          
                          {/* Número de orden */}
                          <span className="text-xs text-neutral-600 font-mono w-6">
                            {String(categoria.category.orden).padStart(2, '0')}
                          </span>

                          {/* Nombre y estado */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              {categoria.category.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${estadoInfo.color}`}>
                                {estadoInfo.label}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {categoria.inscripcionesCount} inscritos
                              </span>
                              {faltanParaMinimo > 0 && (
                                <span className="text-xs text-amber-500/80">
                                  (faltan {faltanParaMinimo})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {puedeCerrar && (
                            <button
                              onClick={() => handleCerrarInscripciones(categoria)}
                              disabled={cerrandoInscripciones === categoria.id}
                              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Cerrar inscripciones"
                            >
                              {cerrandoInscripciones === categoria.id ? (
                                <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {puedeAbrir && (
                            <button
                              onClick={() => handleAbrirInscripciones(categoria)}
                              className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Reabrir inscripciones"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}

                          {yaSorteado && categoria.estado !== 'FINALIZADA' && (
                            <button
                              onClick={() => handleFinalizarCategoria(categoria)}
                              disabled={finalizandoCategoria === categoria.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                              {finalizandoCategoria === categoria.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                              ) : (
                                <Trophy className="w-3.5 h-3.5" />
                              )}
                              Finalizar
                            </button>
                          )}

                          {yaSorteado ? (
                            <button
                              onClick={() => setCategoriaSeleccionada(categoria)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-neutral-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">
                                {faltanParaMinimo > 0 
                                  ? `Faltan ${faltanParaMinimo}` 
                                  : 'Sortear desde Canchas y Sorteo'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="pt-4 border-t border-white/5">
        <p className="text-xs text-neutral-500">
          Mínimo {MINIMO_PARA_SORTEAR} parejas para realizar el sorteo. 
          Las categorías se ordenan automáticamente por nivel (Primera, Segunda, etc.)
        </p>
      </div>

      {/* Barra de acciones en grupo */}
      <AnimatePresence>
        {modoSeleccion && categoriasSeleccionadas.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#151921] border border-white/10 rounded-xl px-6 py-4 shadow-2xl z-50 flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium">
                {categoriasSeleccionadas.size} seleccionadas
              </span>
              <button
                onClick={seleccionarTodas}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Seleccionar todas
              </button>
              <button
                onClick={() => setCategoriasSeleccionadas(new Set())}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Limpiar
              </button>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={handleCerrarGrupo}
              disabled={cerrandoGrupo}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cerrandoGrupo ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Cerrar inscripciones
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Modal de confirmación */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
