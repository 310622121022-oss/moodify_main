import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: 'Worry Box | MoodLift',
  description: 'Put your worries in a box to set them aside and focus on the present moment.',
  keywords: 'worry box, anxiety management, present focus, worry containment, mental health',
  openGraph: {
    title: 'Worry Box | MoodLift',
    description: 'Put your worries in a box to set them aside and focus on the present moment.',
    url: 'https://moodlift.com/games/worry-box',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-worry-box.jpg',
        width: 1200,
        height: 630,
        alt: 'Worry Box - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Worry Box | MoodLift',
    description: 'Put your worries in a box to set them aside and focus on the present moment.',
    images: ['https://moodlift.com/images/og-worry-box.jpg'],
  },
  alternates: {
    canonical: '/games/worry-box',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/worry-box');
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
        url: 'https://moodlift.com/games/worry-box',
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