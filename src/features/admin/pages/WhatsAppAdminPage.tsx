import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '../../../components/layout';
import { api } from '../../../services/api';
import { formatDatePY } from '../../../utils/date';

interface Conversacion {
  id: string;
  waId: string;
  estado: string;
  categoria: string;
  iniciadaPor: string;
  fechaInicio: string;
  fechaExpiracion: string;
  ultimoMensajeAt: string;
  totalMensajes: number;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  } | null;
  esLead: boolean;
}

interface Mensaje {
  id: string;
  direccion: 'ENTRANTE' | 'SALIENTE';
  tipo: string;
  contenido: string;
  estado: string;
  errorMsg: string | null;
  enviadoAt: string;
  esNuestro: boolean;
}

export function WhatsAppAdminPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalConversaciones: 0,
    conversacionesActivas: 0,
    totalMensajes: 0,
    mensajesEntrantes: 0,
    mensajesSalientes: 0,
    leads: 0,
    porcentajeLeads: 0,
  });
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Cargar conversaciones
  useEffect(() => {
    cargarConversaciones();
    cargarEstadisticas();
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarConversaciones();
      if (conversacionSeleccionada) {
        cargarMensajes(conversacionSeleccionada.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [conversacionSeleccionada?.id]);

  const cargarConversaciones = async () => {
    try {
      const { data } = await api.get('/admin/whatsapp/conversaciones');
      setConversaciones(data.conversaciones);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const { data } = await api.get('/admin/whatsapp/estadisticas');
      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarMensajes = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/whatsapp/conversaciones/${conversationId}/mensajes`);
      setMensajes(data.mensajes);
      setConversacionSeleccionada(data.conversacion);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarConversacion = (conv: Conversacion) => {
    setConversacionSeleccionada(conv);
    cargarMensajes(conv.id);
  };

  const enviarRespuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversacionSeleccionada || !nuevoMensaje.trim()) return;

    setEnviando(true);
    try {
      await api.post('/admin/whatsapp/responder', {
        conversationId: conversacionSeleccionada.id,
        mensaje: nuevoMensaje,
      });
      setNuevoMensaje('');
      // Recargar mensajes
      await cargarMensajes(conversacionSeleccionada.id);
      await cargarConversaciones();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error enviando mensaje');
    } finally {
      setEnviando(false);
    }
  };

  // Scroll al final de mensajes
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  return (
    <PageLayout showHeader>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Total Conversaciones</div>
            <div className="text-2xl font-bold text-white">{estadisticas.totalConversaciones}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Leads Potenciales</div>
            <div className="text-2xl font-bold text-[#df2531]">{estadisticas.leads}</div>
            <div className="text-xs text-white/40">{estadisticas.porcentajeLeads}% del total</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Mensajes Recibidos</div>
            <div className="text-2xl font-bold text-emerald-400">{estadisticas.mensajesEntrantes}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Mensajes Enviados</div>
            <div className="text-2xl font-bold text-blue-400">{estadisticas.mensajesSalientes}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Lista de conversaciones */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium">Conversaciones</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversaciones.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => seleccionarConversacion(conv)}
                  className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/[0.05] transition-colors ${
                    conversacionSeleccionada?.id === conv.id ? 'bg-white/[0.08]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {conv.user ? `${conv.user.nombre} ${conv.user.apellido}` : 'Lead Potencial'}
                        </span>
                        {conv.esLead && (
                          <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] text-xs rounded-full">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="text-white/50 text-sm">{conv.waId}</div>
                    </div>
                    <span className="text-white/40 text-xs">
                      {conv.ultimoMensajeAt && formatDatePY(conv.ultimoMensajeAt.split('T')[0])}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      conv.estado === 'ACTIVA' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {conv.estado}
                    </span>
                    <span className="text-white/40 text-xs">
                      {conv.totalMensajes} mensajes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden flex flex-col">
            {conversacionSeleccionada ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {conversacionSeleccionada.user 
                          ? `${conversacionSeleccionada.user.nombre} ${conversacionSeleccionada.user.apellido}`
                          : 'Lead Potencial'}
                      </span>
                      {conversacionSeleccionada.esLead && (
                        <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] text-xs rounded-full">
                          LEAD
                        </span>
                      )}
                    </div>
                    <div className="text-white/50 text-sm">{conversacionSeleccionada.waId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/40 text-xs">
                      Iniciada: {conversacionSeleccionada.iniciadaPor === 'USUARIO' ? 'Por cliente' : 'Por sistema'}
                    </div>
                    <div className="text-white/40 text-xs">
                      {conversacionSeleccionada.totalMensajes} mensajes
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="text-center text-white/50">Cargando mensajes...</div>
                  ) : (
                    mensajes.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.esNuestro ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            msg.esNuestro
                              ? 'bg-[#df2531] text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <div className="text-sm">{msg.contenido}</div>
                          <div className={`text-xs mt-1 ${msg.esNuestro ? 'text-white/70' : 'text-white/40'}`}>
                            {new Date(msg.enviadoAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                            {msg.esNuestro && (
                              <span className="ml-2">
                                {msg.estado === 'ENVIADO' && '✓'}
                                {msg.estado === 'ENTREGADO' && '✓✓'}
                                {msg.estado === 'LEIDO' && '✓✓✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={mensajesEndRef} />
                </div>

                {/* Input para responder */}
                <form onSubmit={enviarRespuesta} className="p-4 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#df2531]"
                    disabled={enviando}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoMensaje.trim()}
                    className="px-6 py-2 bg-[#df2531] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c41f2a] transition-colors"
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/40">
                Selecciona una conversación para ver los mensajes
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
