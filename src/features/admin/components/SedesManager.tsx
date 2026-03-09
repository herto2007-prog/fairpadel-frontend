import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Edit2, Trash2, Power, PowerOff, 
  Search, Map, Phone, Save, X, Building2, ChevronDown, Check,
  Sun, ChevronUp
} from 'lucide-react';
import { adminService, Sede, CreateSedeData, Cancha, CreateCanchaData } from '../../../services/adminService';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';

// Países con códigos de teléfono
const countries = [
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
];

// Tipos de cancha (deben coincidir con el enum TipoCancha de Prisma)
const tiposCancha = [
  { value: 'CEMENTO', label: 'Cemento', icon: '🏗️' },
  { value: 'CRISTAL', label: 'Cristal', icon: '💎' },
  { value: 'SINTETICO', label: 'Césped sintético', icon: '🌱' },
];

export function SedesManager() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone selector state
  const [paisTelefono, setPaisTelefono] = useState('PY');
  const [telefonoNumero, setTelefonoNumero] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSedeData>({
    nombre: '',
    ciudad: '',
    direccion: '',
    mapsUrl: '',
    telefono: '',
  });

  // Canchas state
  const [expandedSede, setExpandedSede] = useState<string | null>(null);
  const [canchas, setCanchas] = useState<Record<string, Cancha[]>>({});
  const [loadingCanchas, setLoadingCanchas] = useState<Record<string, boolean>>({});
  const [showCanchaForm, setShowCanchaForm] = useState<string | null>(null);
  const [editingCancha, setEditingCancha] = useState<Cancha | null>(null);
  const [canchaFormData, setCanchaFormData] = useState<CreateCanchaData>({
    nombre: '',
    tipo: 'CEMENTO',
    tieneLuz: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const loadCanchas = async (sedeId: string) => {
    if (canchas[sedeId]) return; // Ya cargadas
    
    setLoadingCanchas(prev => ({ ...prev, [sedeId]: true }));
    try {
      const data = await adminService.getCanchas(sedeId);
      setCanchas(prev => ({ ...prev, [sedeId]: data }));
    } catch (error) {
      console.error('Error cargando canchas:', error);
    } finally {
      setLoadingCanchas(prev => ({ ...prev, [sedeId]: false }));
    }
  };

  const toggleExpandSede = (sedeId: string) => {
    if (expandedSede === sedeId) {
      setExpandedSede(null);
    } else {
      setExpandedSede(sedeId);
      loadCanchas(sedeId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const fullTelefono = telefonoNumero ? `${countries.find(c => c.code === paisTelefono)?.dialCode}${telefonoNumero}` : undefined;
    const dataToSend = {
      ...formData,
      telefono: fullTelefono,
      direccion: formData.direccion?.trim() || undefined,
      mapsUrl: formData.mapsUrl?.trim() || undefined,
    };

    try {
      if (editingSede) {
        await adminService.updateSede(editingSede.id, dataToSend);
        setMessage({ type: 'success', text: 'Sede actualizada correctamente' });
      } else {
        await adminService.createSede(dataToSend);
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

  const handleCanchaSubmit = async (sedeId: string) => {
    setSaving(true);
    try {
      if (editingCancha) {
        await adminService.updateCancha(editingCancha.id, canchaFormData);
        setMessage({ type: 'success', text: 'Cancha actualizada' });
      } else {
        await adminService.createCancha(sedeId, canchaFormData);
        setMessage({ type: 'success', text: 'Cancha creada' });
      }
      
      // Recargar canchas
      const data = await adminService.getCanchas(sedeId);
      setCanchas(prev => ({ ...prev, [sedeId]: data }));
      resetCanchaForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error guardando cancha' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede);
    
    let paisCode = 'PY';
    let numero = sede.telefono || '';
    
    if (sede.telefono) {
      for (const country of countries) {
        if (sede.telefono.startsWith(country.dialCode)) {
          paisCode = country.code;
          numero = sede.telefono.substring(country.dialCode.length);
          break;
        }
      }
    }
    
    setPaisTelefono(paisCode);
    setTelefonoNumero(numero);
    
    setFormData({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion || '',
      mapsUrl: sede.mapsUrl || '',
      telefono: sede.telefono || '',
    });
    setShowForm(true);
  };

  const handleEditCancha = (cancha: Cancha) => {
    setEditingCancha(cancha);
    setCanchaFormData({
      nombre: cancha.nombre,
      tipo: cancha.tipo,
      tieneLuz: cancha.tieneLuz,
    });
    setShowCanchaForm(cancha.sedeId);
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

  const handleDeleteCancha = async (canchaId: string, sedeId: string) => {
    if (!confirm('¿Estás seguro de desactivar esta cancha?')) return;
    
    try {
      await adminService.deleteCancha(canchaId);
      setMessage({ type: 'success', text: 'Cancha desactivada' });
      const data = await adminService.getCanchas(sedeId);
      setCanchas(prev => ({ ...prev, [sedeId]: data }));
    } catch (error) {
      setMessage({ type: 'error', text: 'Error desactivando cancha' });
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

  const handleActivateCancha = async (canchaId: string, sedeId: string) => {
    try {
      await adminService.activateCancha(canchaId);
      setMessage({ type: 'success', text: 'Cancha reactivada' });
      const data = await adminService.getCanchas(sedeId);
      setCanchas(prev => ({ ...prev, [sedeId]: data }));
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reactivando cancha' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({ nombre: '', ciudad: '', direccion: '', mapsUrl: '', telefono: '' });
    setPaisTelefono('PY');
    setTelefonoNumero('');
    setEditingSede(null);
    setShowForm(false);
  };

  const resetCanchaForm = () => {
    setCanchaFormData({ nombre: '', tipo: 'CEMENTO', tieneLuz: false });
    setEditingCancha(null);
    setShowCanchaForm(null);
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
          <p className="text-gray-400 text-sm">Administra sedes y sus canchas</p>
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
      <div className="grid grid-cols-4 gap-4">
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
          <p className="text-gray-400 text-sm">Total Canchas</p>
          <p className="text-2xl font-bold text-primary">
            {sedes.reduce((acc, s) => acc + (s._count?.canchas || 0), 0)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Con Luz</p>
          <p className="text-2xl font-bold text-yellow-400">
            {Object.values(canchas).flat().filter(c => c.tieneLuz).length}
          </p>
        </div>
      </div>

      {/* Formulario Sede */}
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
                <CityAutocomplete
                  value={formData.ciudad}
                  onChange={(value) => setFormData({ ...formData, ciudad: value })}
                  label="Ciudad *"
                  placeholder="Busca tu ciudad..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Avda. Santa Teresa 1234"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
                <div className="relative flex" ref={countryDropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="h-full px-4 bg-[#0B0E14] border border-r-0 border-[#232838] rounded-l-xl flex items-center gap-2 hover:border-primary transition-colors min-w-[110px]"
                    >
                      <span className="text-xl">{countries.find(c => c.code === paisTelefono)?.flag}</span>
                      <span className="text-gray-300 text-sm">{countries.find(c => c.code === paisTelefono)?.dialCode}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto glass rounded-xl border border-[#232838] z-50"
                        >
                          {countries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setPaisTelefono(country.code);
                                setShowCountryDropdown(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#151921] transition-colors text-left ${
                                paisTelefono === country.code ? 'bg-[#151921]' : ''
                              }`}
                            >
                              <span className="text-2xl">{country.flag}</span>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{country.name}</p>
                                <p className="text-gray-500 text-xs">{country.dialCode}</p>
                              </div>
                              {paisTelefono === country.code && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={telefonoNumero}
                      onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B0E14] border border-[#232838] rounded-r-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary rounded-l-none"
                      placeholder="981 123456"
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Código país: {countries.find(c => c.code === paisTelefono)?.dialCode} • Sin 0 inicial
                </p>
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
      <div className="space-y-4">
        {filteredSedes.map((sede) => (
          <motion.div
            key={sede.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Header de Sede */}
            <div 
              className={`p-5 ${!sede.activa ? 'opacity-60' : ''} ${expandedSede === sede.id ? 'bg-[#151921]' : ''}`}
            >
              <div className="flex items-start justify-between">
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
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sede.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {sede.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  <button
                    onClick={() => toggleExpandSede(sede.id)}
                    className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
                  >
                    {expandedSede === sede.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-400">
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
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  <span>{sede._count?.canchas || 0} canchas</span>
                </div>
              </div>

              {/* Acciones de Sede */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(sede)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                
                {sede.activa ? (
                  <button
                    onClick={() => handleDelete(sede.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(sede.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors text-sm"
                  >
                    <Power className="w-4 h-4" />
                    Activar
                  </button>
                )}

                <button
                  onClick={() => {
                    setExpandedSede(sede.id);
                    loadCanchas(sede.id);
                    setShowCanchaForm(sede.id);
                    resetCanchaForm();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Cancha
                </button>
              </div>
            </div>

            {/* Canchas expandibles */}
            <AnimatePresence>
              {expandedSede === sede.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#232838] bg-[#0B0E14]/50"
                >
                  <div className="p-5">
                    <h5 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Canchas de {sede.nombre}
                    </h5>

                    {/* Formulario de Cancha */}
                    <AnimatePresence>
                      {showCanchaForm === sede.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="glass rounded-xl p-4 mb-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h6 className="text-white font-medium">
                              {editingCancha ? 'Editar Cancha' : 'Nueva Cancha'}
                            </h6>
                            <button onClick={resetCanchaForm} className="text-gray-400 hover:text-white">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">Nombre *</label>
                              <input
                                type="text"
                                value={canchaFormData.nombre}
                                onChange={(e) => setCanchaFormData({ ...canchaFormData, nombre: e.target.value })}
                                className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary"
                                placeholder="Ej: Cancha 1"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-400 mb-2">Tipo de superficie</label>
                              <select
                                value={canchaFormData.tipo}
                                onChange={(e) => setCanchaFormData({ ...canchaFormData, tipo: e.target.value })}
                                className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary"
                              >
                                {tiposCancha.map(t => (
                                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={canchaFormData.tieneLuz}
                                  onChange={(e) => setCanchaFormData({ ...canchaFormData, tieneLuz: e.target.checked })}
                                  className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary"
                                />
                                <Sun className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm">Tiene iluminación</span>
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              onClick={resetCanchaForm}
                              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleCanchaSubmit(sede.id)}
                              disabled={saving || !canchaFormData.nombre.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg text-sm transition-all"
                            >
                              {saving ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              {editingCancha ? 'Guardar' : 'Crear'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Lista de Canchas */}
                    {loadingCanchas[sede.id] ? (
                      <div className="flex items-center justify-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(canchas[sede.id] || []).map((cancha) => (
                          <motion.div
                            key={cancha.id}
                            layout
                            className={`p-4 rounded-xl border ${
                              cancha.activa 
                                ? 'bg-[#151921] border-[#232838]' 
                                : 'bg-[#0B0E14] border-[#1a1d24] opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  cancha.activa ? 'bg-primary/20' : 'bg-gray-800'
                                }`}>
                                  <Map className={`w-5 h-5 ${cancha.activa ? 'text-primary' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{cancha.nombre}</p>
                                  <p className="text-xs text-gray-500">
                                    {tiposCancha.find(t => t.value === cancha.tipo)?.label || cancha.tipo}
                                  </p>
                                </div>
                              </div>
                              {cancha.tieneLuz && (
                                <div className="flex items-center gap-1 text-yellow-500" title="Con iluminación">
                                  <Sun className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEditCancha(cancha)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#232838] hover:bg-[#2a3042] text-white rounded text-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Editar
                              </button>
                              
                              {cancha.activa ? (
                                <button
                                  onClick={() => handleDeleteCancha(cancha.id, sede.id)}
                                  className="flex items-center justify-center p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateCancha(cancha.id, sede.id)}
                                  className="flex items-center justify-center p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-xs transition-colors"
                                >
                                  <Power className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}

                        {(!canchas[sede.id] || canchas[sede.id].length === 0) && (
                          <div className="col-span-full py-8 text-center">
                            <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No hay canchas registradas</p>
                            <button
                              onClick={() => {
                                setShowCanchaForm(sede.id);
                                resetCanchaForm();
                              }}
                              className="mt-2 text-primary text-sm hover:underline"
                            >
                              Agregar la primera cancha
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
