import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Plus, Edit2, Trash2, Power, PowerOff, 
  Search, Save, X, Settings, Globe,
  Users, Target
} from 'lucide-react';
import { adminService, Modalidad, CreateModalidadData } from '../../../services/adminService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

export function ModalidadesManager() {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModalidad, setEditingModalidad] = useState<Modalidad | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateModalidadData>({
    nombre: '',
    descripcion: '',
    reglas: {
      variante: 'PY',
      tipoEmparejamiento: 'PAREJA_FIJA',
      sistemaPuntos: 'TRADICIONAL',
      formatoBracket: 'GARANTIZADO_2_PARTIDOS',
      setsPorPartido: 3,
      requierePareja: true,
      minimoPartidosGarantizados: 2,
    },
  });

  useEffect(() => {
    loadModalidades();
  }, []);

  const loadModalidades = async () => {
    try {
      const data = await adminService.getModalidades();
      setModalidades(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error cargando modalidades' });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    const confirmed = await confirm({
      title: 'Crear modalidades por defecto',
      message: '¿Crear las 8 modalidades por defecto (PY + Mundo)?',
      confirmText: 'Crear',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;
    
    setSeeding(true);
    try {
      const result = await adminService.seedModalidades();
      showSuccess('Modalidades creadas', result.message);
      await loadModalidades();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Error creando modalidades');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingModalidad) {
        await adminService.updateModalidad(editingModalidad.id, formData);
        setMessage({ type: 'success', text: 'Modalidad actualizada correctamente' });
      } else {
        await adminService.createModalidad(formData);
        setMessage({ type: 'success', text: 'Modalidad creada correctamente' });
      }
      
      await loadModalidades();
      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error guardando modalidad' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (modalidad: Modalidad) => {
    setEditingModalidad(modalidad);
    setFormData({
      nombre: modalidad.nombre,
      descripcion: modalidad.descripcion,
      reglas: modalidad.reglas,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Desactivar modalidad',
      message: '¿Estás seguro de desactivar esta modalidad?',
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    
    try {
      await adminService.deleteModalidad(id);
      showSuccess('Modalidad desactivada', 'La modalidad fue desactivada exitosamente');
      await loadModalidades();
    } catch (error) {
      showError('Error', 'Error desactivando modalidad');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminService.updateModalidad(id, { activa: true });
      setMessage({ type: 'success', text: 'Modalidad reactivada' });
      await loadModalidades();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reactivando modalidad' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      reglas: {
        variante: 'PY',
        tipoEmparejamiento: 'PAREJA_FIJA',
        sistemaPuntos: 'TRADICIONAL',
        formatoBracket: 'GARANTIZADO_2_PARTIDOS',
        setsPorPartido: 3,
        requierePareja: true,
        minimoPartidosGarantizados: 2,
      },
    });
    setEditingModalidad(null);
    setShowForm(false);
  };

  const getVariantBadge = (variante: string) => {
    return variante === 'PY' 
      ? { text: '🇵🇾 Paraguay', color: 'bg-red-500/20 text-red-400' }
      : { text: '🌍 Mundo', color: 'bg-blue-500/20 text-blue-400' };
  };

  const getFormatoLabel = (formato: string) => {
    const formatos: Record<string, string> = {
      'GARANTIZADO_2_PARTIDOS': '2+ partidos',
      'ELIMINACION_DIRECTA': 'Eliminación directa',
      'LIGA_ROTATIVA_PY': 'Liga rotativa PY',
      'SUIZO': 'Sistema suizo',
      'AMERICANO_PY': 'Americano PY',
      'AMERICANO_SUIZO': 'Americano suizo',
    };
    return formatos[formato] || formato;
  };

  const filteredModalidades = modalidades.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando modalidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de Modalidades</h2>
          <p className="text-gray-400 text-sm">Administra las modalidades de torneos (PY y Mundo)</p>
        </div>
        
        <div className="flex gap-3">
          {modalidades.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
            >
              {seeding ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Globe className="w-5 h-5" />
              )}
              Crear por defecto
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Nueva Modalidad
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <Power className="w-5 h-5 text-green-500" />
          ) : (
            <PowerOff className="w-5 h-5 text-red-500" />
          )}
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar modalidades..."
          className="w-full bg-[#151921] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{modalidades.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Activas</p>
          <p className="text-2xl font-bold text-green-400">
            {modalidades.filter(m => m.activa).length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">🇵🇾 PY</p>
          <p className="text-2xl font-bold text-red-400">
            {modalidades.filter(m => m.reglas?.variante === 'PY').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">🌍 Mundo</p>
          <p className="text-2xl font-bold text-blue-400">
            {modalidades.filter(m => m.reglas?.variante === 'MUNDIAL').length}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingModalidad ? 'Editar Modalidad' : 'Nueva Modalidad'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder="Ej: Clásico PY"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Variante</label>
                  <select
                    value={formData.reglas.variante}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, variante: e.target.value }
                    })}
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="PY">🇵🇾 Paraguay</option>
                    <option value="MUNDIAL">🌍 Mundo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripción *</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Breve descripción de la modalidad"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Emparejamiento</label>
                  <select
                    value={formData.reglas.tipoEmparejamiento}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, tipoEmparejamiento: e.target.value }
                    })}
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="PAREJA_FIJA">Pareja fija</option>
                    <option value="ROTATIVO">Rotativo</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sistema</label>
                  <select
                    value={formData.reglas.sistemaPuntos}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, sistemaPuntos: e.target.value }
                    })}
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="TRADICIONAL">Tradicional</option>
                    <option value="SUMA">Suma</option>
                    <option value="SETS">Sets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Formato</label>
                  <select
                    value={formData.reglas.formatoBracket}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, formatoBracket: e.target.value }
                    })}
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="GARANTIZADO_2_PARTIDOS">2+ partidos</option>
                    <option value="ELIMINACION_DIRECTA">Eliminación</option>
                    <option value="LIGA_ROTATIVA_PY">Liga PY</option>
                    <option value="SUIZO">Suizo</option>
                    <option value="AMERICANO_PY">Americano PY</option>
                    <option value="AMERICANO_SUIZO">Americano suizo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sets</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.reglas.setsPorPartido}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, setsPorPartido: parseInt(e.target.value) }
                    })}
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reglas.requierePareja}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reglas: { ...formData.reglas, requierePareja: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary"
                  />
                  Requiere pareja
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingModalidad ? 'Guardar Cambios' : 'Crear Modalidad'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Modalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModalidades.map((modalidad) => {
          const variantBadge = getVariantBadge(modalidad.reglas?.variante);
          return (
            <motion.div
              key={modalidad.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`glass rounded-2xl p-5 ${!modalidad.activa ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    modalidad.activa ? 'bg-primary/20' : 'bg-gray-700'
                  }`}>
                    <Trophy className={`w-6 h-6 ${modalidad.activa ? 'text-primary' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{modalidad.nombre}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${variantBadge.color}`}>
                      {variantBadge.text}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  modalidad.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {modalidad.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {modalidad.descripcion}
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="bg-[#151921] rounded-lg p-2 text-center">
                  <Settings className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <span className="text-gray-400">{getFormatoLabel(modalidad.reglas?.formatoBracket)}</span>
                </div>
                <div className="bg-[#151921] rounded-lg p-2 text-center">
                  <Target className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <span className="text-gray-400">{modalidad.reglas?.setsPorPartido} sets</span>
                </div>
                <div className="bg-[#151921] rounded-lg p-2 text-center">
                  <Users className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <span className="text-gray-400">
                    {modalidad.reglas?.requierePareja ? 'Pareja' : 'Individual'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>
                  {modalidad._count?.torneos || 0} torneos usándola
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(modalidad)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                
                {modalidad.activa ? (
                  <button
                    onClick={() => handleDelete(modalidad.id)}
                    className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(modalidad.id)}
                    className="flex items-center justify-center p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredModalidades.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron modalidades</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleSeedDefaults}
              className="text-green-400 hover:underline"
            >
              Crear modalidades por defecto
            </button>
            <span className="text-gray-600">o</span>
            <button
              onClick={() => setShowForm(true)}
              className="text-primary hover:underline"
            >
              Crear manualmente
            </button>
          </div>
        </div>
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
    </div>
  );
}
