import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClientRaw } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Server-side file upload with validation.
 * Validates auth, file size, MIME type, and magic bytes before uploading to Supabase Storage.
 *
 * POST /api/upload
 * Body: FormData with:
 *   - file: the image file
 *   - path: storage path (e.g. "userId/tradeId/timestamp_filename.webp")
 *   - bucket: storage bucket name (default: "screenshots")
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/gif',
]);

/** Magic byte signatures for allowed image types */
const MAGIC_BYTES = [
  { type: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },        // PNG: ‰PNG
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },               // JPEG: ÿØÿ
  { type: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },         // GIF: GIF8
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset4: [0x57, 0x45, 0x42, 0x50] }, // RIFF....WEBP
];

function detectImageType(buffer) {
  const arr = new Uint8Array(buffer.slice(0, 12));
  for (const sig of MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (arr[i] !== sig.bytes[i]) { match = false; break; }
    }
    // WebP has a second signature at offset 8
    if (match && sig.offset4) {
      for (let i = 0; i < sig.offset4.length; i++) {
        if (arr[8 + i] !== sig.offset4[i]) { match = false; break; }
      }
    }
    if (match) return sig.type;
  }
  return null;
}

/** In-memory rate limiter for uploads (per user) */
const uploadRateLimit = new Map();
const UPLOAD_RATE_LIMIT = 30; // max uploads per minute
const UPLOAD_RATE_WINDOW = 60 * 1000; // 1 minute

function checkUploadRateLimit(userId) {
  const now = Date.now();
  const entry = uploadRateLimit.get(userId);
  if (!entry || now - entry.start > UPLOAD_RATE_WINDOW) {
    uploadRateLimit.set(userId, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= UPLOAD_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  try {
    // 1. Auth check
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limit
    if (!checkUploadRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 });
    }

    // 3. Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const storagePath = formData.get('path');
    const bucket = formData.get('bucket') || 'screenshots';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ error: 'No storage path provided.' }, { status: 400 });
    }

    // 4. Validate storage path starts with user's own ID (prevent path traversal / IDOR)
    if (!storagePath.startsWith(user.id + '/')) {
      return NextResponse.json({ error: 'Invalid storage path.' }, { status: 403 });
    }

    // 5. Only allow known buckets
    if (bucket !== 'screenshots') {
      return NextResponse.json({ error: 'Invalid bucket.' }, { status: 400 });
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // 7. Validate MIME type from Content-Type header
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // 8. Validate magic bytes (prevents spoofed Content-Type headers)
    const arrayBuffer = await file.arrayBuffer();
    const detectedType = detectImageType(arrayBuffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: 'File does not appear to be a valid image.' },
        { status: 400 }
      );
    }

    // 9. Upload to Supabase Storage using the user's scoped client
    const fileBuffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: detectedType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Upload failed: ' + uploadError.message },
        { status: 500 }
      );
    }

    // 10. Get public URL
    const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return NextResponse.json({
      url: pubData.publicUrl,
      path: storagePath,
      size: file.size,
      type: detectedType,
    });
  } catch (err) {
    console.error('[upload] Error:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
