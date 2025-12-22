import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function ensureBucketExists(supabase: any) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const assetsBucket = buckets?.find((b: any) => b.name === 'assets');
    
    if (!assetsBucket) {
      await supabase.storage.createBucket('assets', { public: true });
      return;
    }

    // If the bucket already exists, ensure it's public so user-facing pages
    // can load images via the /object/public URL.
    const isPublic = !!(assetsBucket.public ?? assetsBucket.isPublic ?? assetsBucket.is_public);
    if (!isPublic) {
      try {
        await supabase.storage.updateBucket('assets', { public: true });
      } catch (err) {
        console.error('Error updating assets bucket visibility:', err);
      }
    }
  } catch (err) {
    console.error('Error ensuring bucket exists:', err);
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    await ensureBucketExists(supabase);
    
    const { data, error } = await supabase
      .storage
      .from('assets')
      .list('', { limit: 100, offset: 0 });

    if (error) throw error;

    const assets = (data || []).map((file: any) => ({
      name: file.name,
      url: `${supabaseUrl}/storage/v1/object/public/assets/${file.name}`,
      size: file.metadata?.size || 0,
      created_at: file.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    await ensureBucketExists(supabase);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    const { data, error } = await supabase
      .storage
      .from('assets')
      .upload(fileName, Buffer.from(buffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) throw error;

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;

    return NextResponse.json({
      name: fileName,
      url: publicUrl,
      asset: {
        name: fileName,
        url: publicUrl,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    const message = (error as any)?.message || 'Failed to upload asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    await ensureBucketExists(supabase);
    
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const { error } = await supabase
      .storage
      .from('assets')
      .remove([name]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
