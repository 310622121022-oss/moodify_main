'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, BookOpen, Heart } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { BooksSection } from '@/components/books-section';
import { FavoritesSection } from '@/components/favorites-section';
import { GamesSection } from '@/components/games-section';
import { FAQSection } from '@/components/faq-section';
import { AppFooter } from '@/components/app-footer';
import { HomeNavbar } from '@/components/home-navbar';

function DiscoverContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <HomeNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <Card className="mb-12 overflow-hidden border-2 border-secondary/80 bg-accent/20">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2">
                  Take Our AI Mood Assessment
                </h2>
                <p className="text-muted-foreground mb-4">
                  Get personalized insights about your emotional well-being with our psychometric assessment. Takes just 2-3 minutes.
                </p>

                <div className="w-full md:w-auto">
                  <Link href="/assessment" title="Take our AI-powered mood assessment for personalized insights">
                    <Button className="w-full md:w-auto h-11 rounded-md px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm md:text-base">
                      Start Assessment
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <div className="w-[160px] sm:w-[200px] md:w-[220px] aspect-square rounded-3xl bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src="/assessment-boy.png"
                    alt="Assessment illustration"
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="section-title font-bold text-primary">Your Favorites</h2>
              <p className="text-muted-foreground">
                Quick access to your pinned games and books
              </p>
            </div>
          </div>
          <FavoritesSection />
        </section>


        <section className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="section-title font-bold text-primary">All Activities</h2>
              <p className="text-muted-foreground">
                Breathing exercises and grounding techniques for your wellness
              </p>
            </div>
          </div>
          <GamesSection />
        </section>

        <section className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="section-title font-bold text-primary">Book Recommendations</h2>
              <p className="text-muted-foreground">
                Curated reading list for personal growth and mental health
              </p>
            </div>
          </div>
          <BooksSection />
        </section>

        <Card className="bg-gradient-to-r from-primary to-accent text-white border-2 border-secondary/80 shadow-2xl">
          <CardContent className="p-6 sm:p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Continue Your Wellness Journey</h3>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-white/90 max-w-2xl mx-auto">
              Pin your favorite games and books to create a personalized wellness collection. Track your progress and discover new ways to improve your mental health.
            </p>
            <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
              <Link href="/dashboard" title="View your progress and achievements">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-xs sm:text-sm md:text-base">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <FAQSection
          title="Discover & Resources FAQs"
          items={[
            {
              question: "What's the difference between the Discover page and the Games page?",
              answer: "The Discover page is your personalized hub with your favorites, all activities, and book recommendations. The Games page focuses specifically on wellness games and activities."
            },
            {
              question: "How do I add games and books to my favorites?",
              answer: "Click the pin icon on any game or book card. Your favorites appear in the 'Your Favorites' section for quick access. You can manage favorites from any page."
            },
            {
              question: "Can I get book recommendations based on my mood?",
              answer: "Yes! After completing a mood assessment, we recommend books tailored to your emotional state and wellness goals. You'll see personalized suggestions on the Discover page."
            },
            {
              question: "How do I start using the recommended resources?",
              answer: "Browse the Activities and Books sections, click on any item to see details, then click 'Start Playing' for games or 'Learn More' for books. Everything is accessible from the Discover page."
            },
            {
              question: "Can I view my progress with different games and books?",
              answer: "Yes! Visit your Dashboard to see your activity history, progress over time, and insights about your wellness journey."
            },
            {
              question: "Are the book recommendations free?",
              answer: "We provide detailed recommendations and summaries. Links are provided to purchase or borrow books from various platforms. Some resources may be available free online."
            }
          ]}
        />
      </main>

      {/* Footer rendered by DiscoverPageWrapper via <AppFooter /> */}
    </div>
  );
}

function DiscoverPageWrapper() {
  return (
    <>
      <DiscoverContent />
      <AppFooter />
    </>
  );
}

export default function DiscoverPage() {
  return (
    <ProtectedRoute>
      <DiscoverPageWrapper />
    </ProtectedRoute>
  );
}
