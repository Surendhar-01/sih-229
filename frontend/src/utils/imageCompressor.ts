export interface CompressedImage {
  dataUrl: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
}

export const MAX_IMAGES = 5;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB input limit
export const TARGET_MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB compressed limit
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Validates whether the file is an acceptable image format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
    return {
      valid: false,
      error: `Unsupported file format. Please upload JPG, PNG, or WebP images.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File ${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max upload size is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file on the client side using Canvas API
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  initialQuality = 0.82
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Failed to load image file ${file.name}`));

      img.onload = () => {
        let { width, height } = img;

        // Scale down maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to ensure < 1MB target
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate byte size of base64
        let approximateBytes = Math.round((dataUrl.length * 3) / 4);

        while (approximateBytes > TARGET_MAX_FILE_SIZE_BYTES && quality > 0.3) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          approximateBytes = Math.round((dataUrl.length * 3) / 4);
        }

        resolve({
          dataUrl,
          originalName: file.name,
          fileSize: approximateBytes,
          mimeType: 'image/jpeg',
          width,
          height,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
