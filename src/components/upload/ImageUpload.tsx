import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Check, AlertCircle,
  Camera, Trash2, RefreshCw
} from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => void;
  defaultImage?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'cover';
  maxSizeMB?: number;
  folder?: string;
  label?: string;
  description?: string;
}

export const ImageUpload = ({
  onUpload,
  onRemove,
  defaultImage,
  aspectRatio = 'square',
  maxSizeMB = 5,
  label = 'Subir imagen',
  description = 'Arrastra una imagen o haz clic para seleccionar',
}: ImageUploadProps) => {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[16/9]',
    cover: 'aspect-[4/3]',
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten imágenes (JPEG, PNG, WEBP)');
      return false;
    }
    
    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`El archivo excede ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Subir
    setIsUploading(true);
    setProgress(0);
    
    // Simular progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const url = await onUpload(file);
      setImage(url);
      setProgress(100);
    } catch (err) {
      setError('Error al subir la imagen');
      setImage(null);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    setImage(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onRemove?.();
  };

  const handleRetry = () => {
    setError(null);
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {label}
        </label>
      )}

      <AnimatePresence mode="wait">
        {!image ? (
          /* Drop Zone */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative cursor-pointer group overflow-hidden
              ${aspectRatioClasses[aspectRatio]}
              rounded-2xl border-2 border-dashed transition-all duration-300
              ${isDragging 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-gray-700 hover:border-gray-600 hover:bg-dark-100/50'
              }
              ${error ? 'border-red-500 bg-red-500/5' : ''}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Background Effects */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                  transition-colors duration-300
                  ${isDragging ? 'bg-primary text-white' : 'bg-dark-100 text-gray-400 group-hover:text-primary'}
                `}
              >
                <Upload className="w-8 h-8" />
              </motion.div>

              <p className="text-white font-medium text-center mb-1">
                {isDragging ? 'Suelta aquí' : 'Arrastra una imagen'}
              </p>
              <p className="text-gray-500 text-sm text-center">
                {description}
              </p>
              <p className="text-gray-600 text-xs text-center mt-2">
                Máximo {maxSizeMB}MB • JPG, PNG, WEBP
              </p>
            </div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 right-4"
                >
                  <div className="glass bg-red-500/10 border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry();
                      }}
                      className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Preview */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
              relative group overflow-hidden rounded-2xl
              ${aspectRatioClasses[aspectRatio]}
            `}
          >
            {/* Image */}
            <img
              src={image}
              alt="Preview"
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => inputRef.current?.click()}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white transition-colors"
              >
                <Camera className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRemove}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-xl text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Upload Progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mb-4"
                  />
                  <p className="text-white font-medium mb-2">Subiendo...</p>
                  <div className="w-48 h-2 bg-dark-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">{progress}%</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Indicator */}
            {!isUploading && progress === 100 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-white" />
              </motion.div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
