import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Upload, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Smartphone,
  CreditCard,
  User,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  torneoV2Service, 
  Comision, 
  DatosBancarios, 
  TorneoEstado 
} from '../../../services/torneoV2Service';
import { formatCurrency } from '../../../utils/currency';

interface ComisionTorneoProps {
  tournamentId: string;
  comision: Comision;
  onUpdate?: () => void;
}

export function ComisionTorneo({ tournamentId, comision, onUpdate }: ComisionTorneoProps) {
  const [estado, setEstado] = useState<TorneoEstado | null>(null);
  const [datosBancarios, setDatosBancarios] = useState<DatosBancarios | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEstado();
    loadDatosBancarios();
  }, [tournamentId]);

  const loadEstado = async () => {
    try {
      const data = await torneoV2Service.getEstado(tournamentId);
      setEstado(data);
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  };

  const loadDatosBancarios = async () => {
    try {
      const data = await torneoV2Service.getDatosBancarios();
      setDatosBancarios(data.datosBancarios);
    } catch (error) {
      console.error('Error cargando datos bancarios:', error);
    }
  };

  const subirComprobante = async () => {
    if (!comprobanteUrl.trim()) return;
    
    try {
      setSubmitting(true);
      await torneoV2Service.subirComprobante(tournamentId, {
        comprobanteUrl,
        notas: notas || undefined,
      });
      setComprobanteUrl('');
      setNotas('');
      await loadEstado();
      onUpdate?.();
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'PARCIAL':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'PENDIENTE_VERIFICACION':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'PENDIENTE_VERIFICACION':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  // Si el torneo está bloqueado, mostrar pantalla de bloqueo
  if (estado?.bloqueo.activo) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Torneo Bloqueado</h3>
            <p className="text-red-400">
              Regulariza el pago para continuar
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
          <p className="text-slate-300 mb-4">
            El torneo está increíble. Para continuar a partir de aquí ({estado.bloqueo.rondaBloqueo}), 
            verifica tus inscriptos y abona la comisión de la plataforma.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-500 block">Monto estimado</span>
              <span className="text-lg font-bold text-white">
                {formatCurrency(estado.bloqueo.montoEstimado)}
              </span>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-500 block">Monto pagado</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(estado.bloqueo.montoPagado)}
              </span>
            </div>
          </div>
        </div>

        {/* Datos bancarios */}
        {datosBancarios && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Datos para transferencia
            </h4>
            
            <div className="space-y-3">
              {datosBancarios.banco && (
                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Banco</span>
                  </div>
                  <span className="text-sm text-white font-medium">{datosBancarios.banco}</span>
                </div>
              )}
              
              {datosBancarios.titular && (
                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Titular</span>
                  </div>
                  <span className="text-sm text-white font-medium">{datosBancarios.titular}</span>
                </div>
              )}
              
              {datosBancarios.numeroCuenta && (
                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Cuenta</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(datosBancarios.numeroCuenta)}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {datosBancarios.numeroCuenta}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {datosBancarios.alias && (
                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Alias</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(datosBancarios.alias)}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {datosBancarios.alias}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {copied && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-400 mt-2 text-center"
              >
                ¡Copiado al portapapeles!
              </motion.p>
            )}
          </div>
        )}

        {/* WhatsApp */}
        {datosBancarios?.whatsapp && (
          <a
            href={`https://wa.me/${datosBancarios.whatsapp.replace(/\D/g, '')}?text=Hola,%20soy%20organizador%20del%20torneo%20${encodeURIComponent(estado?.torneo.nombre || '')}%20y%20quiero%20enviar%20el%20comprobante%20de%20pago`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors mb-4"
          >
            <Smartphone className="w-5 h-5" />
            Enviar comprobante por WhatsApp
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Subir comprobante */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            O subir comprobante aquí
          </h4>
          
          <input
            type="url"
            placeholder="URL del comprobante (imgbb, cloudinary, etc.)"
            value={comprobanteUrl}
            onChange={(e) => setComprobanteUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none mb-3"
          />
          
          <textarea
            placeholder="Notas adicionales (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none mb-3"
          />
          
          <button
            onClick={subirComprobante}
            disabled={!comprobanteUrl.trim() || submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Subir comprobante
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // Estado normal (no bloqueado)
  return (
    <div className={`rounded-xl border p-4 ${getStatusColor(comision.estado)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {comision.bloqueoActivo ? (
            <Lock className="w-5 h-5" />
          ) : (
            <Unlock className="w-5 h-5" />
          )}
          <span className="font-medium">Comisión FairPadel</span>
        </div>
        {getStatusIcon(comision.estado)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Estado</span>
          <span className="font-medium">
            {comision.estado === 'PAGADO' ? 'Pagado' : 
             comision.estado === 'PENDIENTE_VERIFICACION' ? 'Pendiente verificación' :
             comision.estado === 'PARCIAL' ? 'Pago parcial' : 'Pendiente'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Monto estimado</span>
          <span className="font-medium">{formatCurrency(comision.montoEstimado)}</span>
        </div>
        
        {comision.montoPagado > 0 && (
          <div className="flex justify-between text-sm">
            <span className="opacity-70">Monto pagado</span>
            <span className="font-medium">{formatCurrency(comision.montoPagado)}</span>
          </div>
        )}
        
        {comision.estado === 'PENDIENTE_VERIFICACION' && (
          <p className="text-xs mt-2 opacity-70">
            Comprobante subido. Esperando verificación del admin.
          </p>
        )}
      </div>
    </div>
  );
}
