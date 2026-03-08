import { motion } from 'framer-motion';

interface BackgroundEffectsProps {
  variant?: 'default' | 'subtle' | 'intense';
  showGrid?: boolean;
}

export const BackgroundEffects = ({ 
  variant = 'default',
  showGrid = true 
}: BackgroundEffectsProps) => {
  const intensity = {
    subtle: { opacity: 0.1, scale: 0.8 },
    default: { opacity: 0.2, scale: 1 },
    intense: { opacity: 0.3, scale: 1.2 },
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [intensity[variant].opacity, intensity[variant].opacity * 1.5, intensity[variant].opacity],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/30 rounded-full blur-[150px]"
        style={{ transform: `scale(${intensity[variant].scale})` }}
      />
      
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [intensity[variant].opacity * 0.8, intensity[variant].opacity, intensity[variant].opacity * 0.8],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/20 rounded-full blur-[180px]"
        style={{ transform: `scale(${intensity[variant].scale})` }}
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 50, 0],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"
      />

      {/* Grid Pattern */}
      {showGrid && (
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(223, 37, 49, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(223, 37, 49, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};
