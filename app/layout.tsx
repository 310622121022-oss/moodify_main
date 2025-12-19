import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import StructuredData from '@/components/structured-data';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MoodLift - AI-Powered Emotional Wellness',
  description: 'Transform your mood with AI-powered wellness games designed to boost emotional well-being',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Base WebSite schema for all pages */}
          <StructuredData
            script={{
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MoodLift",
              "url": "https://your-production-url.example.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://your-production-url.example.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
