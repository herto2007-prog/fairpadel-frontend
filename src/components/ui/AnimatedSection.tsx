import { type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

type AnimationType = 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

const hiddenStyles: Record<AnimationType, string> = {
  'fade-up': 'opacity-0 translate-y-8',
  'fade-in': 'opacity-0',
  'scale-in': 'opacity-0 scale-[0.85]',
  'slide-left': 'opacity-0 -translate-x-8',
  'slide-right': 'opacity-0 translate-x-8',
};

const visibleStyles: Record<AnimationType, string> = {
  'fade-up': 'animate-fade-up',
  'fade-in': 'animate-fade-in',
  'scale-in': 'animate-scale-in',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
};

export default function AnimatedSection({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
  threshold = 0.15,
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ threshold });

  return (
    <div
      ref={ref}
      className={`transition-none ${isInView ? visibleStyles[animation] : hiddenStyles[animation]} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
