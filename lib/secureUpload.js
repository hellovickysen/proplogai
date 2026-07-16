/**
 * Client-side secure upload helper.
 * Routes file uploads through /api/upload for server-side validation
 * instead of uploading directly to Supabase Storage.
 *
 * Usage:
 *   import { secureUpload } from '@/lib/secureUpload';
 *   const { url, error } = await secureUpload(processedFile, storagePath);
 */

/**
 * Upload a file through the server-side validation endpoint.
 * @param {File|Blob} file - The file to upload (should already be processed by processImageFile)
 * @param {string} path - Storage path (e.g. "userId/tradeId/timestamp_filename.webp")
 * @param {object} [options]
 * @param {string} [options.bucket] - Storage bucket name (default: "screenshots")
 * @returns {{ url: string|null, error: string|null }}
 */
export async function secureUpload(file, path, options = {}) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    if (options.bucket) formData.append('bucket', options.bucket);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { url: null, error: data.error || 'Upload failed.' };
    }

    return { url: data.url, error: null };
  } catch (err) {
    return { url: null, error: err.message || 'Upload failed.' };
  }
}
