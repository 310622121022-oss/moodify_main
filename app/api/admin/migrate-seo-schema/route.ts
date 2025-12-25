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

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Check if game_id column exists by trying to select it
    const { data, error } = await supabase
      .from('seo_metadata')
      .select('game_id')
      .limit(1);

    if (error) {
      // If error contains "column" and "does not exist", then column doesn't exist
      const columnExists = !error.message.includes('does not exist');
      return NextResponse.json({
        has_game_id_column: columnExists,
        error: error.message
      });
    }

    return NextResponse.json({
      has_game_id_column: true,
      sample_data: data
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({ error: 'Failed to check schema', details: error });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Try to add game_id column using raw SQL
    // First, let's try a simple approach - just alter the table directly
    const { error: alterError } = await supabase
      .from('seo_metadata')
      .select('*')
      .limit(1);

    if (alterError) {
      return NextResponse.json({ error: 'Cannot access seo_metadata table', details: alterError });
    }

    // Since we can't use raw SQL easily, let's try a different approach
    // We'll use the fact that Supabase allows us to insert/update with new columns
    // But first, let's check if we can use the REST API to alter the table

    // For now, let's return an error asking the user to run the migration manually
    return NextResponse.json({
      error: 'Migration needs to be applied manually',
      instructions: 'Please run the following SQL in your Supabase SQL editor:',
      sql: `
        ALTER TABLE seo_metadata
        ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS idx_seo_metadata_game_id ON seo_metadata(game_id);

        ALTER TABLE seo_metadata
        ADD CONSTRAINT IF NOT EXISTS unique_seo_metadata_game_id UNIQUE (game_id);
      `
    });
  } catch (error) {
    console.error('Error applying migration:', error);
    return NextResponse.json({ error: 'Failed to apply migration', details: error });
  }
}