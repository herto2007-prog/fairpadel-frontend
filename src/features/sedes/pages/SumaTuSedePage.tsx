import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { solicitudesSedeService, CrearSolicitudSedeData } from '../../../services/solicitudesSedeService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useNoIndex } from '../../../hooks/useNoIndex';

export default function SumaTuSedePage() {
  useNoIndex();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState<CrearSolicitudSedeData>({
    nombreContacto: '',
    email: '',
    telefono: '',
    nombreSede: '',
    ciudad: '',
    mensaje: '',
  });

  const set = (k: keyof CrearSolicitudSedeData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await solicitudesSedeService.crear({
        ...form,
        mensaje: form.mensaje?.trim() || undefined,
      });
      setEnviado(true);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo enviar la solicitud. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-[#151921] border border-[#232838] rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Recibimos tu solicitud!</h1>
          <p className="text-gray-400 mb-6">
            Gracias por querer sumar tu sede a FairPadel. Te vamos a contactar para activar el servicio de reservas.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#df2531] hover:bg-[#c41f2a] rounded-xl font-medium transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531]';

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-10 px-4">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#df2531]/15 text-[#df2531] rounded-full text-sm mb-3">
            <Building2 size={16} /> Para complejos de canchas
          </div>
          <h1 className="text-3xl font-bold mb-2">¿Tenés canchas? Sumate a FairPadel</h1>
          <p className="text-gray-400">
            Recibí reservas online de tu complejo. Plan mensual de Gs. 50.000.
          </p>
        </div>

        <form onSubmit={submit} className="bg-[#151921] border border-[#232838] rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tu nombre *</label>
              <input required value={form.nombreContacto} onChange={(e) => set('nombreContacto', e.target.value)}
                className={inputCls} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Teléfono / WhatsApp *</label>
              <input required value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                className={inputCls} placeholder="+595 981 123456" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email *</label>
            <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className={inputCls} placeholder="tucorreo@ejemplo.com" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre de la sede *</label>
              <input required value={form.nombreSede} onChange={(e) => set('nombreSede', e.target.value)}
                className={inputCls} placeholder="Ej: Pádel Center" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
              <input required value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}
                className={inputCls} placeholder="Ej: Ciudad del Este" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Mensaje (opcional)</label>
            <textarea value={form.mensaje} onChange={(e) => set('mensaje', e.target.value)}
              className={`${inputCls} h-24 resize-none`} placeholder="Ej: Tengo 4 canchas, 2 techadas..." />
          </div>

          <button type="submit" disabled={enviando}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#df2531] hover:bg-[#c41f2a] disabled:opacity-50 rounded-xl font-semibold transition-colors">
            {enviando ? (
              <><div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> Enviando...</>
            ) : (
              <><Send size={18} /> Enviar solicitud</>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Sin cuenta, sin compromiso. Te contactamos para activar tu sede.
          </p>
        </form>
      </div>
    </div>
  );
}
