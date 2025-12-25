import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: 'Self-Soothing | MoodLift',
  description: 'Discover techniques to soothe yourself during difficult times and manage emotional distress.',
  keywords: 'self-soothing, emotional regulation, distress tolerance, coping skills, mental health',
  openGraph: {
    title: 'Self-Soothing | MoodLift',
    description: 'Discover techniques to soothe yourself during difficult times and manage emotional distress.',
    url: 'https://moodlift.com/games/self-soothing',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-self-soothing.jpg',
        width: 1200,
        height: 630,
        alt: 'Self-Soothing - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self-Soothing | MoodLift',
    description: 'Discover techniques to soothe yourself during difficult times and manage emotional distress.',
    images: ['https://moodlift.com/images/og-self-soothing.jpg'],
  },
  alternates: {
    canonical: '/games/self-soothing',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/self-soothing');
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
        url: 'https://moodlift.com/games/self-soothing',
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