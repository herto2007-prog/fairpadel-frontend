/**
 * Servicio de subida de imágenes a Cloudinary
 * Usa unsigned upload con upload preset
 */

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// Configuración de Cloudinary (debería venir de variables de entorno)
const config: CloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
};

/**
 * Convierte un data URL (base64) a un File/Blob
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Sube una imagen a Cloudinary
 * @param image - Puede ser un File o un data URL (base64)
 * @param folder - Carpeta opcional en Cloudinary
 * @returns URL segura de la imagen subida
 */
export async function uploadToCloudinary(
  image: File | string,
  folder?: string
): Promise<string> {
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Cloudinary no está configurado. Verifica las variables de entorno.');
  }

  // Convertir data URL a File si es necesario
  const file = typeof image === 'string' && image.startsWith('data:')
    ? dataURLtoFile(image, `avatar-${Date.now()}.jpg`)
    : image as File;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error al subir imagen a Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Verifica si Cloudinary está configurado
 */
export function isCloudinaryConfigured(): boolean {
  return !!config.cloudName && !!config.uploadPreset;
}

/**
 * Obtiene la configuración actual (para debugging)
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  return { ...config };
}
