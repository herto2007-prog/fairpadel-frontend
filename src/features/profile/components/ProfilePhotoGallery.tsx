import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import type { FotoResumen } from '@/types';
import { Camera, Heart, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  fotos: FotoResumen[];
  isOwnProfile: boolean;
}

const ProfilePhotoGallery = ({ fotos, isOwnProfile }: Props) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < fotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Fotos</h3>
              {fotos.length > 0 && (
                <span className="text-xs text-light-tertiary">({fotos.length})</span>
              )}
            </div>
          </div>

          {fotos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-10 w-10 text-light-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-light-tertiary text-sm">
                {isOwnProfile ? 'Aún no tenés fotos. ¡Subí tu primera foto!' : 'Sin fotos aún'}
              </p>
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
                  {/* Overlay on hover */}
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

      {/* Lightbox */}
      {lightboxIndex !== null && fotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 text-white/70 hover:text-white z-10"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}
          {lightboxIndex < fotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 text-white/70 hover:text-white z-10"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}

          {/* Image */}
          <img
            src={fotos[lightboxIndex].urlImagen}
            alt={fotos[lightboxIndex].descripcion || 'Foto'}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          {fotos[lightboxIndex].descripcion && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white text-sm">{fotos[lightboxIndex].descripcion}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProfilePhotoGallery;
