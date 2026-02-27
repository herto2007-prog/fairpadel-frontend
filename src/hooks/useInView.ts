import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView(options: UseInViewOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        setIsInView(true);
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    },
    [triggerOnce],
  );

  useEffect(() => {
    if (!ref.current) return;
    if (triggerOnce && isInView) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [handleIntersection, threshold, rootMargin, triggerOnce, isInView]);

  return { ref, isInView };
}
