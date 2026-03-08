import { motion } from 'framer-motion';
import { Check, X, Trophy, AlertTriangle, Camera, User } from 'lucide-react';

interface ProfilePhotoGuidelinesProps {
  isVisible: boolean;
}

export const ProfilePhotoGuidelines = ({ isVisible }: ProfilePhotoGuidelinesProps) => {
  if (!isVisible) return null;

  const goodExamples = [
    { icon: User, label: 'Rostro frontal', desc: 'Claro y centrado' },
    { icon: Camera, label: 'Buena iluminación', desc: 'Sin sombras oscuras' },
    { icon: Trophy, label: 'Fondo neutro', desc: 'Sin distracciones' },
  ];

  const badExamples = [
    { icon: X, label: 'No grupos', desc: 'Solo una persona' },
    { icon: X, label: 'No paisajes', desc: 'Debe ser tu rostro' },
    { icon: X, label: 'No objetos', desc: 'Sin mascotas/objetos' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 p-4 glass rounded-xl border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">¿Por qué importa tu foto?</h4>
          <p className="text-gray-400 text-xs mt-1">
            Tu foto aparecerá en brackets de torneos, rankings y noticias. 
            Los organizadores y rivales necesitan identificarte fácilmente.
          </p>
        </div>
      </div>

      {/* Ejemplos Correctos */}
      <div className="mb-4">
        <p className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1">
          <Check className="w-3 h-3" />
          FOTOS RECOMENDADAS
        </p>
        <div className="grid grid-cols-3 gap-2">
          {goodExamples.map((example, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center"
            >
              <example.icon className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">{example.label}</p>
              <p className="text-green-400/70 text-[10px]">{example.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ejemplos Incorrectos */}
      <div className="mb-4">
        <p className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
          <X className="w-3 h-3" />
          EVITAR
        </p>
        <div className="grid grid-cols-3 gap-2">
          {badExamples.map((example, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center"
            >
              <example.icon className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">{example.label}</p>
              <p className="text-red-400/70 text-[10px]">{example.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advertencia */}
      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-400/90 text-xs">
          <strong>Importante:</strong> Las fotos serán revisadas por moderadores. 
          Fotos inapropiadas o sin rostro visible podrían retrasar tu verificación 
          e inscripción en torneos.
        </p>
      </div>

      {/* Incentivo */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-primary font-medium">
          Perfiles completos tienen prioridad en inscripciones
        </span>
      </div>
    </motion.div>
  );
};
