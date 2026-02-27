import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/services/socialService';
import { Card, CardContent, Button, Loading } from '@/components/ui';
import type { MensajePrivado, Conversacion } from '@/types';
import toast from 'react-hot-toast';
import {
  MessageCircle, Send, ArrowLeft, Trash2, User,
  Inbox, Crown, Check, CheckCheck,
} from 'lucide-react';

// ══════ Helpers ══════

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
};

const formatFullTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ══════ Avatar ══════

const Avatar = ({ nombre, apellido, fotoUrl, size = 'md' }: {
  nombre: string; apellido: string; fotoUrl?: string | null; size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return fotoUrl ? (
    <img src={fotoUrl} alt="" className={`${sizes[size]} rounded-full object-cover`} />
  ) : (
    <div className={`${sizes[size]} rounded-full bg-dark-surface flex items-center justify-center text-light-muted font-bold`}>
      {nombre?.[0]}{apellido?.[0]}
    </div>
  );
};

// ══════ Conversations List ══════

const ConversacionesList = () => {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadConversaciones = useCallback(async () => {
    try {
      const data = await socialService.getConversaciones();
      setConversaciones(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando conversaciones..." />
      </div>
    );
  }

  if (conversaciones.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <Inbox className="h-12 w-12 text-light-muted mx-auto mb-4" />
          <p className="text-light-secondary text-lg font-medium mb-2">No tenés conversaciones aún</p>
          <p className="text-light-muted text-sm mb-6">
            Buscá jugadores y enviales un mensaje desde su perfil
          </p>
          <Link to="/jugadores">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" /> Buscar Jugadores
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {conversaciones.map((conv) => {
        const u = conv.usuario;
        const lastMsg = conv.ultimoMensaje;
        const hasUnread = conv.noLeidos > 0;

        return (
          <button
            key={u.id}
            onClick={() => navigate(`/mensajes/${u.id}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
              ${hasUnread ? 'bg-primary-500/10 hover:bg-primary-500/15' : 'hover:bg-dark-hover'}`}
          >
            <div className="relative flex-shrink-0">
              <Avatar nombre={u.nombre} apellido={u.apellido} fotoUrl={u.fotoUrl} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium truncate ${hasUnread ? 'text-light-text' : 'text-light-secondary'}`}>
                  {u.nombre} {u.apellido}
                </span>
                {u.esPremium && <Crown className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
              </div>
              <p className={`text-sm truncate ${hasUnread ? 'text-light-text font-medium' : 'text-light-muted'}`}>
                {lastMsg.contenido}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-light-muted">{formatTime(lastMsg.createdAt)}</span>
              {hasUnread && (
                <span className="bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {conv.noLeidos > 99 ? '99+' : conv.noLeidos}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ══════ Chat View ══════

const ChatView = ({ otroUserId }: { otroUserId: string }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState<MensajePrivado[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [texto, setTexto] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [otroUsuario, setOtroUsuario] = useState<{ id: string; nombre: string; apellido: string; fotoUrl?: string; esPremium?: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadMensajes = useCallback(async (isInitial = false) => {
    try {
      const data = await socialService.getMensajes(otroUserId);
      setMensajes(data);

      // Extract other user info from first message
      if (data.length > 0 && !otroUsuario) {
        const first = data[0];
        const otro = first.remitenteId === otroUserId ? first.remitente : first.destinatario;
        if (otro) setOtroUsuario(otro);
      }

      // Auto-scroll on initial load or when new messages arrive
      if (isInitial || data.length > prevCountRef.current) {
        setTimeout(() => scrollToBottom(isInitial ? 'instant' : 'smooth'), 50);
      }
      prevCountRef.current = data.length;
    } catch {
      if (isInitial) toast.error('Error cargando mensajes');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [otroUserId, otroUsuario, scrollToBottom]);

  // Initial load + mark as read
  useEffect(() => {
    loadMensajes(true);
    socialService.marcarConversacionComoLeida(otroUserId).catch(() => {});
  }, [otroUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling every 5 seconds
  useEffect(() => {
    const id = setInterval(() => loadMensajes(false), 5000);
    return () => clearInterval(id);
  }, [loadMensajes]);

  const handleSend = async () => {
    const contenido = texto.trim();
    if (!contenido || sending) return;

    setSending(true);
    try {
      const nuevo = await socialService.enviarMensaje({ destinatarioId: otroUserId, contenido });
      setMensajes((prev) => [...prev, nuevo]);
      setTexto('');
      prevCountRef.current++;
      setTimeout(() => scrollToBottom('smooth'), 50);
      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (mensajeId: string) => {
    setDeletingId(mensajeId);
    try {
      await socialService.eliminarMensaje(mensajeId);
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeId));
      prevCountRef.current--;
      toast.success('Mensaje eliminado');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTexto(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: MensajePrivado[] }[] = [];
  let currentDate = '';
  for (const msg of mensajes) {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando chat..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 border-b border-dark-border bg-dark-card rounded-t-lg">
        <button onClick={() => navigate('/mensajes')} className="p-1 hover:bg-dark-hover rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-light-secondary" />
        </button>
        {otroUsuario && (
          <Link to={`/jugadores/${otroUsuario.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar nombre={otroUsuario.nombre} apellido={otroUsuario.apellido} fotoUrl={otroUsuario.fotoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-light-text">
                  {otroUsuario.nombre} {otroUsuario.apellido}
                </span>
                {otroUsuario.esPremium && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
              </div>
              <span className="text-xs text-light-muted">Ver perfil</span>
            </div>
          </Link>
        )}
      </div>

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-light-muted">
            <MessageCircle className="h-10 w-10 mb-3 opacity-50" />
            <p>Enviá el primer mensaje</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-dark-border" />
                <span className="text-xs text-light-muted px-2">{formatDateSeparator(group.date)}</span>
                <div className="flex-1 h-px bg-dark-border" />
              </div>

              {/* Messages */}
              <div className="space-y-1.5">
                {group.messages.map((msg) => {
                  const isMine = msg.remitenteId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`relative max-w-[75%] px-3 py-2 rounded-2xl ${
                        isMine
                          ? 'bg-primary-500/90 text-white rounded-br-md'
                          : 'bg-dark-surface text-light-text rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.contenido}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-light-muted'}`}>
                            {formatFullTime(msg.createdAt)}
                          </span>
                          {isMine && (
                            msg.leido
                              ? <CheckCheck className="h-3 w-3 text-white/60" />
                              : <Check className="h-3 w-3 text-white/40" />
                          )}
                        </div>

                        {/* Delete button (own messages only) */}
                        {isMine && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            disabled={deletingId === msg.id}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-dark-hover rounded"
                            title="Eliminar mensaje"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-light-muted hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-dark-border bg-dark-card rounded-b-lg">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            maxLength={1000}
            rows={1}
            className="flex-1 bg-dark-surface text-light-text rounded-xl px-4 py-2.5 text-sm resize-none
              border border-dark-border focus:border-primary-500 focus:outline-none
              placeholder:text-light-muted overflow-hidden"
            style={{ maxHeight: '120px' }}
          />
          <Button
            onClick={handleSend}
            disabled={!texto.trim() || sending}
            loading={sending}
            size="sm"
            className="rounded-xl px-3 h-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[10px] text-light-muted">Shift+Enter para nueva línea</span>
          <span className={`text-[10px] ${texto.length > 900 ? 'text-red-400' : 'text-light-muted'}`}>
            {texto.length}/1000
          </span>
        </div>
      </div>
    </div>
  );
};

// ══════ Main Page ══════

const MensajesPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-light-secondary">Iniciá sesión para ver tus mensajes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Page Header */}
      {!userId && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-light-text flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary-400" />
            Mensajes
          </h1>
          <p className="text-light-secondary text-sm mt-1">Tus conversaciones privadas</p>
        </div>
      )}

      {userId ? <ChatView otroUserId={userId} /> : <ConversacionesList />}
    </div>
  );
};

export default MensajesPage;
