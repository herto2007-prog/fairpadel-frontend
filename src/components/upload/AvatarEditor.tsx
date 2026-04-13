import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarEditor from 'react-avatar-editor';
import { 
  ZoomIn, ZoomOut, RotateCw, Check, X, 
  Sparkles, Crop, User, Move, Target
} from 'lucide-react';

interface AvatarEditorProps {
  image: string | File;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export const AvatarEditorModal = ({ image, onSave, onCancel }: AvatarEditorProps) => {
  const [scale, setScale] = useState(1.2);
  const [rotate, setRotate] = useState(0);
  const [borderRadius, setBorderRadius] = useState(50); // 50 = círculo perfecto
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const editorRef = useRef<AvatarEditor>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    }
  };

  const generatePreview = useCallback(() => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
      setShowPreview(true);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/95 backdrop-blur-xl" onClick={onCancel} />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-lg glass rounded-3xl border border-primary/20 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold">Personaliza tu avatar</h3>
              <p className="text-gray-400 text-sm">Haz única tu identidad</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-dark-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Editor Canvas */}
          <div className="relative flex justify-center mb-6">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <AvatarEditor
                ref={editorRef}
                image={image}
                width={280}
                height={280}
                border={20}
                borderRadius={borderRadius}
                color={[11, 14, 20, 0.8]} // RGBA
                scale={scale}
                rotate={rotate}
                position={position}
                onPositionChange={setPosition}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                className="rounded-2xl cursor-move"
              />
              
              {/* Decorative ring */}
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: '20s' }} />
              
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
            </motion.div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="bg-dark-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ZoomOut className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm font-medium">Zoom</span>
                <ZoomIn className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Rotation Control */}
            <div className="flex gap-3">
              <button
                onClick={() => setRotate(rotate - 90)}
                className="flex-1 py-3 bg-dark-100 hover:bg-dark-200 rounded-xl text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-sm">-90°</span>
              </button>
              <button
                onClick={() => setRotate(0)}
                className="flex-1 py-3 bg-dark-100 hover:bg-dark-200 rounded-xl text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Crop className="w-4 h-4" />
                <span className="text-sm">Reset</span>
              </button>
              <button
                onClick={() => setRotate(rotate + 90)}
                className="flex-1 py-3 bg-dark-100 hover:bg-dark-200 rounded-xl text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-sm">+90°</span>
              </button>
            </div>

            {/* Position Control - Horizontal */}
            <div className="bg-dark-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-medium">Posición Horizontal</span>
                </div>
                <button
                  onClick={() => setPosition(prev => ({ ...prev, x: 0.5 }))}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Target className="w-3 h-3" />
                  Centrar
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={position.x}
                onChange={(e) => setPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Izquierda</span>
                <span>Derecha</span>
              </div>
            </div>

            {/* Position Control - Vertical */}
            <div className="bg-dark-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-gray-400 rotate-90" />
                  <span className="text-gray-300 text-sm font-medium">Posición Vertical</span>
                </div>
                <button
                  onClick={() => setPosition(prev => ({ ...prev, y: 0.5 }))}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Target className="w-3 h-3" />
                  Centrar
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={position.y}
                onChange={(e) => setPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Arriba</span>
                <span>Abajo</span>
              </div>
            </div>

            {/* Drag Hint */}
            <div className={`text-center text-xs transition-colors ${isDragging ? 'text-primary' : 'text-gray-500'}`}>
              💡 También puedes arrastrar la imagen directamente con el mouse/touch
            </div>

            {/* Shape Toggle */}
            <div className="flex items-center justify-between bg-dark-100 rounded-xl p-4">
              <span className="text-gray-300 text-sm font-medium">Forma</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setBorderRadius(50)}
                  className={`p-2 rounded-lg transition-colors ${
                    borderRadius === 50 ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setBorderRadius(0)}
                  className={`p-2 rounded-lg transition-colors ${
                    borderRadius === 0 ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="w-5 h-5 border-2 border-current rounded-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={generatePreview}
            className="w-full mt-4 py-2 text-primary text-sm hover:underline"
          >
            Ver previsualización
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Aplicar cambios
          </motion.button>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && previewUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-dark/95 flex items-center justify-center p-8"
            >
              <div className="text-center">
                <h4 className="text-white font-bold mb-4">Vista previa</h4>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-primary/30"
                />
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
