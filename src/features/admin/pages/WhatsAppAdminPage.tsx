import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '../../../components/layout';
import { api } from '../../../services/api';
import { formatDatePY } from '../../../utils/date';
import { ArrowLeft, MessageCircle, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [mostrarChat, setMostrarChat] = useState(false); // Para móvil
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
    setMostrarChat(true); // En móvil, mostrar el chat
    cargarMensajes(conv.id);
  };

  const volverALista = () => {
    setMostrarChat(false);
    setConversacionSeleccionada(null);
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
      await cargarMensajes(conversacionSeleccionada.id);
      await cargarConversaciones();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error enviando mensaje');
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  return (
    <PageLayout showHeader variant="full" maxWidth="full" padding="none">
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Breadcrumb / Volver */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Link 
            to="/admin" 
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <ChevronLeft className="w-4 h-4 text-white/40 rotate-180" />
          <span className="text-white font-medium text-sm">WhatsApp</span>
        </div>
        {/* Estadísticas - Grid responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 px-4 lg:px-8 max-w-[1800px] mx-auto w-full">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2 sm:p-4">
            <div className="text-white/60 text-xs sm:text-sm">Total Conversaciones</div>
            <div className="text-lg sm:text-2xl font-bold text-white">{estadisticas.totalConversaciones}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2 sm:p-4">
            <div className="text-white/60 text-xs sm:text-sm">Leads Potenciales</div>
            <div className="text-lg sm:text-2xl font-bold text-[#df2531]">{estadisticas.leads}</div>
            <div className="text-[10px] sm:text-xs text-white/40">{estadisticas.porcentajeLeads}% del total</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2 sm:p-4">
            <div className="text-white/60 text-xs sm:text-sm">Mensajes Recibidos</div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-400">{estadisticas.mensajesEntrantes}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2 sm:p-4">
            <div className="text-white/60 text-xs sm:text-sm">Mensajes Enviados</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{estadisticas.mensajesSalientes}</div>
          </div>
        </div>

        {/* Layout principal - Estilo WhatsApp Web */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Lista de conversaciones - Sidebar fijo */}
          <div className={`${mostrarChat ? 'hidden' : 'flex'} lg:flex flex-col h-full bg-[#111b21] border-r border-white/10 w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:rounded-none rounded-lg`}>
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium text-sm sm:text-base">Conversaciones</h3>
              <span className="ml-auto text-xs text-white/50">{conversaciones.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversaciones.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-sm">
                  No hay conversaciones
                </div>
              ) : (
                conversaciones.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => seleccionarConversacion(conv)}
                    className={`w-full p-3 sm:p-4 text-left border-b border-white/5 hover:bg-white/[0.05] transition-colors ${
                      conversacionSeleccionada?.id === conv.id ? 'bg-white/[0.08]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white font-medium text-sm truncate">
                            {conv.user ? `${conv.user.nombre} ${conv.user.apellido}` : 'Lead Potencial'}
                          </span>
                          {conv.esLead && (
                            <span className="px-1.5 py-0.5 bg-[#df2531]/20 text-[#df2531] text-[10px] rounded-full shrink-0">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-white/50 text-xs truncate">{conv.waId}</div>
                      </div>
                      <span className="text-white/40 text-[10px] shrink-0">
                        {conv.ultimoMensajeAt && formatDatePY(conv.ultimoMensajeAt.split('T')[0])}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        conv.estado === 'ACTIVA' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {conv.estado}
                      </span>
                      <span className="text-white/40 text-[10px]">
                        {conv.totalMensajes} mensajes
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat - Ocupa todo el espacio restante */}
          <div className={`${mostrarChat ? 'flex' : 'hidden'} lg:flex flex-col flex-1 h-full bg-[#0b141a] lg:rounded-none rounded-lg`}>
            {conversacionSeleccionada ? (
              <>
                {/* Header del chat - Responsive */}
                <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-3">
                  {/* Botón volver en móvil */}
                  <button 
                    onClick={volverALista}
                    className="lg:hidden flex items-center gap-1 text-white/70 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Volver</span>
                  </button>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white font-medium text-sm sm:text-base truncate">
                        {conversacionSeleccionada.user 
                          ? `${conversacionSeleccionada.user.nombre} ${conversacionSeleccionada.user.apellido}`
                          : 'Lead Potencial'}
                      </span>
                      {conversacionSeleccionada.esLead && (
                        <span className="px-1.5 py-0.5 bg-[#df2531]/20 text-[#df2531] text-[10px] rounded-full shrink-0">
                          LEAD
                        </span>
                      )}
                    </div>
                    <div className="text-white/50 text-xs truncate">{conversacionSeleccionada.waId}</div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-white/40 text-xs">
                      {conversacionSeleccionada.iniciadaPor === 'USUARIO' ? 'Por cliente' : 'Por sistema'}
                    </div>
                    <div className="text-white/40 text-[10px]">
                      {conversacionSeleccionada.totalMensajes} mensajes
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {loading ? (
                    <div className="text-center text-white/50 text-sm py-8">Cargando mensajes...</div>
                  ) : mensajes.length === 0 ? (
                    <div className="text-center text-white/40 text-sm py-8">No hay mensajes</div>
                  ) : (
                    mensajes.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.esNuestro ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-lg ${
                            msg.esNuestro
                              ? 'bg-[#df2531] text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <div className="text-sm break-words">{msg.contenido}</div>
                          <div className={`text-[10px] sm:text-xs mt-1 ${msg.esNuestro ? 'text-white/70' : 'text-white/40'}`}>
                            {new Date(msg.enviadoAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                            {msg.esNuestro && (
                              <span className="ml-1 sm:ml-2">
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

                {/* Input para responder - Responsive */}
                <form onSubmit={enviarRespuesta} className="p-3 sm:p-4 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#df2531]"
                    disabled={enviando}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoMensaje.trim()}
                    className="px-4 sm:px-6 py-2 bg-[#df2531] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c41f2a] transition-colors shrink-0"
                  >
                    {enviando ? '...' : 'Enviar'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-4">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm text-center">Selecciona una conversación para ver los mensajes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
