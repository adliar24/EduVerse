import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = (import.meta as any).env.VITE_CLOUDFLARE_R2_ACCOUNT_ID || '2815d9972da5a038961fbfd11abf5d88';
const accessKeyId = (import.meta as any).env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || '1238ef13ffc2b70d7379f13b1952bf22';
const secretAccessKey = (import.meta as any).env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || '7c68618ac4a58fc4c22afcb4f99c2d16520d7e25fbb4345e75e2a219a578b600';
const bucketName = (import.meta as any).env.VITE_CLOUDFLARE_R2_BUCKET || 'eduverse-media';
const publicBaseUrl = (import.meta as any).env.VITE_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-4e88ac579a704dc4967076cfd4f4139f.r2.dev';

export const isR2Configured = (): boolean => {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicBaseUrl);
};

let r2ClientInstance: S3Client | null = null;

export const getR2Client = (): S3Client => {
  if (!r2ClientInstance) {
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2ClientInstance;
};

/**
 * Upload a file or blob directly to Cloudflare R2 and return its high-speed public CDN URL
 */
export async function uploadFileToR2(
  file: File | Blob,
  customKey?: string
): Promise<{ url: string; key: string }> {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 belum dikonfigurasi di environment variables (.env).');
  }

  const client = getR2Client();
  const rawName = (file as File).name || 'file.bin';
  const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = customKey || `uploads/${Date.now()}_${cleanName}`;
  const contentType = file.type || 'application/octet-stream';

  const buffer = await file.arrayBuffer();

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: new Uint8Array(buffer),
    ContentType: contentType,
  }));

  const cleanBase = publicBaseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/${key}`;

  return { url, key };
}

/**
 * Delete a file from Cloudflare R2 by file key or public URL
 */
export async function deleteFileFromR2(fileKeyOrUrl: string): Promise<boolean> {
  if (!isR2Configured() || !fileKeyOrUrl) return false;

  try {
    let key = fileKeyOrUrl;
    if (fileKeyOrUrl.startsWith('http')) {
      const urlObj = new URL(fileKeyOrUrl);
      key = urlObj.pathname.replace(/^\/+/, '');
    }

    const client = getR2Client();
    await client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    return true;
  } catch (err) {
    console.warn('Gagal menghapus berkas dari Cloudflare R2:', err);
    return false;
  }
}
