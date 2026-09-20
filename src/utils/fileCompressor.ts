import { supabase } from '../lib/supabase';

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  previewUrl: string;
}

/**
 * Format bytes into human readable format (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Smart Client-Side Image Compression using HTML5 Canvas.
 * Caps the maximum dimension to 1800px (crystal-clear for handwritten notes & charts)
 * and applies JPEG compression (default 0.78 quality).
 * Typically shrinks 4MB - 12MB photos down to ~150KB - 350KB.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1800,
  quality = 0.78
): Promise<CompressionResult> {
  const originalSize = file.size;

  // If not an image or is SVG/GIF, return as-is
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercentage: 0,
      previewUrl: URL.createObjectURL(file)
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than maxDimension
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
          resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            reductionPercentage: 0,
            previewUrl: dataUrl
          });
          return;
        }

        // Fill background with white (helps if transparent PNG converted to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                reductionPercentage: 0,
                previewUrl: dataUrl
              });
              return;
            }

            // Create compressed File object with .jpg extension
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            const compressedSize = compressedFile.size;
            const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              reductionPercentage: reduction,
              previewUrl
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Gagal membaca berkas gambar untuk kompresi.'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Gagal memproses berkas.'));
    };
  });
}

/**
 * Upload submission file to Supabase Storage with automatic fallback handling.
 */
export async function uploadSubmissionFile(
  file: File,
  folderPath: string
): Promise<string> {
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${folderPath}/${Date.now()}_${sanitize(file.name)}`;

  // Try assignment-submissions bucket first
  let targetBucket = 'assignment-submissions';
  let { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(fileName, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    });

  // Fallback to question-images bucket if assignment-submissions bucket is not yet provisioned
  if (uploadError && (uploadError.message?.toLowerCase().includes('not found') || (uploadError as any).statusCode === 404)) {
    console.warn('assignment-submissions bucket not found, attempting fallback to question-images bucket...');
    targetBucket = 'question-images';
    const fallbackPath = `submissions/${fileName}`;
    const fallbackRes = await supabase.storage
      .from(targetBucket)
      .upload(fallbackPath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      });
    
    if (fallbackRes.error) {
      throw new Error(`Gagal mengunggah berkas: ${fallbackRes.error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(fallbackPath);

    return publicUrl;
  }

  if (uploadError) {
    throw new Error(`Gagal mengunggah berkas tugas: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(fileName);

  return publicUrl;
}
