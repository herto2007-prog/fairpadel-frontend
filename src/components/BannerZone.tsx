import { useState, useEffect, useRef, useCallback } from 'react';
import { publicidadService, type BannerPublico } from '@/services/publicidadService';

// Aspect ratios per zone (height/width) for placeholder sizing
const ZONE_ASPECT: Record<string, string> = {
  HOME_HERO: 'aspect-[1200/200]',      // 1200x200
  HOME_MEDIO: 'aspect-[1200/150]',     // 1200x150
  ENTRE_TORNEOS: 'aspect-[1200/150]',  // 1200x150
  HEADER: 'aspect-[1200/90]',          // 1200x90
  FOOTER: 'aspect-[1200/90]',          // 1200x90
  TORNEO_DETALLE: 'aspect-[1200/100]', // 1200x100
  SIDEBAR: '',                          // libre
};

interface BannerZoneProps {
  zona: string;
  className?: string;
  layout?: 'single' | 'carousel';
  torneoId?: string;
}

const BannerZone: React.FC<BannerZoneProps> = ({ zona, className = '', layout = 'single', torneoId }) => {
  const [banners, setBanners] = useState<BannerPublico[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);

  // Fetch banners
  useEffect(() => {
    publicidadService.obtenerBannersActivos(zona, torneoId)
      .then((data) => {
        setBanners(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [zona, torneoId]);

  // Carousel rotation
  useEffect(() => {
    if (layout !== 'carousel' || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [layout, banners.length]);

  // Register impressions via IntersectionObserver
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && !impressionSent.current && banners.length > 0) {
      impressionSent.current = true;
      const ids = banners.map((b) => b.id);
      publicidadService.registrarImpresion(ids).catch(() => {});
    }
  }, [banners]);

  useEffect(() => {
    if (!containerRef.current || banners.length === 0) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [handleIntersection, banners.length]);

  // Handle click
  const handleClick = (banner: BannerPublico) => {
    publicidadService.registrarClick(banner.id).catch(() => {});
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if no banners
  if (loaded && banners.length === 0) return null;
  if (!loaded) return null;

  const aspectClass = ZONE_ASPECT[zona] || '';

  // Single banner
  if (layout === 'single' || banners.length === 1) {
    const banner = banners[0];
    if (!banner) return null;

    return (
      <div ref={containerRef} className={`relative overflow-hidden rounded-lg ${className}`}>
        <button
          onClick={() => handleClick(banner)}
          className={`w-full block cursor-pointer group ${aspectClass}`}
          title={banner.anunciante ? `Publicidad: ${banner.anunciante}` : 'Publicidad'}
        >
          <img
            src={banner.imagenUrl}
            alt={banner.titulo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </button>
        <span className="absolute top-1 right-1 bg-black/50 text-white/60 text-[9px] px-1.5 py-0.5 rounded">
          AD
        </span>
      </div>
    );
  }

  // Carousel
  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-lg ${className}`}>
      <div className={`relative ${aspectClass}`}>
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
          >
            <button
              onClick={() => handleClick(banner)}
              className="w-full h-full block cursor-pointer group"
              title={banner.anunciante ? `Publicidad: ${banner.anunciante}` : 'Publicidad'}
            >
              <img
                src={banner.imagenUrl}
                alt={banner.titulo}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Carousel dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      <span className="absolute top-1 right-1 bg-black/50 text-white/60 text-[9px] px-1.5 py-0.5 rounded">
        AD
      </span>
    </div>
  );
};

export default BannerZone;
