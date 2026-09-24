import { Client, Storage, ID } from 'appwrite';

const endpoint = (import.meta as any).env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = (import.meta as any).env.VITE_APPWRITE_PROJECT_ID || '';
const bucketId = (import.meta as any).env.VITE_APPWRITE_BUCKET_ID || 'assignment-submissions';

export const isAppwriteConfigured = (): boolean => {
  return Boolean(
    projectId && 
    projectId.trim().length > 0 && 
    projectId !== 'placeholder' &&
    bucketId && 
    bucketId.trim().length > 0
  );
};

export const appwriteClient = new Client();

if (isAppwriteConfigured()) {
  appwriteClient
    .setEndpoint(endpoint)
    .setProject(projectId);
}

export const appwriteStorage = new Storage(appwriteClient);

/**
 * Upload a file to Appwrite Storage Bucket and returns a direct preview/download URL
 */
export async function uploadFileToAppwrite(
  file: File,
  customFileId?: string
): Promise<{ fileId: string; url: string }> {
  if (!isAppwriteConfigured()) {
    throw new Error('Appwrite belum dikonfigurasi di environment variables (.env).');
  }

  // Appwrite file ID must be valid unique ID or generated with ID.unique()
  const fileId = customFileId || ID.unique();

  const response = await appwriteStorage.createFile(
    bucketId,
    fileId,
    file
  );

  // Generate direct view URL
  const viewUrl = appwriteStorage.getFileView(bucketId, response.$id).toString();

  return {
    fileId: response.$id,
    url: viewUrl
  };
}

/**
 * Delete a file from Appwrite Storage Bucket by file ID or its storage URL
 */
export async function deleteFileFromAppwrite(fileIdOrUrl: string): Promise<boolean> {
  if (!isAppwriteConfigured() || !fileIdOrUrl) return false;

  try {
    let fileId = fileIdOrUrl.trim();
    if (fileId.includes('/files/')) {
      const match = fileId.match(/\/files\/([^/?]+)/);
      if (match && match[1]) {
        fileId = match[1];
      }
    }
    await appwriteStorage.deleteFile(bucketId, fileId);
    console.log(`Successfully deleted file ${fileId} from Appwrite bucket ${bucketId}`);
    return true;
  } catch (err) {
    console.warn('Gagal menghapus berkas dari Appwrite Storage:', err);
    return false;
  }
}

