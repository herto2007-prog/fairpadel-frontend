import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Plus, Eye, Lock, CheckCircle2, 
  AlertTriangle, DollarSign, Calendar, MapPin,
  ChevronRight, Users
} from 'lucide-react';
import { api } from '../../../services/api';
import { ChecklistCuaderno } from './checklist/ChecklistCuaderno';
import { ComisionTorneo } from './ComisionTorneo';
import { formatCurrency } from '../../../utils/currency';
import { formatDatePY } from '../../../utils/date';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface Torneo {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  estado: string;
  costoInscripcion: number;
  _count: {
    inscripciones: number;
  };
  comision?: {
    estado: string;
    montoEstimado: number;
    montoPagado: number;
    bloqueoActivo: boolean;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function TorneosManager() {
  const [view, setView] = useState<'lista' | 'crear' | 'detalle'>('lista');
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [selectedTorneo, setSelectedTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view === 'lista') {
      loadTorneos();
    }
  }, [view]);

  const loadTorneos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/torneos');
      setTorneos(data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (torneo: Torneo) => {
    setSelectedTorneo(torneo);
    setView('detalle');
  };

  const handleCrearNuevo = () => {
    setSelectedTorneo(null);
    setView('crear');
  };

  const handleVolver = () => {
    setView('lista');
    setSelectedTorneo(null);
    loadTorneos();
  };

  // ═══════════════════════════════════════════════════════════
  // VISTA: LISTA DE TORNEOS
  // ═══════════════════════════════════════════════════════════
  if (view === 'lista') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Torneos</h2>
            <p className="text-gray-400">Gestiona tus torneos y su configuración</p>
          </div>
          <button
            onClick={handleCrearNuevo}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Crear Torneo
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        ) : torneos.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes torneos</h3>
            <p className="text-gray-400 mb-6">Crea tu primer torneo y empieza a organizar</p>
            <button
              onClick={handleCrearNuevo}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
            >
              Crear Primer Torneo
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {torneos.map((torneo) => (
              <motion.div
                key={torneo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-2xl p-6 border transition-colors ${
                  torneo.comision?.bloqueoActivo 
                    ? 'border-red-500/30 bg-red-500/5' 
                    : 'border-[#232838] hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{torneo.nombre}</h3>
                      {torneo.comision?.bloqueoActivo && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          <Lock className="w-3 h-3" />
                          Bloqueado
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDatePY(torneo.fechaInicio)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {torneo.ciudad}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {torneo._count.inscripciones} inscripciones
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(torneo.costoInscripcion)}
                      </span>
                    </div>
                  </div>

                  {/* Estado de comisión */}
                  {torneo.comision && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Comisión</p>
                        <p className={`text-sm font-medium ${
                          torneo.comision.estado === 'PAGADO' 
                            ? 'text-emerald-400' 
                            : torneo.comision.estado === 'PENDIENTE_VERIFICACION'
                            ? 'text-amber-400'
                            : 'text-gray-400'
                        }`}>
                          {torneo.comision.estado === 'PAGADO' ? 'Pagado' : 
                           torneo.comision.estado === 'PENDIENTE_VERIFICACION' ? 'Pendiente' :
                           'Pendiente de pago'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botón */}
                  <button
                    onClick={() => handleVerDetalle(torneo)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#151921] hover:bg-[#232838] text-white rounded-xl transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Gestionar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VISTA: CREAR TORNEO (Wizard simplificado)
  // ═══════════════════════════════════════════════════════════
  if (view === 'crear') {
    return (
      <TorneoWizard 
        onSuccess={handleVolver}
        onCancel={handleVolver}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VISTA: DETALLE DEL TORNEO
  // ═══════════════════════════════════════════════════════════
  if (view === 'detalle' && selectedTorneo) {
    return (
      <TorneoDetalle 
        torneo={selectedTorneo}
        onBack={handleVolver}
        onUpdate={loadTorneos}
      />
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: DETALLE DEL TORNEO (Checklist + Comisión)
// ═══════════════════════════════════════════════════════════
function TorneoDetalle({ 
  torneo, 
  onBack,
  onUpdate 
}: { 
  torneo: Torneo; 
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'comision' | 'info'>('checklist');
  const [torneoData, setTorneoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTorneoDetail();
  }, [torneo.id]);

  const loadTorneoDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/torneos/v2/${torneo.id}`);
      setTorneoData(data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#151921] rounded-xl transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-400 rotate-180" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{torneo.nombre}</h2>
          <p className="text-gray-400">Gestiona el torneo y su configuración</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          label="Checklist"
          active={activeTab === 'checklist'}
          onClick={() => setActiveTab('checklist')}
          icon={CheckCircle2}
        />
        <TabButton
          label="Comisión"
          active={activeTab === 'comision'}
          onClick={() => setActiveTab('comision')}
          icon={DollarSign}
          alert={torneo.comision?.bloqueoActivo}
        />
        <TabButton
          label="Información"
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
          icon={Trophy}
        />
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {activeTab === 'checklist' && (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ChecklistCuaderno tournamentId={torneo.id} />
          </motion.div>
        )}

        {activeTab === 'comision' && (
          <motion.div
            key="comision"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ComisionTorneo 
              tournamentId={torneo.id} 
              comision={torneoData?.comision || torneo.comision}
              onUpdate={onUpdate}
            />
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Información del Torneo</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Nombre" value={torneo.nombre} />
              <InfoItem label="Ciudad" value={torneo.ciudad} />
              <InfoItem label="Fecha inicio" value={formatDatePY(torneo.fechaInicio)} />
              <InfoItem label="Fecha fin" value={formatDatePY(torneo.fechaFin)} />
              <InfoItem label="Costo inscripción" value={formatCurrency(torneo.costoInscripcion)} />
              <InfoItem label="Inscripciones" value={`${torneo._count.inscripciones} jugadores`} />
              <InfoItem label="Estado" value={torneo.estado} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ 
  label, 
  active, 
  onClick, 
  icon: Icon,
  alert = false 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
        active
          ? 'bg-primary text-white shadow-lg'
          : 'bg-[#151921] text-gray-400 hover:text-white hover:bg-[#232838]'
      } ${alert ? 'ring-2 ring-red-500/50' : ''}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#0B0E14] rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: WIZARD DE CREACIÓN (El original simplificado)
// ═══════════════════════════════════════════════════════════
function TorneoWizard({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    ciudad: '',
    costoInscripcion: 0,
    sedeId: '',
  });

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      await api.post('/admin/torneos/v2', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando torneo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-[#151921] rounded-xl transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-400 rotate-180" />
        </button>
        <h2 className="text-2xl font-bold text-white">Crear Torneo</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-[#232838]'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="glass rounded-2xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Datos Básicos</h3>
            <input
              type="text"
              placeholder="Nombre del torneo"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
              />
              <input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Costos</h3>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Costo de inscripción (Gs.)</label>
              <input
                type="number"
                value={formData.costoInscripcion || ''}
                onChange={(e) => setFormData({ ...formData, costoInscripcion: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-sm text-gray-500">
              La comisión de FairPadel se calculará automáticamente según la cantidad de inscriptos.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Confirmar</h3>
            <div className="bg-[#0B0E14] rounded-xl p-4 space-y-2">
              <p><span className="text-gray-500">Nombre:</span> <span className="text-white">{formData.nombre}</span></p>
              <p><span className="text-gray-500">Ciudad:</span> <span className="text-white">{formData.ciudad}</span></p>
              <p><span className="text-gray-500">Inscripción:</span> <span className="text-white">{formatCurrency(formData.costoInscripcion)}</span></p>
            </div>
            <p className="text-sm text-emerald-400">
              Al crear el torneo, se generará automáticamente el checklist de preparación.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          {step === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Crear Torneo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
