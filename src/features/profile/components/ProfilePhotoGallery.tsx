import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import fotosService from '@/services/fotosService';
import type { FotoComentario } from '@/services/fotosService';
import type { FotoResumen } from '@/types';
import {
  Camera,
  Heart,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Loader2,
  Send,
  Trash2,
  Crown,
  ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  fotos: FotoResumen[];
  isOwnProfile: boolean;
  userId?: string;
  onPhotosChange?: () => void;
}

const ProfilePhotoGallery = ({ fotos, isOwnProfile, userId, onPhotosChange }: Props) => {
  const { user, isAuthenticated } = useAuthStore();

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo count state
  const [photoCount, setPhotoCount] = useState<{ count: number; limit: number | null; esPremium: boolean } | null>(null);

  // Lightbox interaction state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<FotoComentario[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  // Load photo count for own profile
  useEffect(() => {
    if (isOwnProfile && isAuthenticated) {
      fotosService.contarMisFotos().then(setPhotoCount).catch(() => {});
    }
  }, [isOwnProfile, isAuthenticated, fotos.length]);

  // ═══════════════════════════════════════════
  // UPLOAD LOGIC
  // ═══════════════════════════════════════════

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar 10MB');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadModalOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await fotosService.subirFoto(uploadFile, uploadDesc || undefined);
      toast.success('Foto subida correctamente');
      closeUploadModal();
      onPhotosChange?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al subir la foto';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadDesc('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canUpload = () => {
    if (!photoCount) return true;
    if (photoCount.esPremium) return true;
    return photoCount.count < (photoCount.limit || 6);
  };

  // ═══════════════════════════════════════════
  // LIGHTBOX LOGIC
  // ═══════════════════════════════════════════

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowComments(false);
    setNewComment('');
    loadLightboxData(fotos[index].id);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setComments([]);
    setShowComments(false);
  };

  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < fotos.length - 1) {
      const nextIdx = lightboxIndex + 1;
      setLightboxIndex(nextIdx);
      setShowComments(false);
      setNewComment('');
      loadLightboxData(fotos[nextIdx].id);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      const prevIdx = lightboxIndex - 1;
      setLightboxIndex(prevIdx);
      setShowComments(false);
      setNewComment('');
      loadLightboxData(fotos[prevIdx].id);
    }
  };

  const loadLightboxData = async (fotoId: string) => {
    if (isAuthenticated) {
      try {
        const likes = await fotosService.obtenerLikes(fotoId);
        setLiked(likes.some((l) => l.user.id === user?.id));
        setLikesCount(likes.length);
      } catch {
        setLiked(false);
      }
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || lightboxIndex === null) return;
    const foto = fotos[lightboxIndex];
    try {
      const res = await fotosService.darLike(foto.id);
      if (res.message.includes('agregado')) {
        setLiked(true);
        setLikesCount((c) => c + 1);
      } else {
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      }
    } catch {
      toast.error('Error');
    }
  };

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    if (lightboxIndex === null) return;
    setShowComments(true);
    setLoadingComments(true);
    try {
      const data = await fotosService.obtenerComentarios(fotos[lightboxIndex].id);
      setComments(data);
    } catch {
      toast.error('Error cargando comentarios');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || lightboxIndex === null) return;
    setSendingComment(true);
    try {
      const c = await fotosService.comentar(fotos[lightboxIndex].id, newComment.trim());
      setComments((prev) => [
        { ...c, user: { id: user!.id, nombre: user!.nombre, apellido: user!.apellido, fotoUrl: user?.fotoUrl || null } },
        ...prev,
      ]);
      setNewComment('');
    } catch {
      toast.error('Error al comentar');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (lightboxIndex === null) return;
    const foto = fotos[lightboxIndex];
    if (!confirm('¿Eliminar esta foto?')) return;
    setDeletingPhoto(true);
    try {
      await fotosService.eliminarFoto(foto.id);
      toast.success('Foto eliminada');
      closeLightbox();
      onPhotosChange?.();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingPhoto(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, fotos.length]);

  const currentFoto = lightboxIndex !== null ? fotos[lightboxIndex] : null;
  const isOwnPhoto = currentFoto && user?.id === userId;

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Fotos</h3>
              {fotos.length > 0 && (
                <span className="text-xs text-light-tertiary">({fotos.length})</span>
              )}
            </div>

            {/* Upload button + counter */}
            {isOwnProfile && isAuthenticated && (
              <div className="flex items-center gap-3">
                {photoCount && !photoCount.esPremium && (
                  <span className="text-xs text-light-muted">
                    {photoCount.count}/{photoCount.limit} fotos
                  </span>
                )}
                {photoCount?.esPremium && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Ilimitadas
                  </span>
                )}

                {canUpload() ? (
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 text-primary-400 rounded-lg cursor-pointer hover:bg-primary-500/20 transition-colors text-sm font-medium">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Subir foto</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <Link
                    to="/premium"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    Fotos ilimitadas
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Grid */}
          {fotos.length === 0 ? (
            <div className="text-center py-8">
              {isOwnProfile ? (
                <label className="cursor-pointer inline-block">
                  <div className="flex flex-col items-center">
                    <ImagePlus className="h-12 w-12 text-light-tertiary mb-3 opacity-50" />
                    <p className="text-light-tertiary text-sm mb-2">
                      ¡Subi tu primera foto!
                    </p>
                    <span className="text-xs text-primary-400 hover:text-primary-300">
                      Elegir imagen
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <>
                  <Camera className="h-10 w-10 text-light-tertiary mx-auto mb-3 opacity-50" />
                  <p className="text-light-tertiary text-sm">Sin fotos aún</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotos.map((foto, index) => (
                <button
                  key={foto.id}
                  onClick={() => openLightbox(index)}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <img
                    src={foto.urlThumbnail || foto.urlImagen}
                    alt={foto.descripcion || 'Foto'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <span className="flex items-center gap-1 text-white text-xs">
                      <Heart className="h-3.5 w-3.5" />
                      {foto.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-white text-xs">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {foto.comentariosCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/* UPLOAD MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {uploadModalOpen && uploadPreview && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div
            className="bg-dark-card rounded-xl border border-dark-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary-400" />
                Subir foto
              </h3>
              <button onClick={closeUploadModal} className="text-light-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-lg overflow-hidden mb-4 max-h-72 flex items-center justify-center bg-dark-bg">
                <img
                  src={uploadPreview}
                  alt="Preview"
                  className="max-h-72 max-w-full object-contain"
                />
              </div>

              <textarea
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Descripcion (opcional)..."
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder:text-light-muted text-sm resize-none focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-light-muted mt-1 text-right">{uploadDesc.length}/500</p>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-dark-border">
              <button
                onClick={closeUploadModal}
                className="flex-1 py-2 px-4 bg-dark-bg border border-dark-border rounded-lg text-light-secondary hover:text-light-text transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* LIGHTBOX WITH SOCIAL */}
      {/* ═══════════════════════════════════════════ */}
      {lightboxIndex !== null && currentFoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="flex flex-1 flex-col lg:flex-row">
            {/* Image area */}
            <div className="flex-1 flex items-center justify-center relative min-h-0">
              {lightboxIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 sm:left-4 text-white/70 hover:text-white z-10"
                >
                  <ChevronLeft className="h-8 sm:h-10 w-8 sm:w-10" />
                </button>
              )}

              {lightboxIndex < fotos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 sm:right-4 text-white/70 hover:text-white z-10 lg:right-4"
                >
                  <ChevronRight className="h-8 sm:h-10 w-8 sm:w-10" />
                </button>
              )}

              <img
                src={currentFoto.urlImagen}
                alt={currentFoto.descripcion || 'Foto'}
                className="max-h-[55vh] lg:max-h-[85vh] max-w-[90vw] lg:max-w-[65vw] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Sidebar */}
            <div
              className="lg:w-80 xl:w-96 bg-dark-card border-t lg:border-t-0 lg:border-l border-dark-border flex flex-col max-h-[40vh] lg:max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {currentFoto.descripcion && (
                <div className="px-4 py-3 border-b border-dark-border">
                  <p className="text-light-text text-sm">{currentFoto.descripcion}</p>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-dark-border">
                {isAuthenticated ? (
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      liked ? 'text-red-400' : 'text-light-secondary hover:text-red-400'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                    {likesCount}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-light-secondary">
                    <Heart className="h-5 w-5" />
                    {currentFoto.likesCount}
                  </span>
                )}

                <button
                  onClick={toggleComments}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    showComments ? 'text-primary-400' : 'text-light-secondary hover:text-primary-400'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  {currentFoto.comentariosCount}
                </button>

                {isOwnPhoto && (
                  <button
                    onClick={handleDeletePhoto}
                    disabled={deletingPhoto}
                    className="ml-auto text-light-muted hover:text-red-400 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Comments */}
              {showComments && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                    {loadingComments ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-light-muted mx-auto" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-light-muted text-sm text-center py-4">
                        Sin comentarios aún
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {c.user.fotoUrl ? (
                              <img src={c.user.fotoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-primary-400 text-xs font-bold">
                                {c.user.nombre.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-semibold text-light-text">
                                {c.user.nombre} {c.user.apellido}
                              </span>{' '}
                              <span className="text-light-secondary">{c.contenido}</span>
                            </p>
                            <p className="text-[10px] text-light-muted mt-0.5">
                              {new Date(c.createdAt).toLocaleDateString('es-PY')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {isAuthenticated && (
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-dark-border">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                        placeholder="Escribi un comentario..."
                        maxLength={500}
                        className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder:text-light-muted text-sm focus:outline-none focus:border-primary-500"
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || sendingComment}
                        className="p-2 text-primary-400 hover:text-primary-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {sendingComment ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePhotoGallery;
