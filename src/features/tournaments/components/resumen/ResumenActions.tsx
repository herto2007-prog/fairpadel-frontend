import { useState } from 'react';
import { Button } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import type { Tournament, TournamentCategory } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Send,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

interface ResumenActionsProps {
  tournament: Tournament;
  stats: TournamentStats | null;
  onRefresh: () => Promise<void>;
}

export function ResumenStatusBanners({ tournament, stats, onRefresh }: ResumenActionsProps) {
  const [showFinalizarTorneo, setShowFinalizarTorneo] = useState(false);
  const [finalizingTorneo, setFinalizingTorneo] = useState(false);

  const categoriasFinalizadas = stats?.categorias?.filter((tc) => tc.estado === 'FINALIZADA').length || 0;
  const totalCategorias = stats?.categorias?.length || 0;
  const todasFinalizadas = totalCategorias > 0 && categoriasFinalizadas === totalCategorias;
  const puedeFinalizarTorneo = todasFinalizadas && tournament.estado === 'EN_CURSO';

  const handleFinalizarTorneo = async () => {
    setFinalizingTorneo(true);
    try {
      await tournamentsService.finalizarTorneo(tournament.id);
      toast.success('Torneo finalizado exitosamente');
      setShowFinalizarTorneo(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al finalizar torneo');
    } finally {
      setFinalizingTorneo(false);
    }
  };

  return (
    <>
      {/* Banner de finalización */}
      {puedeFinalizarTorneo && (
        <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-bold text-green-400">Todas las categorias estan finalizadas</p>
              <p className="text-sm text-green-400/70">Puedes finalizar el torneo para cerrar el ciclo y consolidar resultados.</p>
            </div>
          </div>
          <Button
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowFinalizarTorneo(true)}
          >
            <Trophy className="w-4 h-4 mr-2" /> Finalizar Torneo
          </Button>
        </div>
      )}

      {/* Progreso de categorias */}
      {tournament.estado === 'EN_CURSO' && totalCategorias > 0 && !todasFinalizadas && (
        <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-400">Progreso de Finalizacion</p>
            <p className="text-sm text-blue-400">{categoriasFinalizadas} / {totalCategorias} categorias</p>
          </div>
          <div className="w-full bg-dark-surface rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(categoriasFinalizadas / totalCategorias) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Modal confirmar finalizar torneo */}
      {showFinalizarTorneo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFinalizarTorneo(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Finalizar Torneo
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                Estas seguro de que deseas finalizar <strong>{tournament.nombre}</strong>?
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {totalCategorias} categorias finalizadas
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Rankings y puntos registrados
                </div>
              </div>
              <div className="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg mb-4">
                <p className="text-sm text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  El torneo pasara a estado FINALIZADO y no podra editarse.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowFinalizarTorneo(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleFinalizarTorneo}
                  loading={finalizingTorneo}
                >
                  <Trophy className="w-4 h-4 mr-1" /> Finalizar Torneo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ResumenActionBanners({ tournament, onRefresh }: ResumenActionsProps) {
  const [showCancelarTorneo, setShowCancelarTorneo] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancellingTorneo, setCancellingTorneo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublicarModal, setShowPublicarModal] = useState(false);

  const puedePublicar = ['BORRADOR', 'RECHAZADO'].includes(tournament.estado);

  const handlePublicarTorneo = async () => {
    setPublishing(true);
    try {
      await tournamentsService.publish(tournament.id);
      toast.success('Torneo enviado a aprobacion exitosamente');
      setShowPublicarModal(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al publicar torneo');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      {/* Publicar Torneo */}
      {puedePublicar && (
        <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary-400">
                {tournament.estado === 'RECHAZADO' ? 'Re-enviar a Aprobacion' : 'Publicar Torneo'}
              </p>
              <p className="text-xs text-primary-400/70">
                {tournament.estado === 'RECHAZADO'
                  ? 'Si ya corregiste las observaciones, puedes re-enviar el torneo para aprobacion.'
                  : 'Terminaste de configurar el torneo? Envialo a aprobacion para que sea publicado.'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowPublicarModal(true)}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4 mr-2" />
            {tournament.estado === 'RECHAZADO' ? 'Re-enviar' : 'Publicar Torneo'}
          </Button>
        </div>
      )}

      {/* Cancelar Torneo */}
      {['BORRADOR', 'PENDIENTE_APROBACION', 'PUBLICADO', 'RECHAZADO'].includes(tournament.estado) && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Cancelar Torneo</p>
              <p className="text-xs text-red-400/70">Esta accion cancelara el torneo y todas las inscripciones activas.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-900/30 flex-shrink-0"
            onClick={() => setShowCancelarTorneo(true)}
          >
            Cancelar Torneo
          </Button>
        </div>
      )}

      {/* Modal confirmar cancelar torneo */}
      {showCancelarTorneo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelarTorneo(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Cancelar Torneo
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                Estas seguro de que deseas cancelar <strong>{tournament.nombre}</strong>?
              </p>
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg mb-4">
                <p className="text-sm text-red-400">
                  Esta accion cancelara el torneo y todas las inscripciones activas. No se puede deshacer.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-light-text mb-1">
                  Motivo de cancelacion <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  rows={3}
                  placeholder="Ingresa el motivo de la cancelacion..."
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCancelarTorneo(false); setCancelMotivo(''); }}>
                  Volver
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    if (!cancelMotivo.trim()) {
                      toast.error('Debes ingresar un motivo de cancelacion');
                      return;
                    }
                    setCancellingTorneo(true);
                    try {
                      const result = await tournamentsService.cancelarTorneo(tournament.id, cancelMotivo);
                      toast.success(`Torneo cancelado. ${result.inscripcionesCanceladas} inscripciones canceladas.`);
                      setShowCancelarTorneo(false);
                      setCancelMotivo('');
                      await onRefresh();
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Error al cancelar torneo');
                    } finally {
                      setCancellingTorneo(false);
                    }
                  }}
                  loading={cancellingTorneo}
                  disabled={!cancelMotivo.trim()}
                >
                  Confirmar Cancelacion
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar publicar torneo */}
      {showPublicarModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPublicarModal(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-400" />
                {tournament.estado === 'RECHAZADO' ? 'Re-enviar a Aprobacion' : 'Publicar Torneo'}
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                Estas seguro de que deseas enviar <strong>{tournament.nombre}</strong> para aprobacion?
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-light-secondary">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Un administrador revisara el torneo
                </div>
                <div className="flex items-center gap-2 text-sm text-light-secondary">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Una vez aprobado, sera visible para todos los jugadores
                </div>
              </div>
              <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg mb-4">
                <p className="text-sm text-blue-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  Asegurate de haber configurado categorias, fechas y sede antes de publicar.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPublicarModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handlePublicarTorneo}
                  loading={publishing}
                >
                  <Send className="w-4 h-4 mr-1" /> Enviar a Aprobacion
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
