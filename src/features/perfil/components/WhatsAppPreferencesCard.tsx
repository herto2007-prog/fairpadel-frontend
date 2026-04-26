import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Check, AlertCircle, Bell, Mail, Smartphone
} from 'lucide-react';
import { PerfilJugador, perfilService } from '../perfilService';

interface WhatsAppPreferencesCardProps {
  perfil: PerfilJugador;
  onUpdate: () => void;
}

type PreferenciaType = 'EMAIL' | 'WHATSAPP' | 'AMBOS';

export function WhatsAppPreferencesCard({ perfil, onUpdate }: WhatsAppPreferencesCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const whatsapp = perfil.whatsapp;
  const preferenciaActual = whatsapp?.preferenciaNotificacion || 'EMAIL';

  const handleCambiarPreferencia = async (nuevaPreferencia: PreferenciaType) => {
    if (nuevaPreferencia === preferenciaActual) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await perfilService.updatePreferenciasNotificacion(nuevaPreferencia);
      
      if (result.success) {
        setSuccess(result.message);
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolicitarConsentimiento = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await perfilService.solicitarConsentimientoWhatsapp();

      if (result.success) {
        setSuccess(result.message);
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al solicitar consentimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevocarConsentimiento = async () => {
    if (!confirm('¿Estás seguro de que deseas dejar de recibir notificaciones por WhatsApp?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await perfilService.revocarConsentimientoWhatsapp();
      
      if (result.success) {
        setSuccess(result.message);
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al revocar consentimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!whatsapp?.consentCheckbox) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
          <Mail className="w-3 h-3" />
          Solo Email
        </span>
      );
    }

    switch (whatsapp.consentStatus) {
      case 'CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <Check className="w-3 h-3" />
            Confirmado
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'RECHAZADO':
      case 'REVOCADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <AlertCircle className="w-3 h-3" />
            No disponible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
            <Mail className="w-3 h-3" />
            Solo Email
          </span>
        );
    }
  };

  const getPreferenciaIcon = (pref: PreferenciaType) => {
    switch (pref) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'WHATSAPP':
        return <MessageCircle className="w-4 h-4" />;
      case 'AMBOS':
        return <Bell className="w-4 h-4" />;
    }
  };

  const puedeUsarWhatsApp = whatsapp?.consentStatus === 'CONFIRMADO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
            <p className="text-sm text-white/40">Elige cómo recibir alertas</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Opciones de preferencia */}
      <div className="space-y-2 mb-6">
        {(['EMAIL', 'WHATSAPP', 'AMBOS'] as PreferenciaType[]).map((pref) => (
          <button
            key={pref}
            onClick={() => handleCambiarPreferencia(pref)}
            disabled={isLoading || (pref !== 'EMAIL' && !puedeUsarWhatsApp)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              preferenciaActual === pref
                ? 'bg-primary/10 border-primary/30'
                : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'
            } ${pref !== 'EMAIL' && !puedeUsarWhatsApp ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                preferenciaActual === pref ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                {getPreferenciaIcon(pref)}
              </div>
              <div className="text-left">
                <p className={`font-medium ${
                  preferenciaActual === pref ? 'text-white' : 'text-white/70'
                }`}>
                  {pref === 'EMAIL' && 'Solo Email'}
                  {pref === 'WHATSAPP' && 'Solo WhatsApp'}
                  {pref === 'AMBOS' && 'Email y WhatsApp'}
                </p>
                <p className="text-xs text-white/40">
                  {pref === 'EMAIL' && 'Recibirás todas las notificaciones por correo'}
                  {pref === 'WHATSAPP' && 'Solo mensajes de WhatsApp, sin emails'}
                  {pref === 'AMBOS' && 'Notificaciones en ambos canales'}
                </p>
              </div>
            </div>
            {preferenciaActual === pref && (
              <Check className="w-5 h-5 text-primary" />
            )}
            {pref !== 'EMAIL' && !puedeUsarWhatsApp && (
              <span className="text-xs text-white/30">No disponible</span>
            )}
          </button>
        ))}
      </div>

      {/* Información de estado de WhatsApp */}
      {whatsapp?.consentCheckbox && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-white/40 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                Estado de WhatsApp
              </p>
              
              {whatsapp.consentStatus === 'PENDIENTE' && (
                <div className="space-y-2">
                  <p className="text-sm text-white/60">
                    Te enviamos un mensaje de confirmación a{' '}
                    <span className="text-white">{perfil.telefono}</span>.
                    Responde <strong>"SI"</strong> para activar las notificaciones.
                  </p>
                </div>
              )}

              {whatsapp.consentStatus === 'CONFIRMADO' && (
                <div className="space-y-2">
                  <p className="text-sm text-white/60">
                    WhatsApp activo en{' '}
                    <span className="text-white">{perfil.telefono}</span>
                  </p>
                  {whatsapp.consentDate && (
                    <p className="text-xs text-white/40">
                      Confirmado el {new Date(whatsapp.consentDate).toLocaleDateString('es-PY')}
                    </p>
                  )}
                  <button
                    onClick={handleRevocarConsentimiento}
                    disabled={isLoading}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {isLoading ? 'Procesando...' : 'Revocar consentimiento'}
                  </button>
                </div>
              )}

              {(whatsapp.consentStatus === 'RECHAZADO' || whatsapp.consentStatus === 'REVOCADO') && (
                <p className="text-sm text-white/60">
                  Has optado por no recibir notificaciones por WhatsApp.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!whatsapp?.consentCheckbox && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-white/40 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white/60 mb-3">
                No has activado las notificaciones por WhatsApp.
              </p>
              {perfil.telefono ? (
                <button
                  onClick={handleSolicitarConsentimiento}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Enviando...' : 'Activar notificaciones por WhatsApp'}
                </button>
              ) : (
                <p className="text-sm text-white/60">
                  <a href="/perfil/editar" className="text-primary hover:underline">
                    Edita tu perfil
                  </a>{' '}
                  para agregar tu número y activarlas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
