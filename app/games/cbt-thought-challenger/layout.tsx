import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: 'CBT Thought Challenger | MoodLift',
  description: 'Challenge negative thoughts with cognitive behavioral therapy techniques to improve your mental health.',
  keywords: 'CBT, thought challenging, cognitive therapy, negative thoughts, mental health',
  openGraph: {
    title: 'CBT Thought Challenger | MoodLift',
    description: 'Challenge negative thoughts with cognitive behavioral therapy techniques to improve your mental health.',
    url: 'https://moodlift.com/games/cbt-thought-challenger',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-cbt-thought-challenger.jpg',
        width: 1200,
        height: 630,
        alt: 'CBT Thought Challenger - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CBT Thought Challenger | MoodLift',
    description: 'Challenge negative thoughts with cognitive behavioral therapy techniques to improve your mental health.',
    images: ['https://moodlift.com/images/og-cbt-thought-challenger.jpg'],
  },
  alternates: {
    canonical: '/games/cbt-thought-challenger',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/cbt-thought-challenger');
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
        url: 'https://moodlift.com/games/cbt-thought-challenger',
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