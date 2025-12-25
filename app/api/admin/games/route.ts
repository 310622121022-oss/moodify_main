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

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ games: data });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const body = await request.json();
    const { title, description, category, icon, color_from, color_to, cover_image_url, is_popular, seo_title, seo_description, seo_keywords, seo_og_image, seo_og_title, seo_og_description } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const colors = `${color_from || '#3B82F6'}-${color_to || '#8B5CF6'}`;

    // Insert without problematic columns (schema cache issue with 'colors' column)
    const { data, error } = await supabase
      .from('games')
      .insert({
        title,
        description,
        category: category || 'Breathing',
        icon: icon || 'heart',
      })
      .select();

    if (error) throw error;

    const gameId = data?.[0]?.id;
    if (gameId) {
      // Persist cover_image_url (and allow clearing it by sending empty string)
      if (cover_image_url !== undefined) {
        const { error: coverErr } = await supabase
          .from('games')
          .update({ cover_image_url })
          .eq('id', gameId);

        if (coverErr) {
          const code = (coverErr as any)?.code;
          const message = (coverErr as any)?.message || 'Failed to save cover image';
          if (code === 'PGRST204' && /cover_image_url/i.test(message)) {
            return NextResponse.json(
              {
                code,
                error:
                  "Database schema is missing 'games.cover_image_url'. Apply the Supabase migrations or run: ALTER TABLE games ADD COLUMN IF NOT EXISTS cover_image_url text;",
              },
              { status: 400 }
            );
          }
          return NextResponse.json({ error: message, code }, { status: 500 });
        }
      }

      // Try to update is_popular if provided
      if (typeof is_popular !== 'undefined') {
        const { error: popErr } = await supabase
          .from('games')
          .update({ is_popular })
          .eq('id', gameId);
        if (popErr) {
          console.log('Could not save is_popular directly');
        }
      }

      // Try to update colors
      const { error: colorsErr } = await supabase
        .from('games')
        .update({ colors })
        .eq('id', gameId);
      if (colorsErr) {
        console.log('Could not save colors directly');
      }

      // Save SEO metadata - always attempt for games to allow clearing SEO data
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const pageUrl = `/games/${slug}`;

      const seoData = {
        page_url: pageUrl,
        title: seo_title || title,
        description: seo_description || description,
        keywords: seo_keywords || '',
        og_image: seo_og_image || '',
        og_title: seo_og_title || seo_title || title,
        og_description: seo_og_description || seo_description || description,
        twitter_card: 'summary_large_image',
        updated_at: new Date().toISOString(),
      };

      console.log('SEO data to save:', seoData);
      console.log('Game ID:', gameId);

      // Try to use game_id if column exists, otherwise use page_url
      let upsertData = seoData;
      let onConflictKey = 'page_url';
      try {
        // Check if game_id column exists by trying to select it
        await supabase.from('seo_metadata').select('game_id').limit(1);
        // If no error, game_id column exists
        upsertData = { ...seoData, game_id: gameId };
        onConflictKey = 'game_id';
      } catch (error) {
        // game_id column doesn't exist, use page_url only
        console.log('game_id column not found, using page_url only');
      }

      // Upsert SEO metadata
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .upsert(upsertData, { onConflict: onConflictKey });

      if (seoError) {
        console.error('Failed to save SEO metadata:', seoError);
        // Don't fail the whole request for SEO errors
      } else {
        console.log('SEO metadata saved successfully with data:', upsertData);
      }

      // Re-fetch to ensure persisted fields (cover_image_url, is_popular, etc.)
      const { data: fetched, error: fetchErr } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .maybeSingle();
      if (fetchErr) {
        console.error('Failed to re-fetch created game:', fetchErr);
      }

      const game = fetched || data?.[0];
      if (game) {
        (game as any).colors = (game as any).colors || colors;
        (game as any).color_from = (game as any).color_from || color_from || '#3B82F6';
        (game as any).color_to = (game as any).color_to || color_to || '#8B5CF6';
      }

      return NextResponse.json({ game });
    }

    return NextResponse.json({ game: data?.[0] });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const body = await request.json();
    const { id, title, description, category, icon, color_from, color_to, cover_image_url, is_popular, seo_title, seo_description, seo_keywords, seo_og_image, seo_og_title, seo_og_description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const colors = `${color_from || '#3B82F6'}-${color_to || '#8B5CF6'}`;

    // Update without problematic columns (schema cache issue with 'colors' column)
    const { data, error } = await supabase
      .from('games')
      .update({
        title,
        description,
        category,
        icon,
      })
      .eq('id', id)
      .select();

    if (error) throw error;


    // Persist cover_image_url (and allow clearing it by sending empty string)
    if (cover_image_url !== undefined) {
      const { error: coverErr } = await supabase
        .from('games')
        .update({ cover_image_url })
        .eq('id', id);

      if (coverErr) {
        const code = (coverErr as any)?.code;
        const message = (coverErr as any)?.message || 'Failed to save cover image';
        if (code === 'PGRST204' && /cover_image_url/i.test(message)) {
          return NextResponse.json(
            {
              code,
              error:
                "Database schema is missing 'games.cover_image_url'. Apply the Supabase migrations or run: ALTER TABLE games ADD COLUMN IF NOT EXISTS cover_image_url text;",
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: message, code }, { status: 500 });
      }
    }

    if (typeof is_popular !== 'undefined') {
      try {
        await supabase.from('games').update({ is_popular }).eq('id', id);
      } catch (err) {
        console.log('Could not save is_popular directly');
      }
    }

    // Try to update colors
    try {
      await supabase.from('games').update({ colors }).eq('id', id);
    } catch (err) {
      console.log('Could not save colors directly');
    }

    // Save SEO metadata - always attempt for games to allow clearing SEO data
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const pageUrl = `/games/${slug}`;
    
    const seoData = {
      page_url: pageUrl,
      title: seo_title || title,
      description: seo_description || description,
        keywords: seo_keywords || '',
        og_image: seo_og_image || '',
        og_title: seo_og_title || seo_title || title,
        og_description: seo_og_description || seo_description || description,
        twitter_card: 'summary_large_image',
        updated_at: new Date().toISOString(),
      };

      // Try to use game_id if column exists, otherwise use page_url
      let upsertData = seoData;
      try {
        // Check if game_id column exists by trying to select it
        await supabase.from('seo_metadata').select('game_id').limit(1);
        // If no error, game_id column exists
        upsertData = { ...seoData, game_id: id };
      } catch (error) {
        // game_id column doesn't exist, use page_url only
        console.log('game_id column not found, using page_url only');
      }

      // Upsert SEO metadata
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .upsert(upsertData, { onConflict: 'page_url' });

      if (seoError) {
        console.error('Failed to save SEO metadata:', seoError);
        // Don't fail the whole request for SEO errors
      }

    // Re-fetch to ensure persisted fields (cover_image_url, is_popular, etc.)
    const { data: fetched, error: fetchErr } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) {
      console.error('Failed to re-fetch updated game:', fetchErr);
    }

    // Return game with computed colors for frontend
    const game = fetched || data?.[0];
    if (game) {
      (game as any).colors = (game as any).colors || colors;
      (game as any).color_from = (game as any).color_from || color_from || '#3B82F6';
      (game as any).color_to = (game as any).color_to || color_to || '#8B5CF6';
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
