const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vsarsdunppymyunnjmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzYXJzZHVucHB5bXl1bm5qbXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA0MjkwOSwiZXhwIjoyMDc4NjE4OTA5fQ.bTZBjHeFDA0OKbw1CbutMVL8X-j6rU3mLsJ_L25QRss';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  try {
    console.log('Checking if game_id column exists...');

    // Try to select game_id to see if it exists
    const { error } = await supabase
      .from('seo_metadata')
      .select('game_id')
      .limit(1);

    if (error && error.message.includes('game_id')) {
      console.log('game_id column does not exist!');
      console.log('Please apply this migration manually in your Supabase SQL editor:');
      console.log(`
ALTER TABLE seo_metadata
ADD COLUMN game_id UUID REFERENCES games(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seo_metadata_game_id ON seo_metadata(game_id);

ALTER TABLE seo_metadata
ADD CONSTRAINT unique_seo_metadata_game_id UNIQUE (game_id);
      `);
    } else {
      console.log('game_id column exists - migration already applied');
    }
  } catch (error) {
    console.error('Error checking migration:', error);
  }
}

checkMigration();