import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export async function compressProfileImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    quality: 0.8,
    ...options
  };
  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image. Please try again.');
  }
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
  }
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image file is too large. Please select an image smaller than 10MB.' };
  }
  return { isValid: true };
}

export function generateProfileImagePath(memberId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  return `profiles/${memberId}_${timestamp}.${extension}`;
}

export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
