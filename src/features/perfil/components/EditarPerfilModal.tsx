import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Camera, Lock, Instagram, Facebook, Loader2, Check, Calendar } from 'lucide-react';
import { api } from '../../../services/api';
import { PerfilJugador } from '../perfilService';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { AvatarEditorModal } from '../../../components/upload/AvatarEditor';

interface EditarPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: PerfilJugador;
  onUpdate: (updatedPerfil: Partial<PerfilJugador>) => void;
}

type TabType = 'general' | 'fotos' | 'seguridad';

export function EditarPerfilModal({ isOpen, onClose, perfil, onUpdate }: EditarPerfilModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    bio: perfil.bio || '',
    ciudad: perfil.ciudad || '',
    pais: perfil.pais || 'Paraguay',
    telefono: perfil.telefono || '',
    fechaNacimiento: perfil.edad ? '' : '', // No tenemos fechaNacimiento directo en PerfilJugador, pero la API la acepta
    instagram: perfil.instagram || '',
    facebook: perfil.facebook || '',
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirmar: '',
  });

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState(perfil.fotoUrl);
  const [bannerPreview, setBannerPreview] = useState(perfil.bannerUrl);
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | null>(null);

  const handleUpdatePerfil = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.put('/users/profile', formData);
      if (data.success) {
        setSuccess('Perfil actualizado correctamente');
        onUpdate(data.data);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error actualizando perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.passwordNuevo !== passwordData.passwordConfirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.put('/users/profile/password', {
        passwordActual: passwordData.passwordActual,
        passwordNuevo: passwordData.passwordNuevo,
      });
      if (data.success) {
        setSuccess('Contraseña actualizada correctamente');
        setPasswordData({ passwordActual: '', passwordNuevo: '', passwordConfirmar: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Error cambiando contraseña');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cambiando contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'foto' | 'banner') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.put(`/users/profile/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setSuccess(`${type === 'foto' ? 'Foto de perfil' : 'Banner'} actualizado`);
        onUpdate({ [type === 'foto' ? 'fotoUrl' : 'bannerUrl']: data.data.fotoUrl || data.data.bannerUrl });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Error subiendo ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'foto' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'foto') {
        setAvatarEditorImage(reader.result as string);
      } else {
        setBannerPreview(reader.result as string);
        handleFileUpload(file, 'banner');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = (dataUrl: string) => {
    const file = dataUrlToFile(dataUrl, 'avatar.jpg');
    setFotoPreview(dataUrl);
    setAvatarEditorImage(null);
    handleFileUpload(file, 'foto');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'fotos', label: 'Fotos', icon: Camera },
    { id: 'seguridad', label: 'Seguridad', icon: Lock },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#df2531] border-b-2 border-[#df2531]'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Alerts */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Biografía</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50 resize-none"
                    rows={3}
                    placeholder="Cuéntanos sobre ti..."
                    maxLength={500}
                  />
                  <p className="text-xs text-white/30 mt-1">{formData.bio.length}/500</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ciudad
                    </label>
                    <CityAutocomplete
                      value={formData.ciudad}
                      onChange={(value) => setFormData({ ...formData, ciudad: value })}
                      placeholder="Tu ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">País</label>
                    <input
                      type="text"
                      value={formData.pais}
                      onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                      placeholder="Tu país"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                    placeholder="+595 981 123456"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50 [color-scheme:dark]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      <Instagram className="w-4 h-4 inline mr-1" />
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                      placeholder="@usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      <Facebook className="w-4 h-4 inline mr-1" />
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                      placeholder="facebook.com/usuario"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdatePerfil}
                  disabled={loading}
                  className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                </button>
              </div>
            )}

            {/* Fotos Tab */}
            {avatarEditorImage && (
              <AvatarEditorModal
                image={avatarEditorImage}
                onSave={handleAvatarSave}
                onCancel={() => setAvatarEditorImage(null)}
              />
            )}

            {activeTab === 'fotos' && (
              <div className="space-y-6">
                {/* Foto de Perfil */}
                <div>
                  <label className="block text-sm text-white/60 mb-3">Foto de Perfil</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Foto preview"
                          className="w-24 h-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                          {perfil.nombre[0]}{perfil.apellido[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'foto')}
                        className="hidden"
                      />
                      <button
                        onClick={() => fotoInputRef.current?.click()}
                        disabled={loading}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Cambiar Foto
                      </button>
                      <p className="text-xs text-white/40 mt-2">JPG, PNG. Máximo 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-sm text-white/60 mb-3">Banner</label>
                  <div className="space-y-3">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-32 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[#df2531]/30 via-purple-900/20 to-blue-900/20" />
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'banner')}
                      className="hidden"
                    />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Cambiar Banner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seguridad Tab */}
            {activeTab === 'seguridad' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Contraseña Actual</label>
                  <input
                    type="password"
                    value={passwordData.passwordActual}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordActual: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={passwordData.passwordNuevo}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordNuevo: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={passwordData.passwordConfirmar}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordConfirmar: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleUpdatePassword}
                  disabled={loading || !passwordData.passwordActual || !passwordData.passwordNuevo || !passwordData.passwordConfirmar}
                  className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar Contraseña'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
