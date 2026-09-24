import { supabase, supabaseAnon } from '../lib/supabase';
import { isAppwriteConfigured, uploadFileToAppwrite } from '../lib/appwrite';

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
 * Convert any File or Blob to a Base64 Data URL string
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
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
 * Upload submission file with intelligent multi-tier fallbacks:
 * 1. Tries Supabase Storage 'assignment-submissions' bucket (both anon & default client)
 * 2. Tries Supabase Storage 'question-images' fallback bucket
 * 3. If storage buckets are unconfigured/missing or RLS rejected, automatically falls back
 *    to high-efficiency Base64 Data URL so the student's submission NEVER fails!
 */
export async function uploadSubmissionFile(
  file: File,
  folderPath: string
): Promise<string> {
  // Tier 1: Try Appwrite Storage Bucket if configured (Dedicated file storage with generous limits)
  if (isAppwriteConfigured()) {
    try {
      console.log('Uploading student assignment file to Appwrite Storage...');
      const appwriteRes = await uploadFileToAppwrite(file);
      if (appwriteRes.url) {
        console.log('Successfully uploaded file to Appwrite Storage:', appwriteRes.url);
        return appwriteRes.url;
      }
    } catch (appwriteErr: any) {
      console.warn('Appwrite upload attempt failed, continuing to Supabase/DataURL fallback:', appwriteErr?.message || appwriteErr);
    }
  }

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanFolder = (folderPath || 'submissions').replace(/[^a-zA-Z0-9/_-]/g, '_');
  const fileName = `${cleanFolder}/${Date.now()}_${sanitize(file.name)}`;

  const bucketsToTry = ['assignment-submissions', 'question-images'];
  const clientsToTry = [supabaseAnon, supabase];

  for (const bucket of bucketsToTry) {
    for (const client of clientsToTry) {
      try {
        const uploadPath = bucket === 'assignment-submissions' ? fileName : `submissions/${fileName}`;
        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(uploadPath, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = client.storage
            .from(bucket)
            .getPublicUrl(uploadPath);

          if (publicUrl) {
            console.log(`Successfully uploaded file to bucket '${bucket}':`, publicUrl);
            return publicUrl;
          }
        } else {
          console.warn(`Storage upload to bucket '${bucket}' returned error:`, uploadError.message);
        }
      } catch (err: any) {
        console.warn(`Exception uploading to '${bucket}':`, err?.message || err);
      }
    }
  }

  // Resilient fallback: Convert file to Base64 Data URL.
  // Images are already compressed (<300KB), fitting easily into Postgres TEXT fields.
  console.warn('Supabase storage bucket not accessible; using resilient Base64 Data URL fallback.');
  try {
    const dataUrl = await fileToDataUrl(file);
    return dataUrl;
  } catch (convErr: any) {
    throw new Error('Gagal memproses berkas tugas: ' + (convErr.message || 'Format tidak terbaca'));
  }
}

