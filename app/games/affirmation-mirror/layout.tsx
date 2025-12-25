import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: 'Affirmation Mirror | MoodLift',
  description: 'Practice positive affirmations to improve your self-image and boost your mood with our interactive affirmation mirror.',
  keywords: 'affirmation, positive thinking, self-image, mood boost, self-care',
  openGraph: {
    title: 'Affirmation Mirror | MoodLift',
    description: 'Practice positive affirmations to improve your self-image and boost your mood with our interactive affirmation mirror.',
    url: 'https://moodlift.com/games/affirmation-mirror',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-affirmation-mirror.jpg',
        width: 1200,
        height: 630,
        alt: 'Affirmation Mirror - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affirmation Mirror | MoodLift',
    description: 'Practice positive affirmations to improve your self-image and boost your mood with our interactive affirmation mirror.',
    images: ['https://moodlift.com/images/og-affirmation-mirror.jpg'],
  },
  alternates: {
    canonical: '/games/affirmation-mirror',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/affirmation-mirror');
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
        url: 'https://moodlift.com/games/affirmation-mirror',
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