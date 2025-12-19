'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Gamepad2, Heart } from 'lucide-react';
import Link from 'next/link';
import { GamesSection } from '@/components/games-section';
import { UserProfile } from '@/components/user-profile';
import { FAQSection } from '@/components/faq-section';
import { AppFooter } from '@/components/app-footer';
import StructuredData from '@/components/structured-data';

function GamesHubContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <StructuredData
        script={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "MoodLift Games & Activities",
          "description": "Breathing exercises, grounding techniques and short wellness games to improve emotional health",
          "url": "https://your-production-url.example.com/games"
        }}
      />
      {/* ItemList of featured activities (using visible site content) */}
      <StructuredData script={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Featured Activities",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "url": "https://your-production-url.example.com/games/box-breathing", "name": "Box Breathing" },
          { "@type": "ListItem", "position": 2, "url": "https://your-production-url.example.com/games/diaphragmatic-breathing", "name": "Diaphragmatic Breathing" },
          { "@type": "ListItem", "position": 3, "url": "https://your-production-url.example.com/games/four-seven-eight-breathing", "name": "4-7-8 Breathing" }
        ]
      }} />
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">Games & Activities</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <section className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">All Activities & Games</h2>
              <p className="text-muted-foreground">
                Breathing exercises and grounding techniques for your wellness
              </p>
            </div>
          </div>
          <GamesSection />
        </section>

        <Card className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Pin Your Favorites</h3>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-white/90 max-w-2xl mx-auto">
              Click the pin icon on any game to save it to your favorites. Track your progress and create a personalized wellness collection.
            </p>
            <Link href="/discover">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Explore More Resources
              </Button>
            </Link>
          </CardContent>
        </Card>

        <FAQSection
          title="Games & Activities FAQs"
          items={[
            {
              question: "How long does each activity take?",
              answer: "Most activities take 3-15 minutes. Specific durations are displayed on each game card and in the detailed view."
            },
            {
              question: "What's the difference between breathing exercises and grounding techniques?",
              answer: "Breathing exercises focus on controlling your breath to calm the nervous system. Grounding techniques use sensory awareness to bring you into the present moment and reduce anxiety."
            },
            {
              question: "Can I practice activities multiple times?",
              answer: "Yes! You can practice any activity as many times as you like. Regular practice enhances the benefits. We track your activity history in your dashboard."
            },
            {
              question: "Which game should I start with if I'm new?",
              answer: "We recommend starting with Box Breathing or Describe Your Room if you're new to wellness activities. These are gentle, easy-to-follow exercises perfect for beginners."
            },
            {
              question: "How do I know which game is right for my mood?",
              answer: "Take our Mood Assessment first! Based on your results, we'll recommend specific games tailored to your emotional state and wellness goals."
            },
            {
              question: "Are games available offline?",
              answer: "Games work best online for the full experience, but you can access descriptions and benefits offline. The activities themselves are web-based."
            }
          ]}
        />
      </main>

      <AppFooter />
    </div>
  );
}

export default function GamesHub() {
  return <GamesHubContent />;
}
