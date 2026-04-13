import { api } from './api';

/**
 * Servicio de subida de imágenes
 * Usa el backend para subir a Cloudinary de forma segura
 */

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
 * Sube una imagen de avatar al backend, que la sube a Cloudinary
 * @param image - Puede ser un File o un data URL (base64)
 * @returns URL segura de la imagen subida
 */
export async function uploadToCloudinary(
  image: File | string,
  _folder?: string // Ignorado, el backend define la carpeta
): Promise<string> {
  // Convertir data URL a File si es necesario
  const file = typeof image === 'string' && image.startsWith('data:')
    ? dataURLtoFile(image, `avatar-${Date.now()}.jpg`)
    : image as File;

  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post('/uploads/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!data.success) {
    throw new Error(data.message || 'Error al subir imagen');
  }

  return data.data.url;
}

/**
 * Verifica si el servicio está disponible (siempre true, el backend maneja la config)
 */
export function isCloudinaryConfigured(): boolean {
  return true;
}
