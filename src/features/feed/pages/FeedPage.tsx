import { useState, useEffect, useCallback } from 'react';
import { Loader2, Crown, Heart, MessageCircle, Trophy, ArrowUpCircle, Camera, Trash2, Send } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { feedService, PublicacionFeed, ComentarioPublicacion } from '../../../services/feedService';
import { useAuthStore } from '../../../store/authStore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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

  const tipoIcon = {
    FOTO: <Camera className="h-3.5 w-3.5" />,
    RESULTADO: <Trophy className="h-3.5 w-3.5" />,
    LOGRO: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
    ASCENSO: <ArrowUpCircle className="h-3.5 w-3.5 text-green-400" />,
  };

  const tipoLabel = {
    FOTO: 'compartió una foto',
    RESULTADO: 'ganó un partido',
    LOGRO: 'desbloqueó un logro',
    ASCENSO: 'ascendió de categoría',
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-dark-border overflow-hidden shrink-0">
            {post.user.fotoUrl ? (
              <img src={post.user.fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-dark-textSecondary text-sm font-medium">
                {post.user.nombre[0]}{post.user.apellido[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-dark-text text-sm truncate">
                {post.user.nombre} {post.user.apellido}
              </span>
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
            <button onClick={() => onDelete(post.id)} className="text-dark-textSecondary hover:text-red-400 transition">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        {post.contenido && (
          <p className="text-dark-text text-sm mb-3">{post.contenido}</p>
        )}

        {/* Photo */}
        {post.foto && (
          <div className="rounded-lg overflow-hidden mb-3">
            <img
              src={post.foto.urlImagen}
              alt={post.foto.descripcion || ''}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Match result */}
        {post.match && <div className="mb-3"><MatchResult match={post.match} /></div>}

        {/* Tournament link */}
        {post.tournament && (
          <Link
            to={`/tournaments/${post.tournament.id}`}
            className="text-xs text-dark-accent hover:underline"
          >
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
            className="flex items-center gap-1.5 text-sm text-dark-textSecondary hover:text-dark-accent transition"
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
                    <div className="h-7 w-7 rounded-full bg-dark-border overflow-hidden shrink-0">
                      {c.user.fotoUrl ? (
                        <img src={c.user.fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-dark-textSecondary text-[10px]">
                          {c.user.nombre[0]}{c.user.apellido[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-dark-text">
                        {c.user.nombre} {c.user.apellido}
                      </span>
                      <p className="text-xs text-dark-textSecondary">{c.contenido}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-dark-textSecondary text-center py-2">Sin comentarios</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text"
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

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PublicacionFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
      // silent — premium check may fail for non-premium users
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
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

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-dark-textSecondary">Inicia sesión para ver el feed.</p>
      </div>
    );
  }

  if (!user.esPremium) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dark-text mb-2">Feed Premium</h2>
        <p className="text-dark-textSecondary mb-6">
          El feed social es exclusivo para usuarios Premium. Ve las fotos, resultados y logros de los jugadores que sigues.
        </p>
        <Link to="/premium">
          <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold">
            <Crown className="h-4 w-4 mr-2" />
            Activar Premium - $3/mes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-6">Novedades</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-dark-accent" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-dark-textSecondary mb-2">Tu feed está vacío</p>
            <p className="text-sm text-dark-textSecondary">
              Sigue a otros jugadores premium para ver sus fotos, resultados y logros aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={user.id}
            />
          ))}
          {hasMore && (
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
