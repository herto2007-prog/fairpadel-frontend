import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Crown, Heart, MessageCircle, Trophy, ArrowUpCircle, Camera, Trash2, Send, X, Filter, RefreshCw, Newspaper } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { feedService, PublicacionFeed, ComentarioPublicacion } from '../../../services/feedService';
import { useAuthStore } from '../../../store/authStore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

type TipoFiltro = '' | 'FOTO' | 'RESULTADO' | 'LOGRO' | 'ASCENSO';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });
}

function MatchResult({ match }: { match: NonNullable<PublicacionFeed['match']> }) {
  if (!match.pareja1 || !match.pareja2) return null;
  const p1 = `${match.pareja1.jugador1.nombre[0]}. ${match.pareja1.jugador1.apellido} / ${match.pareja1.jugador2.nombre[0]}. ${match.pareja1.jugador2.apellido}`;
  const p2 = `${match.pareja2.jugador1.nombre[0]}. ${match.pareja2.jugador1.apellido} / ${match.pareja2.jugador2.nombre[0]}. ${match.pareja2.jugador2.apellido}`;
  const isP1Winner = match.parejaGanadora?.jugador1?.id === match.pareja1.jugador1.id;

  return (
    <div className="bg-dark-bg rounded-lg p-3 text-sm">
      <div className="text-xs text-dark-textSecondary mb-2">{match.ronda}</div>
      <div className={`flex justify-between items-center mb-1 ${isP1Winner ? 'text-green-400 font-medium' : 'text-dark-textSecondary'}`}>
        <span className="truncate flex-1">{p1}</span>
        <span className="ml-2 tabular-nums">
          {match.set1Pareja1}-{match.set1Pareja2} {match.set2Pareja1}-{match.set2Pareja2}
          {match.set3Pareja1 != null ? ` ${match.set3Pareja1}-${match.set3Pareja2}` : ''}
        </span>
      </div>
      <div className={`flex justify-between items-center ${!isP1Winner ? 'text-green-400 font-medium' : 'text-dark-textSecondary'}`}>
        <span className="truncate flex-1">{p2}</span>
        <span className="ml-2 tabular-nums">
          {match.set1Pareja2}-{match.set1Pareja1} {match.set2Pareja2}-{match.set2Pareja1}
          {match.set3Pareja2 != null ? ` ${match.set3Pareja2}-${match.set3Pareja1}` : ''}
        </span>
      </div>
    </div>
  );
}

/* ============ Create Post Form ============ */
function CreatePostForm({ onPost }: { onPost: (post: PublicacionFeed) => void }) {
  const { user } = useAuthStore();
  const [contenido, setContenido] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const text = contenido.trim();
    if (!text) return;

    setPosting(true);
    try {
      const newPost = await feedService.publicar(text);
      onPost({ ...newPost, likedByMe: false, likesCount: 0, comentariosCount: 0 });
      setContenido('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      toast.success('Publicado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al publicar');
    } finally {
      setPosting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContenido(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  if (!user) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-dark-border overflow-hidden shrink-0">
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-dark-textSecondary text-sm font-medium">
                {user.nombre[0]}{user.apellido[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={contenido}
              onChange={handleTextareaChange}
              placeholder="¿Qué hay de nuevo?"
              rows={2}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder-dark-textSecondary/50 focus:outline-none focus:border-primary-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-dark-textSecondary">
                {contenido.length > 0 && `${contenido.length}/500`}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={posting || !contenido.trim() || contenido.length > 500}
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============ Post Card ============ */
function PostCard({ post, onLike, onDelete, currentUserId }: {
  post: PublicacionFeed;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ComentarioPublicacion[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await feedService.obtenerComentarios(post.id);
      setComments(data);
    } catch { /* silent */ }
    setLoadingComments(false);
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await feedService.comentar(post.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      post.comentariosCount++;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
    setSubmitting(false);
  };

  const tipoIcon: Record<string, React.ReactNode> = {
    FOTO: <Camera className="h-3.5 w-3.5" />,
    RESULTADO: <Trophy className="h-3.5 w-3.5" />,
    LOGRO: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
    ASCENSO: <ArrowUpCircle className="h-3.5 w-3.5 text-green-400" />,
  };

  const tipoLabel: Record<string, string> = {
    FOTO: 'compartió una publicación',
    RESULTADO: 'ganó un partido',
    LOGRO: 'desbloqueó un logro',
    ASCENSO: 'ascendió de categoría',
  };

  const tipoBg: Record<string, string> = {
    FOTO: '',
    RESULTADO: 'border-l-2 border-l-primary-500/30',
    LOGRO: 'border-l-2 border-l-yellow-500/30',
    ASCENSO: 'border-l-2 border-l-green-500/30',
  };

  return (
    <Card className={tipoBg[post.tipo] || ''}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Link to={`/jugadores/${post.userId}`} className="shrink-0">
            <div className="h-10 w-10 rounded-full bg-dark-border overflow-hidden hover:ring-2 hover:ring-primary-500/50 transition">
              {post.user.fotoUrl ? (
                <img src={post.user.fotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-dark-textSecondary text-sm font-medium bg-dark-surface">
                  {post.user.nombre[0]}{post.user.apellido[0]}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link to={`/jugadores/${post.userId}`} className="font-medium text-dark-text text-sm truncate hover:text-primary-400 transition">
                {post.user.nombre} {post.user.apellido}
              </Link>
              {post.user.esPremium && <Crown className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-dark-textSecondary">
              {tipoIcon[post.tipo]}
              <span>{tipoLabel[post.tipo]}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          {post.userId === currentUserId && (
            <div className="relative">
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(post.id); setConfirmDelete(false); }}
                    className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 transition"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-dark-textSecondary hover:text-dark-text transition p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-dark-textSecondary hover:text-red-400 transition p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {post.contenido && (
          <p className="text-dark-text text-sm mb-3 whitespace-pre-wrap">{post.contenido}</p>
        )}

        {/* Photo */}
        {post.foto && (
          <div className="rounded-lg overflow-hidden mb-3">
            <img
              src={post.foto.urlImagen}
              alt={post.foto.descripcion || ''}
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Match result */}
        {post.match && <div className="mb-3"><MatchResult match={post.match} /></div>}

        {/* Tournament link */}
        {post.tournament && (
          <Link
            to={`/tournaments/${post.tournament.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary-400 hover:underline mb-2"
          >
            <Trophy className="h-3 w-3" />
            {post.tournament.nombre}
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-border">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-sm transition ${
              post.likedByMe ? 'text-red-400' : 'text-dark-textSecondary hover:text-red-400'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
            <span>{post.likesCount}</span>
          </button>
          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-sm text-dark-textSecondary hover:text-primary-400 transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comentariosCount}</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            {loadingComments ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-dark-textSecondary" />
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Link to={`/jugadores/${c.user.id}`} className="shrink-0">
                      <div className="h-7 w-7 rounded-full bg-dark-border overflow-hidden">
                        {c.user.fotoUrl ? (
                          <img src={c.user.fotoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-dark-textSecondary text-[10px] bg-dark-surface">
                            {c.user.nombre[0]}{c.user.apellido[0]}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <Link to={`/jugadores/${c.user.id}`} className="text-xs font-medium text-dark-text hover:text-primary-400 transition">
                          {c.user.nombre} {c.user.apellido}
                        </Link>
                        <span className="text-[10px] text-dark-textSecondary">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-dark-textSecondary">{c.contenido}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-dark-textSecondary text-center py-2">Sin comentarios aún</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text placeholder-dark-textSecondary/50 focus:outline-none focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button size="sm" onClick={handleComment} disabled={submitting || !commentText.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Main Page ============ */
export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PublicacionFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtro, setFiltro] = useState<TipoFiltro>('');
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async (pageNum = 1) => {
    try {
      const data = await feedService.obtenerFeed(pageNum);
      if (pageNum === 1) {
        setPosts(data);
      } else {
        setPosts((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadFeed(1);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
  };

  const handleNewPost = (newPost: PublicacionFeed) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleLike = async (postId: string) => {
    try {
      const { liked } = await feedService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: liked, likesCount: liked ? p.likesCount + 1 : p.likesCount - 1 }
            : p,
        ),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await feedService.eliminar(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Publicación eliminada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  // Client-side filter
  const filteredPosts = filtro ? posts.filter((p) => p.tipo === filtro) : posts;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-dark-textSecondary">Inicia sesión para ver las novedades.</p>
      </div>
    );
  }

  const filtros: { value: TipoFiltro; label: string; icon: React.ReactNode }[] = [
    { value: '', label: 'Todos', icon: <Newspaper className="h-3.5 w-3.5" /> },
    { value: 'FOTO', label: 'Fotos', icon: <Camera className="h-3.5 w-3.5" /> },
    { value: 'RESULTADO', label: 'Resultados', icon: <Trophy className="h-3.5 w-3.5" /> },
    { value: 'LOGRO', label: 'Logros', icon: <Trophy className="h-3.5 w-3.5" /> },
    { value: 'ASCENSO', label: 'Ascensos', icon: <ArrowUpCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-text">Novedades</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-dark-textSecondary hover:text-primary-400 transition rounded-lg hover:bg-dark-surface"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Create Post */}
      <CreatePostForm onPost={handleNewPost} />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-dark-textSecondary shrink-0" />
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              filtro === f.value
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-dark-textSecondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {f.icon}
            {f.label}
            {f.value && (
              <span className="text-[10px] opacity-70">
                {posts.filter((p) => p.tipo === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-3 text-dark-textSecondary/30" />
            {posts.length === 0 ? (
              <>
                <p className="text-dark-text font-medium mb-1">No hay novedades aún</p>
                <p className="text-sm text-dark-textSecondary">
                  Seguí a otros jugadores para ver sus resultados, logros y publicaciones aquí.
                </p>
              </>
            ) : (
              <>
                <p className="text-dark-text font-medium mb-1">Sin resultados</p>
                <p className="text-sm text-dark-textSecondary">
                  No hay publicaciones de tipo "{filtros.find(f => f.value === filtro)?.label}" en tu feed.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={user.id}
            />
          ))}
          {!filtro && hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
