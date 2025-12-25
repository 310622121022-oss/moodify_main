import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: '4-7-8 Breathing | MoodLift',
  description: 'Use the 4-7-8 breathing technique to calm your mind and body before sleep or during stress.',
  keywords: '4-7-8 breathing, relaxation, sleep aid, stress relief, breathing exercise',
  openGraph: {
    title: '4-7-8 Breathing | MoodLift',
    description: 'Use the 4-7-8 breathing technique to calm your mind and body before sleep or during stress.',
    url: 'https://moodlift.com/games/four-seven-eight-breathing',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-four-seven-eight-breathing.jpg',
        width: 1200,
        height: 630,
        alt: '4-7-8 Breathing - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '4-7-8 Breathing | MoodLift',
    description: 'Use the 4-7-8 breathing technique to calm your mind and body before sleep or during stress.',
    images: ['https://moodlift.com/images/og-four-seven-eight-breathing.jpg'],
  },
  alternates: {
    canonical: '/games/four-seven-eight-breathing',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/four-seven-eight-breathing');
    if (!seo) return defaultMetadata;

    const ogImages = seo.og_image ? [{ url: seo.og_image, alt: seo.title }] : defaultMetadata.openGraph?.images;

    return {
      title: seo.title || defaultMetadata.title,
      description: seo.description || defaultMetadata.description,
      keywords: seo.keywords || defaultMetadata.keywords,
      metadataBase: new URL('https://moodlift.com'),
      alternates: defaultMetadata.alternates,
      openGraph: {
        title: seo.title || defaultMetadata.openGraph?.title,
        description: seo.description || defaultMetadata.openGraph?.description,
        url: 'https://moodlift.com/games/four-seven-eight-breathing',
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