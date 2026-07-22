import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path');

    if (!file || !path) {
      return NextResponse.json({ error: 'File and path are required.' }, { status: 400 });
    }

    // Use service role for storage upload
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const bucket = 'prop-firm-logos';

    // Ensure bucket exists (idempotent)
    try {
      await admin.storage.createBucket(bucket, { public: true });
    } catch {
      // Bucket likely already exists
    }

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('[upload-logo] Storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (err) {
    console.error('[upload-logo] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
