import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface ProfilePhotoCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  saving?: boolean;
}

/**
 * Generates a cropped image blob from the original image and crop area.
 */
async function getCroppedImage(imageSrc: string, cropArea: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Output at 400x400 (matches backend Cloudinary PROFILE preset)
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/jpeg',
      0.92,
    );
  });
}

const ProfilePhotoCropper: React.FC<ProfilePhotoCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  saving = false,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-card border-b border-dark-border">
        <h2 className="text-lg font-semibold text-light-text">Ajustar foto de perfil</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
          disabled={saving}
        >
          <X className="h-5 w-5 text-light-muted" />
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
          style={{
            containerStyle: {
              backgroundColor: '#0a0a0a',
            },
            cropAreaStyle: {
              border: '3px solid #ef4444',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-dark-card border-t border-dark-border px-4 py-4 space-y-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <ZoomOut className="h-4 w-4 text-light-muted flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-dark-border rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
          />
          <ZoomIn className="h-4 w-4 text-light-muted flex-shrink-0" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            disabled={saving}
          >
            <RotateCw className="h-4 w-4 mr-1" />
            Rotar
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={saving}
          >
            <Check className="h-4 w-4 mr-1" />
            Guardar foto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoCropper;
