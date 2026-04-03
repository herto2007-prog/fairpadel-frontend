// CircuitosManager - Admin Panel para gestión de circuitos
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Plus, CheckCircle, XCircle, Settings, Loader2, ExternalLink, MapPin, 
  Upload, Image as ImageIcon, X, Calendar, Users, TrendingUp, Target,
  Trash2, Save, Crown, Check, HelpCircle
} from 'lucide-react';
import { circuitosService, Circuito, TorneoCircuito, Solicitud } from '../../circuitos/circuitosService';
import { formatDatePY } from '../../../utils/date';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Modal } from '../../../components/ui/Modal';

export function CircuitosManager() {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'circuitos' | 'solicitudes' | 'nuevo'>('circuitos');
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Modal state
  const [selectedCircuito, setSelectedCircuito] = useState<Circuito | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'circuitos') {
        const res = await circuitosService.getCircuitos();
        if (res.success) setCircuitos(res.data);
      } else if (activeSubTab === 'solicitudes') {
        const res = await circuitosService.getSolicitudesPendientes();
        if (res.success) setSolicitudes(res.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarSolicitud = async (id: string, estado: 'APROBADO' | 'RECHAZADO') => {
    const confirmed = await confirm({
      title: estado === 'APROBADO' ? 'Aprobar solicitud' : 'Rechazar solicitud',
      message: `Estás seguro de ${estado === 'APROBADO' ? 'aprobar' : 'rechazar'} esta solicitud de inclusión al circuito?`,
      confirmText: estado === 'APROBADO' ? 'Aprobar' : 'Rechazar',
      cancelText: 'Cancelar',
      variant: estado === 'APROBADO' ? 'success' : 'danger',
    });
    if (!confirmed) return;
    
    setProcessing(id);
    try {
      await circuitosService.procesarSolicitud(id, {
        estado,
        puntosValidos: estado === 'APROBADO',
      });
      showSuccess(
        estado === 'APROBADO' ? 'Solicitud aprobada' : 'Solicitud rechazada',
        `La solicitud fue ${estado === 'APROBADO' ? 'aprobada' : 'rechazada'} exitosamente`
      );
      await loadData();
    } catch (error) {
      showError('Error', 'No se pudo procesar la solicitud');
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenModal = (circuito: Circuito) => {
    setSelectedCircuito(circuito);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCircuito(null);
  };

  const handleCircuitoUpdated = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('circuitos')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeSubTab === 'circuitos'
              ? 'bg-[#df2531] text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          Circuitos
        </button>
        <button
          onClick={() => setActiveSubTab('solicitudes')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'solicitudes'
              ? 'bg-[#df2531] text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          Solicitudes
          {solicitudes.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{solicitudes.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('nuevo')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'nuevo'
              ? 'bg-green-600 text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          Nuevo Circuito
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
        </div>
      ) : activeSubTab === 'circuitos' ? (
        <div className="grid gap-4">
          {circuitos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay circuitos creados</p>
          ) : (
            circuitos.map((circuito) => (
              <motion.div
                key={circuito.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151921] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  {circuito.logoUrl ? (
                    <img 
                      src={circuito.logoUrl} 
                      alt={circuito.nombre}
                      className="w-16 h-16 rounded-lg object-cover bg-white/5"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{circuito.nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {circuito.ciudad}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 rounded">
                        Temp. {circuito.temporada || '2026'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        circuito.estado === 'ACTIVO' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {circuito.estado}
                      </span>
                      <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] rounded">
                        {circuito._count?.torneos || 0} torneos
                      </span>
                      {circuito.tieneFinal && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                          Con Final
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/circuitos/${circuito.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Ver página pública"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button 
                      onClick={() => handleOpenModal(circuito)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Gestionar circuito"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : activeSubTab === 'solicitudes' ? (
        <div className="grid gap-4">
          {solicitudes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay solicitudes pendientes</p>
          ) : (
            solicitudes.map((sol) => (
              <motion.div
                key={sol.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151921] border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-[#df2531]" />
                      <h3 className="font-bold text-white">{sol.torneo.nombre}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Quiere unirse a: <span className="text-white">{sol.circuito.nombre}</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Organizador: {sol.torneo.organizador.apellido}, {sol.torneo.organizador.nombre}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {sol.torneo.ciudad} • {formatDatePY(sol.torneo.fechaInicio)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcesarSolicitud(sol.id, 'APROBADO')}
                      disabled={processing === sol.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                    >
                      {processing === sol.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleProcesarSolicitud(sol.id, 'RECHAZADO')}
                      disabled={processing === sol.id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <NuevoCircuitoForm onSuccess={() => { setActiveSubTab('circuitos'); loadData(); }} />
      )}
      
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

      {/* Circuito Edit Modal */}
      <CircuitoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        circuito={selectedCircuito}
        onUpdated={handleCircuitoUpdated}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL DE GESTIÓN DE CIRCUITO
// ═══════════════════════════════════════════════════════════

interface CircuitoModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuito: Circuito | null;
  onUpdated: () => void;
}

type ModalTab = 'general' | 'torneos' | 'ranking' | 'final';

function CircuitoModal({ isOpen, onClose, circuito, onUpdated }: CircuitoModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('general');

  if (!circuito) return null;

  const tabs = [
    { id: 'general' as ModalTab, label: 'General', icon: Settings },
    { id: 'torneos' as ModalTab, label: 'Torneos', icon: Trophy },
    { id: 'ranking' as ModalTab, label: 'Ranking', icon: TrendingUp },
    { id: 'final' as ModalTab, label: 'Final', icon: Target },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {circuito.logoUrl ? (
              <img src={circuito.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{circuito.nombre}</h2>
              <p className="text-gray-400 text-sm">{circuito.ciudad} • Temp. {circuito.temporada}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-[#df2531] border-b-2 border-[#df2531] bg-[#df2531]/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && (
                <GeneralTab circuito={circuito} onUpdated={onUpdated} />
              )}
              {activeTab === 'torneos' && (
                <TorneosTab circuito={circuito} onUpdated={onUpdated} />
              )}
              {activeTab === 'ranking' && (
                <RankingTab circuito={circuito} onUpdated={onUpdated} />
              )}
              {activeTab === 'final' && (
                <FinalTab circuito={circuito} onUpdated={onUpdated} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: GENERAL
// ═══════════════════════════════════════════════════════════

function GeneralTab({ circuito, onUpdated }: { circuito: Circuito; onUpdated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: circuito.nombre,
    descripcion: circuito.descripcion || '',
    ciudad: circuito.ciudad,
    temporada: circuito.temporada,
    fechaInicio: circuito.fechaInicio || '',
    fechaFin: circuito.fechaFin || '',
    estado: circuito.estado as 'ACTIVO' | 'INACTIVO' | 'FINALIZADO',
    colorPrimario: circuito.colorPrimario || '#df2531',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Limpiar fechas vacías para enviar undefined en lugar de string vacío
      const dataToSend = {
        ...formData,
        fechaInicio: formData.fechaInicio || undefined,
        fechaFin: formData.fechaFin || undefined,
      };
      await circuitosService.updateCircuito(circuito.id, dataToSend);
      showSuccess('Guardado', 'Circuito actualizado correctamente');
      onUpdated();
    } catch (error) {
      showError('Error', 'No se pudo actualizar el circuito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Nombre *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Ciudad *</label>
          <select
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          >
            <option value="Asunción">Asunción</option>
            <option value="Ciudad del Este">Ciudad del Este</option>
            <option value="San Lorenzo">San Lorenzo</option>
            <option value="Luque">Luque</option>
            <option value="Capiatá">Capiatá</option>
            <option value="Lambaré">Lambaré</option>
            <option value="Fernando de la Mora">Fernando de la Mora</option>
            <option value="Limpio">Limpio</option>
            <option value="Ñemby">Ñemby</option>
            <option value="Itauguá">Itauguá</option>
            <option value="Mariano Roque Alonso">Mariano Roque Alonso</option>
            <option value="Pedro Juan Caballero">Pedro Juan Caballero</option>
            <option value="Encarnación">Encarnación</option>
            <option value="Villa Elisa">Villa Elisa</option>
            <option value="San Antonio">San Antonio</option>
            <option value="Coronel Oviedo">Coronel Oviedo</option>
            <option value="Concepción">Concepción</option>
            <option value="Villarrica">Villarrica</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Temporada</label>
          <input
            type="text"
            value={formData.temporada}
            onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Fecha Fin</label>
          <input
            type="date"
            value={formData.fechaFin}
            onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Estado</label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'ACTIVO' | 'INACTIVO' | 'FINALIZADO' })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Color Principal</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.colorPrimario}
              onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer bg-transparent"
            />
            <span className="text-gray-400 text-sm">{formData.colorPrimario}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar Cambios
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: TORNEOS
// ═══════════════════════════════════════════════════════════

function TorneosTab({ circuito, onUpdated }: { circuito: Circuito; onUpdated: () => void }) {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const [torneosAsignados, setTorneosAsignados] = useState<TorneoCircuito[]>([]);
  const [torneosDisponibles, setTorneosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [asignando, setAsignando] = useState(false);
  const [showDisponibles, setShowDisponibles] = useState(false);

  useEffect(() => {
    loadTorneos();
  }, [circuito.id]);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      const [asignadosRes, disponiblesRes] = await Promise.all([
        circuitosService.getTorneosDeCircuito(circuito.id),
        circuitosService.getTorneosDisponibles(circuito.id),
      ]);
      if (asignadosRes.success) setTorneosAsignados(asignadosRes.data);
      if (disponiblesRes.success) setTorneosDisponibles(disponiblesRes.data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (torneoId: string) => {
    setAsignando(true);
    try {
      await circuitosService.asignarTorneoDirecto({
        circuitoId: circuito.id,
        torneoId,
        puntosValidos: true,
      });
      showSuccess('Asignado', 'Torneo asignado al circuito');
      await loadTorneos();
      onUpdated();
    } catch (error) {
      showError('Error', 'No se pudo asignar el torneo');
    } finally {
      setAsignando(false);
    }
  };

  const handleEliminar = async (torneoId: string, torneoNombre: string) => {
    const confirmed = await confirm({
      title: 'Eliminar torneo del circuito',
      message: `Estás seguro de eliminar "${torneoNombre}" del circuito?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await circuitosService.eliminarTorneoDeCircuito(circuito.id, torneoId);
      showSuccess('Eliminado', 'Torneo eliminado del circuito');
      await loadTorneos();
      onUpdated();
    } catch (error) {
      showError('Error', 'No se pudo eliminar el torneo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Torneos Asignados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#df2531]" />
            Torneos en el Circuito ({torneosAsignados.length})
          </h3>
          <button
            onClick={() => setShowDisponibles(!showDisponibles)}
            className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Torneo
          </button>
        </div>

        {torneosAsignados.length === 0 ? (
          <div className="text-center py-8 bg-[#151921] rounded-xl border border-white/5">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay torneos asignados aún</p>
            <p className="text-gray-500 text-sm">Agrega torneos para formar el circuito</p>
          </div>
        ) : (
          <div className="space-y-2">
            {torneosAsignados.map((tc, index) => (
              <div
                key={tc.id}
                className="flex items-center gap-4 p-4 bg-[#151921] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-[#df2531]/20 text-[#df2531] rounded-lg font-bold text-sm">
                  {tc.orden || index + 1}
                </div>
                
                {tc.torneo.flyerUrl ? (
                  <img 
                    src={tc.torneo.flyerUrl} 
                    alt="" 
                    className="w-16 h-16 rounded-lg object-cover bg-white/5"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-gray-600" />
                  </div>
                )}

                <div className="flex-1">
                  <h4 className="font-medium text-white">{tc.torneo.nombre}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDatePY(tc.torneo.fechaInicio)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {tc.torneo.ciudad}
                    </span>
                    {tc.esFinal && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                        Final
                      </span>
                    )}
                    {!tc.puntosValidos && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs">
                        Sin puntos
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/torneos/${tc.torneo.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleEliminar(tc.torneo.id, tc.torneo.nombre)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Torneos Disponibles */}
      <AnimatePresence>
        {showDisponibles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 pt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Torneos Disponibles</h3>
              <button
                onClick={() => setShowDisponibles(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {torneosDisponibles.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay torneos disponibles para agregar</p>
            ) : (
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {torneosDisponibles.map((torneo) => (
                  <div
                    key={torneo.id}
                    className="flex items-center gap-4 p-3 bg-[#0B0E14] rounded-lg border border-white/5"
                  >
                    {torneo.flyerUrl ? (
                      <img 
                        src={torneo.flyerUrl} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover bg-white/5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-gray-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{torneo.nombre}</h4>
                      <p className="text-sm text-gray-400">
                        {formatDatePY(torneo.fechaInicio)} • {torneo.ciudad}
                      </p>
                      <p className="text-xs text-gray-500">
                        Org: {torneo.organizador.apellido}, {torneo.organizador.nombre}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAsignar(torneo.id)}
                      disabled={asignando}
                      className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {asignando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: RANKING
// ═══════════════════════════════════════════════════════════

function RankingTab({ circuito, onUpdated }: { circuito: Circuito; onUpdated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tipoAcumulacion: circuito.tipoAcumulacion || 'ACUMULATIVO',
    torneosMinimosContar: circuito.torneosMinimosContar || 0,
    torneosParaClasificar: circuito.torneosParaClasificar || 1,
    multiplicadorGlobal: circuito.multiplicadorGlobal || 1.0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await circuitosService.updateCircuito(circuito.id, formData);
      showSuccess('Guardado', 'Configuración de ranking actualizada');
      onUpdated();
    } catch (error) {
      showError('Error', 'No se pudo actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-[#151921] rounded-xl p-4 border border-white/5">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#df2531]" />
          Configuración de Puntos
        </h4>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Tipo de Acumulación</label>
            <select
              value={formData.tipoAcumulacion}
              onChange={(e) => setFormData({ ...formData, tipoAcumulacion: e.target.value })}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="ACUMULATIVO">Acumulativo (todos los torneos cuentan)</option>
              <option value="MEJORES_N">Mejores N torneos</option>
            </select>
          </div>

          {formData.tipoAcumulacion === 'MEJORES_N' && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">Cantidad de mejores torneos a contar</label>
              <input
                type="number"
                value={formData.torneosMinimosContar}
                onChange={(e) => setFormData({ ...formData, torneosMinimosContar: parseInt(e.target.value) })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
                min={1}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 block mb-1">Multiplicador Global de Puntos</label>
            <input
              type="number"
              step="0.1"
              value={formData.multiplicadorGlobal}
              onChange={(e) => setFormData({ ...formData, multiplicadorGlobal: parseFloat(e.target.value) })}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Multiplica todos los puntos del circuito (ej: 1.5 = 50% más puntos)</p>
          </div>
        </div>
      </div>

      <div className="bg-[#151921] rounded-xl p-4 border border-white/5">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#df2531]" />
          Requisitos para Clasificar a la Final
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Torneos mínimos jugados</label>
            <input
              type="number"
              value={formData.torneosParaClasificar}
              onChange={(e) => setFormData({ ...formData, torneosParaClasificar: parseInt(e.target.value) })}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
              min={1}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar Configuración
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: FINAL
// ═══════════════════════════════════════════════════════════

interface Clasificado {
  id: string;
  jugadorId: string;
  categoryId: string;
  puntosAcumulados: number;
  torneosJugados: number;
  posicionClasificacion: number;
  asistenciaConfirmada: boolean | null; // null = sin confirmar, true/false = viene/no viene
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    telefono?: string;
    email?: string;
    categoriaActual?: { nombre: string };
  };
  category: {
    id: string;
    nombre: string;
    tipo: string;
  };
}

interface Category {
  id: string;
  nombre: string;
  tipo: string;
}

function FinalTab({ circuito, onUpdated }: { circuito: Circuito; onUpdated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [asignandoFinal, setAsignandoFinal] = useState(false);
  const [clasificados, setClasificados] = useState<Clasificado[]>([]);
  const [torneosCircuito, setTorneosCircuito] = useState<TorneoCircuito[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [loadingClasificados, setLoadingClasificados] = useState(false);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [formData, setFormData] = useState({
    tieneFinal: circuito.tieneFinal || false,
    torneosParaClasificar: circuito.torneosParaClasificar || 8,
  });

  // Cargar categorías al montar
  useEffect(() => {
    loadCategorias();
  }, []);

  // Cargar clasificados y torneos si tiene final
  useEffect(() => {
    if (formData.tieneFinal) {
      loadClasificados();
      loadTorneosCircuito();
    }
  }, [circuito.id, formData.tieneFinal]);

  const loadCategorias = async () => {
    try {
      const res = await circuitosService.getCategorias();
      if (res.success) {
        setCategorias(res.data);
        if (res.data.length > 0) {
          setCategoriaSeleccionada(res.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadClasificados = async () => {
    setLoadingClasificados(true);
    try {
      const res = await circuitosService.getClasificados(circuito.id);
      if (res.success) setClasificados(res.data);
    } catch (error) {
      console.error('Error cargando clasificados:', error);
    } finally {
      setLoadingClasificados(false);
    }
  };

  const loadTorneosCircuito = async () => {
    setLoadingTorneos(true);
    try {
      const res = await circuitosService.getTorneosDeCircuito(circuito.id);
      if (res.success) setTorneosCircuito(res.data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoadingTorneos(false);
    }
  };

  const handleAsignarTorneoFinal = async (torneoId: string) => {
    setAsignandoFinal(true);
    try {
      await circuitosService.asignarTorneoFinal(circuito.id, torneoId);
      showSuccess('Asignado', 'Torneo final asignado correctamente');
      onUpdated();
      await loadTorneosCircuito();
    } catch (error) {
      showError('Error', 'No se pudo asignar el torneo final');
    } finally {
      setAsignandoFinal(false);
    }
  };

  const handleQuitarTorneoFinal = async () => {
    if (!confirm('¿Quitar el torneo final asignado?')) return;
    setAsignandoFinal(true);
    try {
      await circuitosService.quitarTorneoFinal(circuito.id);
      showSuccess('Desasignado', 'Torneo final quitado correctamente');
      onUpdated();
      await loadTorneosCircuito();
    } catch (error) {
      showError('Error', 'No se pudo quitar el torneo final');
    } finally {
      setAsignandoFinal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await circuitosService.updateCircuito(circuito.id, formData);
      showSuccess('Guardado', 'Configuración de final actualizada');
      onUpdated();
    } catch (error) {
      showError('Error', 'No se pudo actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleCalcularClasificados = async () => {
    if (!categoriaSeleccionada) {
      showError('Error', 'Selecciona una categoría primero');
      return;
    }
    setCalculando(true);
    try {
      await circuitosService.calcularClasificados(circuito.id, categoriaSeleccionada);
      showSuccess('Calculado', 'Clasificados actualizados');
      await loadClasificados();
    } catch (error) {
      showError('Error', 'No se pudo calcular los clasificados');
    } finally {
      setCalculando(false);
    }
  };

  const confirmados = clasificados.filter(c => c.asistenciaConfirmada === true).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Configuración del Master Final */}
      <form onSubmit={handleSubmit} className="bg-[#151921] rounded-xl p-4 border border-white/5">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#df2531]" />
          Configuración del Master Final
        </h4>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tieneFinal"
              checked={formData.tieneFinal}
              onChange={(e) => setFormData({ ...formData, tieneFinal: e.target.checked })}
              className="w-5 h-5 rounded border-white/10 bg-[#0B0E14] text-[#df2531] focus:ring-[#df2531]"
            />
            <label htmlFor="tieneFinal" className="text-white">
              Este circuito tiene Master Final
            </label>
          </div>

          {formData.tieneFinal && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">Cantidad de jugadores que clasifican</label>
              <input
                type="number"
                value={formData.torneosParaClasificar}
                onChange={(e) => setFormData({ ...formData, torneosParaClasificar: parseInt(e.target.value) })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
                min={1}
                max={32}
              />
              <p className="text-xs text-gray-500 mt-1">Los mejores N del ranking clasifican al torneo final</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex items-center gap-2 px-6 py-2 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </form>

      {/* Torneo Final Asignado */}
      {formData.tieneFinal && (
        <div className="bg-[#151921] rounded-xl p-4 border border-white/5">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Torneo Final del Circuito
          </h4>

          {loadingTorneos ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#df2531]" />
            </div>
          ) : torneosCircuito.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No hay torneos en el circuito</p>
              <p className="text-gray-500 text-xs">Agrega torneos primero en la pestaña "Torneos"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Torneo final actual */}
              {circuito.torneoFinalId && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-yellow-400 text-sm font-medium">Torneo Final Asignado:</p>
                    <button
                      onClick={handleQuitarTorneoFinal}
                      disabled={asignandoFinal}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Quitar
                    </button>
                  </div>
                  {(() => {
                    const torneoFinal = torneosCircuito.find(tc => tc.torneo.id === circuito.torneoFinalId);
                    return torneoFinal ? (
                      <div className="flex items-center gap-3">
                        {torneoFinal.torneo.flyerUrl ? (
                          <img src={torneoFinal.torneo.flyerUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{torneoFinal.torneo.nombre}</p>
                          <p className="text-gray-400 text-sm">{formatDatePY(torneoFinal.torneo.fechaInicio)} • {torneoFinal.torneo.ciudad}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Torneo no encontrado en el circuito</p>
                    );
                  })()}
                </div>
              )}

              {/* Selector de torneo final */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  {circuito.torneoFinalId ? 'Cambiar torneo final:' : 'Seleccionar torneo final:'}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {torneosCircuito.map((tc) => (
                    <button
                      key={tc.torneo.id}
                      onClick={() => handleAsignarTorneoFinal(tc.torneo.id)}
                      disabled={asignandoFinal || circuito.torneoFinalId === tc.torneo.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        circuito.torneoFinalId === tc.torneo.id
                          ? 'bg-yellow-500/10 border-yellow-500/30 cursor-default'
                          : 'bg-[#0B0E14] border-white/5 hover:border-white/20'
                      }`}
                    >
                      {tc.torneo.flyerUrl ? (
                        <img src={tc.torneo.flyerUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{tc.torneo.nombre}</p>
                        <p className="text-gray-400 text-sm">{formatDatePY(tc.torneo.fechaInicio)}</p>
                      </div>
                      {circuito.torneoFinalId === tc.torneo.id ? (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                          ACTUAL
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-[#df2531]/20 text-[#df2531] rounded text-xs font-medium">
                          Seleccionar
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listado de Clasificados */}
      {formData.tieneFinal && (
        <div className="bg-[#151921] rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Clasificados al Master Final
              </h4>
              <p className="text-gray-400 text-sm mt-1">
                {confirmados} de {clasificados.length} confirmados
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Selector de Categoría */}
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre} ({cat.tipo === 'FEMENINO' ? 'F' : 'M'})
                  </option>
                ))}
              </select>
              <button
                onClick={handleCalcularClasificados}
                disabled={calculando || !categoriaSeleccionada}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {calculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Recalcular
              </button>
            </div>
          </div>

          {loadingClasificados ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
            </div>
          ) : clasificados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay clasificados aún</p>
              <p className="text-gray-500 text-sm">Haz clic en "Recalcular" para generar la lista</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clasificados.map((clasificado) => (
                <div
                  key={clasificado.id}
                  className="flex items-center gap-4 p-3 bg-[#0B0E14] rounded-lg border border-white/5"
                >
                  {/* Posición */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                    clasificado.posicionClasificacion === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    clasificado.posicionClasificacion === 2 ? 'bg-gray-400/20 text-gray-300' :
                    clasificado.posicionClasificacion === 3 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-[#df2531]/20 text-[#df2531]'
                  }`}>
                    {clasificado.posicionClasificacion}
                  </div>

                  {/* Avatar */}
                  {clasificado.jugador.fotoUrl ? (
                    <img
                      src={clasificado.jugador.fotoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-white/5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h5 className="font-medium text-white">
                      {clasificado.jugador.apellido}, {clasificado.jugador.nombre}
                    </h5>
                    <p className="text-sm text-gray-400">
                      {clasificado.puntosAcumulados} pts • {clasificado.torneosJugados} torneos
                    </p>
                  </div>

                  {/* Asistencia */}
                  <div className="flex items-center gap-2">
                    {clasificado.asistenciaConfirmada === true ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        <Check className="w-4 h-4" />
                        Asiste
                      </span>
                    ) : clasificado.asistenciaConfirmada === false ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                        <X className="w-4 h-4" />
                        No asiste
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                        <HelpCircle className="w-4 h-4" />
                        Sin confirmar
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FORMULARIO NUEVO CIRCUITO
// ═══════════════════════════════════════════════════════════

function NuevoCircuitoForm({ onSuccess }: { onSuccess: () => void }) {
  const { showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ciudad: 'Asunción',
    temporada: new Date().getFullYear().toString(),
    colorPrimario: '#df2531',
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await circuitosService.uploadLogo(file);
      if (res.success && res.data?.url) {
        setLogoUrl(res.data.url);
      }
    } catch (error) {
      showError('Error', 'No se pudo subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await circuitosService.createCircuito({
        ...formData,
        logoUrl: logoUrl || undefined,
      });
      onSuccess();
    } catch (error) {
      showError('Error', 'No se pudo crear el circuito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#151921] border border-white/5 rounded-xl p-6 space-y-4 max-w-2xl">
      <h3 className="font-bold text-white text-lg">Crear Nuevo Circuito</h3>
      
      {/* Logo Upload */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">Logo del Circuito</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo preview" 
              className="w-20 h-20 rounded-lg object-cover bg-white/5"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Nombre del Circuito *</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          placeholder="Ej: Circuito Metropolitano"
          required
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          rows={3}
          placeholder="Descripción del circuito..."
        />
      </div>

      {/* Ciudad y Temporada */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Ciudad *</label>
          <select
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          >
            <option value="Asunción">Asunción</option>
            <option value="Ciudad del Este">Ciudad del Este</option>
            <option value="San Lorenzo">San Lorenzo</option>
            <option value="Luque">Luque</option>
            <option value="Capiatá">Capiatá</option>
            <option value="Lambaré">Lambaré</option>
            <option value="Fernando de la Mora">Fernando de la Mora</option>
            <option value="Limpio">Limpio</option>
            <option value="Ñemby">Ñemby</option>
            <option value="Itauguá">Itauguá</option>
            <option value="Mariano Roque Alonso">Mariano Roque Alonso</option>
            <option value="Pedro Juan Caballero">Pedro Juan Caballero</option>
            <option value="Encarnación">Encarnación</option>
            <option value="Villa Elisa">Villa Elisa</option>
            <option value="San Antonio">San Antonio</option>
            <option value="Coronel Oviedo">Coronel Oviedo</option>
            <option value="Concepción">Concepción</option>
            <option value="Villarrica">Villarrica</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Temporada *</label>
          <input
            type="number"
            value={formData.temporada}
            onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            min={2024}
            max={2030}
            required
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Color Principal</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={formData.colorPrimario}
            onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer bg-transparent"
          />
          <span className="text-gray-400 text-sm">{formData.colorPrimario}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-400">
        <p>• Los circuitos son por temporada anual (2026, 2027...)</p>
        <p>• Al finalizar la temporada se resetean los puntos</p>
        <p>• El Master Final se configura como un torneo más del circuito</p>
      </div>

      <button
        type="submit"
        disabled={saving || uploadingLogo}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {saving ? 'Creando...' : 'Crear Circuito'}
      </button>
    </form>
  );
}
