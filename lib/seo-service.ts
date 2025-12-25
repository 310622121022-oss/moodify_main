import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export interface SeoMetadata {
  id: string;
  page_url: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_title?: string;
  og_description?: string;
  twitter_card: string;
}

export async function getSeoMetadata(pageUrl: string): Promise<SeoMetadata | null> {
  try {
    if (!supabase) {
      console.error(
        'Supabase is not configured for SEO metadata. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents) in your deployment environment.'
      );
      return null;
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_url', pageUrl)
      .single();

    if (error) {
      console.error('Error fetching SEO metadata:', error);
      return null;
    }

    return data as SeoMetadata;
  } catch (error) {
    console.error('Error in getSeoMetadata:', error);
    return null;
  }
}

export async function getAllSeoMetadata(): Promise<SeoMetadata[]> {
  try {
    if (!supabase) {
      console.error(
        'Supabase is not configured for SEO metadata. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents) in your deployment environment.'
      );
      return [];
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .order('page_url', { ascending: true });

    if (error) {
      console.error('Error fetching all SEO metadata:', error);
      return [];
    }

    return data as SeoMetadata[];
  } catch (error) {
    console.error('Error in getAllSeoMetadata:', error);
    return [];
  }
}
