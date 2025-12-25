import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration: SUPABASE_SERVICE_ROLE_KEY not set');
  }
  return createClient(supabaseUrl, supabaseKey);
}

// GET - Fetch all SEO metadata or specific by page_url or game_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('page_url');
    const gameId = searchParams.get('game_id');

    let query = supabase
      .from('seo_metadata')
      .select('*');

    if (pageUrl) {
      query = query.eq('page_url', pageUrl);
    } else if (gameId) {
      console.log('Fetching SEO for gameId:', gameId);
      query = query.eq('game_id', gameId);
    } else {
      query = query.order('page_url', { ascending: true });
    }

    const { data, error } = await query;

    console.log('SEO query result:', { data, error });

    if (error) {
      // If error is about game_id column not existing, return empty result
      if (error.message && error.message.includes('game_id')) {
        console.log('game_id column error, returning empty result');
        return NextResponse.json({ metadata: [] });
      }
      throw error;
    }

    return NextResponse.json({ metadata: data });
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata. Server configuration incomplete.' }, { status: 500 });
  }
}

// PUT - Update SEO metadata
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const body = await request.json();
    const { id, title, description, keywords, og_image, og_title, og_description, twitter_card, canonical_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .update({
        title,
        description,
        keywords,
        og_image,
        og_title,
        og_description,
        twitter_card,
        canonical_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ metadata: data[0] });
  } catch (error) {
    console.error('Error updating SEO metadata:', error);
    return NextResponse.json({ error: 'Failed to update metadata. Server configuration incomplete.' }, { status: 500 });
  }
}
