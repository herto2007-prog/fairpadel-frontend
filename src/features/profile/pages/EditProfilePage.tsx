import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/usersService';
import { notificacionesService } from '@/services/notificacionesService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { UpdateProfileDto, PreferenciaNotificacion, TipoNotificacion } from '@/types';
import { Camera, Crown, Bell, Mail, MessageSquare } from 'lucide-react';
import ProfilePhotoCropper from '../components/ProfilePhotoCropper';
import toast from 'react-hot-toast';

// Labels legibles por tipo de notificacion
const TIPO_LABELS: Record<string, string> = {
  SISTEMA: 'Sistema',
  TORNEO: 'Torneos',
  INSCRIPCION: 'Inscripciones',
  PARTIDO: 'Partidos',
  RANKING: 'Rankings y Categorias',
  SOCIAL: 'Social',
  PAGO: 'Pagos',
  MENSAJE: 'Mensajes',
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Notification preferences
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion[]>([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProfileDto>({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || '',
    fechaNacimiento: user?.fechaNacimiento?.split('T')[0] || '',
    ciudad: user?.ciudad || '',
    bio: user?.bio || '',
  });

  // Load notification preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const data = await notificacionesService.obtenerPreferencias();
        setPreferencias(data);
      } catch {
        // ignore
      } finally {
        setLoadingPrefs(false);
      }
    };
    loadPrefs();
  }, []);

  const handleTogglePref = async (
    tipo: TipoNotificacion | string,
    campo: 'recibirEmail' | 'recibirSms',
    value: boolean,
  ) => {
    const prevValue = !value; // The value before toggle
    setSavingPref(`${tipo}-${campo}`);

    // Optimistic update
    setPreferencias((prev) =>
      prev.map((p) =>
        p.tipoNotificacion === tipo ? { ...p, [campo]: value } : p,
      ),
    );

    try {
      await notificacionesService.actualizarPreferencia({
        tipoNotificacion: tipo,
        [campo]: value,
      });
    } catch {
      // Revert on error
      setPreferencias((prev) =>
        prev.map((p) =>
          p.tipoNotificacion === tipo ? { ...p, [campo]: prevValue } : p,
        ),
      );
      toast.error('Error al guardar preferencia');
    } finally {
      setSavingPref(null);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file and open the cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingPhoto(true);
    setError('');

    try {
      // Convert blob to File for the upload service
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const response = await usersService.updateFoto(file);
      updateUser({ fotoUrl: response.fotoUrl });
      toast.success('Foto actualizada correctamente');
      setCropImageSrc(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedUser = await usersService.updateMyProfile(formData);
      updateUser(updatedUser);
      toast.success('Perfil actualizado correctamente');
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Use Navigate component instead of calling navigate() during render
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Foto de perfil */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary-500/20 flex items-center justify-center text-2xl font-bold text-primary-500 overflow-hidden">
                {user.fotoUrl ? (
                  <img
                    src={user.fotoUrl}
                    alt={`${user.nombre} ${user.apellido}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
                )}
              </div>
              <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            {uploadingPhoto && (
              <p className="text-sm text-light-secondary mt-2">Subiendo foto...</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
              <Input
                label="Apellido"
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
              />
            </div>

            <Input
              label="Telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />

            <Input
              label="Fecha de Nacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
            />

            <Input
              label="Ciudad"
              type="text"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                Biografia
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                maxLength={500}
                placeholder="Cuentanos sobre ti..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <p className="text-xs text-light-secondary mt-1">
                {formData.bio?.length || 0}/500 caracteres
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preferencias de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-400" />
            Preferencias de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-light-secondary mb-4">
            Controla como quieres recibir notificaciones. La campanita in-app siempre esta activa.
          </p>

          {loadingPrefs ? (
            <div className="text-center text-light-muted py-6 text-sm">Cargando preferencias...</div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[1fr_60px_60px] sm:grid-cols-[1fr_80px_80px] gap-2 px-2 sm:px-3 py-2 text-xs font-semibold text-light-muted uppercase">
                <span>Tipo</span>
                <span className="text-center flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="hidden sm:inline">Email</span>
                </span>
                <span className="text-center flex items-center justify-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="hidden sm:inline">SMS</span>
                </span>
              </div>

              {preferencias.map((pref) => (
                <div
                  key={pref.tipoNotificacion}
                  className="grid grid-cols-[1fr_60px_60px] sm:grid-cols-[1fr_80px_80px] gap-2 px-2 sm:px-3 py-2.5 rounded-lg hover:bg-dark-hover/50 items-center"
                >
                  <span className="text-sm text-light-text">
                    {TIPO_LABELS[pref.tipoNotificacion] || pref.tipoNotificacion}
                  </span>

                  {/* Email toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleTogglePref(pref.tipoNotificacion, 'recibirEmail', !pref.recibirEmail)}
                      disabled={savingPref === `${pref.tipoNotificacion}-recibirEmail`}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        pref.recibirEmail ? 'bg-primary-500' : 'bg-dark-border'
                      } ${savingPref === `${pref.tipoNotificacion}-recibirEmail` ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          pref.recibirEmail ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* SMS toggle (only visible/enabled for premium) */}
                  <div className="flex justify-center">
                    {user?.esPremium ? (
                      <button
                        onClick={() => handleTogglePref(pref.tipoNotificacion, 'recibirSms', !pref.recibirSms)}
                        disabled={savingPref === `${pref.tipoNotificacion}-recibirSms`}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          pref.recibirSms ? 'bg-primary-500' : 'bg-dark-border'
                        } ${savingPref === `${pref.tipoNotificacion}-recibirSms` ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            pref.recibirSms ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-light-muted" title="Solo para Premium">
                        <Crown className="h-3 w-3 text-yellow-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!user?.esPremium && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-yellow-400">
                Las notificaciones por SMS estan disponibles solo para usuarios Premium.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Cropper Modal */}
      {cropImageSrc && (
        <ProfilePhotoCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
          saving={uploadingPhoto}
        />
      )}
    </div>
  );
};

export default EditProfilePage;
