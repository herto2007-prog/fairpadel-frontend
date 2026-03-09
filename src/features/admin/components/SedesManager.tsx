import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Edit2, Trash2, Power, PowerOff, 
  Search, Map, Phone, Save, X, Building2 
} from 'lucide-react';
import { adminService, Sede, CreateSedeData } from '../../../services/adminService';

export function SedesManager() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSedeData>({
    nombre: '',
    ciudad: '',
    direccion: '',
    mapsUrl: '',
    telefono: '',
  });

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      const data = await adminService.getSedes();
      setSedes(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error cargando sedes' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingSede) {
        await adminService.updateSede(editingSede.id, formData);
        setMessage({ type: 'success', text: 'Sede actualizada correctamente' });
      } else {
        await adminService.createSede(formData);
        setMessage({ type: 'success', text: 'Sede creada correctamente' });
      }
      
      await loadSedes();
      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error guardando sede' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede);
    setFormData({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion || '',
      mapsUrl: sede.mapsUrl || '',
      telefono: sede.telefono || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar esta sede?')) return;
    
    try {
      await adminService.deleteSede(id);
      setMessage({ type: 'success', text: 'Sede desactivada' });
      await loadSedes();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error desactivando sede' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleActivate = async (id: string) => {
    try {
      await adminService.activateSede(id);
      setMessage({ type: 'success', text: 'Sede reactivada' });
      await loadSedes();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reactivando sede' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({ nombre: '', ciudad: '', direccion: '', mapsUrl: '', telefono: '' });
    setEditingSede(null);
    setShowForm(false);
  };

  const filteredSedes = sedes.filter(sede =>
    sede.nombre.toLowerCase().includes(search.toLowerCase()) ||
    sede.ciudad.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando sedes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de Sedes</h2>
          <p className="text-gray-400 text-sm">Administra las sedes y canchas del sistema</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nueva Sede
        </button>
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
          placeholder="Buscar sedes..."
          className="w-full bg-[#151921] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Total Sedes</p>
          <p className="text-2xl font-bold text-white">{sedes.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Activas</p>
          <p className="text-2xl font-bold text-green-400">
            {sedes.filter(s => s.activa).length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Inactivas</p>
          <p className="text-2xl font-bold text-gray-400">
            {sedes.filter(s => !s.activa).length}
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
                {editingSede ? 'Editar Sede' : 'Nueva Sede'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Club Padel Paraguay"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Asunción"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Avda. Santa Teresa 1234"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: +595 981 123456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">URL Google Maps</label>
                <input
                  type="url"
                  value={formData.mapsUrl}
                  onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
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
                  {editingSede ? 'Guardar Cambios' : 'Crear Sede'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Sedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSedes.map((sede) => (
          <motion.div
            key={sede.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`glass rounded-2xl p-5 ${!sede.activa ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  sede.activa ? 'bg-primary/20' : 'bg-gray-700'
                }`}>
                  <Building2 className={`w-6 h-6 ${sede.activa ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{sede.nombre}</h4>
                  <p className="text-sm text-gray-400">{sede.ciudad}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                sede.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {sede.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-400 mb-4">
              {sede.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{sede.direccion}</span>
                </div>
              )}
              {sede.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{sede.telefono}</span>
                </div>
              )}
              {sede.canchas && (
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  <span>{sede.canchas.length} canchas</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(sede)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              
              {sede.activa ? (
                <button
                  onClick={() => handleDelete(sede.id)}
                  className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(sede.id)}
                  className="flex items-center justify-center p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                >
                  <Power className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSedes.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron sedes</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary hover:underline"
          >
            Crear la primera sede
          </button>
        </div>
      )}
    </div>
  );
}
