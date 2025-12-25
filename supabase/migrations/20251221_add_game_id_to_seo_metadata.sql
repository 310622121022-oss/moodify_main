-- Add game_id column to seo_metadata table to link SEO data to specific games
ALTER TABLE seo_metadata
ADD COLUMN game_id UUID REFERENCES games(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_seo_metadata_game_id ON seo_metadata(game_id);

-- Add unique constraint on game_id to ensure one SEO record per game
ALTER TABLE seo_metadata
ADD CONSTRAINT unique_seo_metadata_game_id UNIQUE (game_id);

-- Update RLS policies to allow operations on game_id
-- Note: The existing policies should work, but adding this for clarity