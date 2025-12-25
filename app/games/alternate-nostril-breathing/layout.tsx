import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

const defaultMetadata: Metadata = {
  title: 'Alternate Nostril Breathing - Yogic Breathing for Balance | MoodLift',
  description: 'Practice alternate nostril breathing (Nadi Shodhana) - an ancient yogic technique that balances brain hemispheres and promotes deep relaxation.',
  keywords: 'alternate nostril breathing, Nadi Shodhana, yogic breathing, brain balance, relaxation technique, pranayama',
  openGraph: {
    title: 'Alternate Nostril Breathing - Yogic Breathing for Balance | MoodLift',
    description: 'Practice alternate nostril breathing (Nadi Shodhana) - an ancient yogic technique that balances brain hemispheres.',
    url: 'https://moodlift.com/games/alternate-nostril-breathing',
    siteName: 'MoodLift',
    images: [
      {
        url: 'https://moodlift.com/images/og-alternate-nostril-breathing.jpg',
        width: 1200,
        height: 630,
        alt: 'Alternate Nostril Breathing Exercise - MoodLift',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alternate Nostril Breathing - Yogic Breathing for Balance | MoodLift',
    description: 'Practice alternate nostril breathing (Nadi Shodhana) - an ancient yogic technique that balances brain hemispheres.',
    images: ['https://moodlift.com/images/og-alternate-nostril-breathing.jpg'],
  },
  alternates: {
    canonical: '/games/alternate-nostril-breathing',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('/games/alternate-nostril-breathing');
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
        url: 'https://moodlift.com/games/alternate-nostril-breathing',
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