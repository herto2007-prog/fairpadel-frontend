import { useEffect } from 'react';

/**
 * Hook para agregar meta tag noindex en páginas privadas
 * Evita que Google indexe páginas de login, dashboard, admin, etc.
 */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    
    meta.content = 'noindex, nofollow';
    
    return () => {
      if (meta) {
        meta.content = 'index, follow';
      }
    };
  }, []);
}
