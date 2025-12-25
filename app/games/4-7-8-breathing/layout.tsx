import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: '4-7-8 Breathing - Dr. Weil Breathing Technique | MoodLift',
  description: 'Practice the 4-7-8 breathing technique by Dr. Andrew Weil - a natural tranquilizer for the nervous system. Reduce stress and anxiety with this proven breathing exercise.',
  keywords: '4-7-8 breathing, Dr. Andrew Weil, breathing exercise, stress relief, anxiety reduction, relaxation technique',
  openGraph: {
    title: '4-7-8 Breathing - Dr. Weil Breathing Technique | MoodLift',
    description: 'Practice the 4-7-8 breathing technique by Dr. Andrew Weil - a natural tranquilizer for the nervous system.',
    url: 'https://moodlift.com/games/4-7-8-breathing',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-4-7-8-breathing.jpg',
        width: 1200,
        height: 630,
        alt: '4-7-8 Breathing Exercise - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '4-7-8 Breathing - Dr. Weil Breathing Technique | MoodLift',
    description: 'Practice the 4-7-8 breathing technique by Dr. Andrew Weil - a natural tranquilizer for the nervous system.',
    images: ['https://moodlift.com/images/og-4-7-8-breathing.jpg'],
  },
  alternates: {
    canonical: '/games/4-7-8-breathing',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/4-7-8-breathing');
    if (!seo) return defaultMetadata;

    const ogImages = seo.og_image ? [{ url: seo.og_image, alt: seo.title }] : defaultMetadata.openGraph?.images;

    return {
      title: seo.title || defaultMetadata.title,
      description: seo.description || defaultMetadata.description,
      keywords: seo.keywords || defaultMetadata.keywords,
      metadataBase: new URL('https://moodlift.com'),
      alternates: defaultMetadata.alternates,
      openGraph: {
        title: seo.og_title || seo.title || defaultMetadata.openGraph?.title,
        description: seo.og_description || seo.description || defaultMetadata.openGraph?.description,
        url: 'https://moodlift.com/games/4-7-8-breathing',
        siteName: defaultMetadata.openGraph?.siteName,
        images: ogImages as any,
        locale: defaultMetadata.openGraph?.locale,
      },
      twitter: {
        title: seo.title || defaultMetadata.twitter?.title,
        description: seo.description || defaultMetadata.twitter?.description,
        images: seo.og_image ? [seo.og_image] : defaultMetadata.twitter?.images,
      },
    } as Metadata;
  } catch (err) {
    console.error('Error generating metadata:', err);
    return defaultMetadata;
  }
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}