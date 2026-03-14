import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, Loader2, ArrowUp, Calendar } from 'lucide-react';
import { rankingsService } from '../../rankings/rankingsService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';

interface Ascenso {
  id: string;
  estado: string;
  puntosAcumulados: number;
  torneosJugados: number;
  posicionClasificacion: number;
  fechaCalculo: string;
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
  };
  categoriaActual: {
    id: string;
    nombre: string;
  };
  categoriaNueva: {
    id: string;
    nombre: string;
  };
  torneosGanadosIds: string[];
}

export function AscensosManager() {
  const { showSuccess, showError, showInfo } = useToast();
  const { confirm } = useConfirm();
  const [ascensos, setAscensos] = useState<Ascenso[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO'>('PENDIENTE');

  useEffect(() => {
    loadAscensos();
  }, [filtro]);

  const loadAscensos = async () => {
    setLoading(true);
    try {
      const res = await rankingsService.getAscensosPendientes();
      if (res.success) {
        const filtrados = filtro === 'TODOS' 
          ? res.data 
          : res.data.filter((a: Ascenso) => a.estado === filtro);
        setAscensos(filtrados);
      }
    } catch (error) {
      console.error('Error cargando ascensos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesar = async (id: string, estado: 'CONFIRMADO' | 'RECHAZADO') => {
    const confirmed = await confirm({
      title: estado === 'CONFIRMADO' ? 'Confirmar ascenso' : 'Rechazar ascenso',
      message: `¿Estás seguro de ${estado === 'CONFIRMADO' ? 'confirmar' : 'rechazar'} este ascenso de categoría?`,
      confirmText: estado === 'CONFIRMADO' ? 'Confirmar' : 'Rechazar',
      cancelText: 'Cancelar',
      variant: estado === 'CONFIRMADO' ? 'success' : 'danger',
    });
    if (!confirmed) return;
    
    setProcessing(id);
    try {
      await rankingsService.procesarAscenso(id, estado);
      showSuccess(
        estado === 'CONFIRMADO' ? 'Ascenso confirmado' : 'Ascenso rechazado',
        `El ascenso fue ${estado === 'CONFIRMADO' ? 'confirmado' : 'rechazado'} exitosamente`
      );
      await loadAscensos();
    } catch (error) {
      showError('Error', 'No se pudo procesar el ascenso');
    } finally {
      setProcessing(null);
    }
  };

  const calcularAscensos = async () => {
    const confirmed = await confirm({
      title: 'Calcular ascensos',
      message: '¿Calcular ascensos automáticamente? Se revisarán todos los jugadores del sistema.',
      confirmText: 'Calcular',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const res = await rankingsService.calcularAscensos();
      showInfo('Cálculo completado', res.message);
      await loadAscensos();
    } catch (error) {
      showError('Error', 'No se pudieron calcular los ascensos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'TODOS'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === f
                  ? 'bg-[#df2531] text-white'
                  : 'bg-[#151921] text-gray-400 hover:text-white'
              }`}
            >
              {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={calcularAscensos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#df2531] text-white rounded-lg hover:bg-[#df2531]/90 transition-colors disabled:opacity-50"
        >
          <Trophy className="w-4 h-4" />
          Calcular Ascensos
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
        </div>
      ) : ascensos.length === 0 ? (
        <div className="text-center py-12 bg-[#151921] border border-white/5 rounded-xl">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {filtro === 'PENDIENTE' 
              ? 'No hay ascensos pendientes de aprobación'
              : 'No hay ascensos en este estado'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ascensos.map((ascenso) => (
            <motion.div
              key={ascenso.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#151921] border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Foto */}
                  {ascenso.jugador.fotoUrl ? (
                    <img
                      src={ascenso.jugador.fotoUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-medium text-gray-400">
                      {ascenso.jugador.apellido[0]}{ascenso.jugador.nombre[0]}
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <h3 className="font-bold text-white">
                      {ascenso.jugador.apellido}, {ascenso.jugador.nombre}
                    </h3>
                    
                    {/* Ascenso */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/5 rounded text-gray-300 text-sm">
                        {ascenso.categoriaActual.nombre}
                      </span>
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm font-medium">
                        {ascenso.categoriaNueva.nombre}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-3">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {ascenso.torneosGanadosIds.length} campeonatos
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ascenso.fechaCalculo).toLocaleDateString('es-PY')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {ascenso.estado === 'PENDIENTE' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcesar(ascenso.id, 'CONFIRMADO')}
                      disabled={processing === ascenso.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                    >
                      {processing === ascenso.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleProcesar(ascenso.id, 'RECHAZADO')}
                      disabled={processing === ascenso.id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}

                {ascenso.estado === 'CONFIRMADO' && (
                  <span className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    Confirmado
                  </span>
                )}

                {ascenso.estado === 'RECHAZADO' && (
                  <span className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg">
                    <XCircle className="w-4 h-4" />
                    Rechazado
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
