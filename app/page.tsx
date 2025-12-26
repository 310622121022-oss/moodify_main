'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ClipboardList, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/auth-modal';
import { GoogleSignInPopup } from '@/components/google-signin-popup';
import { TestimonialCarousel } from '@/components/testimonial-carousel';
import { QuoteCarousel } from '@/components/quote-carousel';
import { FAQSection } from '@/components/faq-section';
import ConsultantCarousel from '@/components/consultant-carousel';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveDailyMood, getGameRecommendations, getTodaysMood, type MoodType } from '@/lib/mood-service';
import { AppFooter } from '@/components/app-footer';
import StructuredData from '@/components/structured-data';
import { HomeNavbar } from '@/components/home-navbar';

type Game = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color_from: string;
  color_to: string;
  cover_image_url?: string;
  is_popular?: boolean;
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      if (!user?.email) {
        if (!cancelled) setIsAdmin(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/check-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        const json = await res.json().catch(() => ({} as any));
        if (!cancelled) setIsAdmin(!!json?.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const handleAssessmentClick = () => {
    if (user) {
      router.push('/assessment');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (!userId) return;

      // If user hasn't recorded today's mood yet, redirect to assessment
      try {
        const todays = await getTodaysMood(userId);
        if (!todays) {
          router.push('/assessment');
        }
      } catch (e) {
        console.error('Error checking today mood after auth:', e);
        // fallback to redirecting to assessment
        router.push('/assessment');
      }
    } catch (e) {
      console.error('Error handling auth success:', e);
    }
  };


  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    
    if (user) {
      await saveDailyMood(user.id, moodId as MoodType);
    }
    
    const gameRecommendations = getGameRecommendations(moodId as MoodType);

    // Fetch games from the DB that match the recommended game titles.
    try {
      const titles = gameRecommendations.map((r) => r.title);
      const { data: matchedGames } = await supabase
        .from('games')
        .select('*')
        .in('title', titles);

      // Preserve the order of recommendations and filter out missing games
      let ordered: Game[] = [];
      if (matchedGames && Array.isArray(matchedGames)) {
        const byTitle = new Map<string, any>(matchedGames.map((g: any) => [g.title, g]));
        ordered = gameRecommendations
          .map((r) => byTitle.get(r.title))
          .filter(Boolean) as Game[];
      }

      // If fewer than 3 matched games, fill with additional recent games (excluding ones already added)
      if (ordered.length < 3) {
        const { data: candidates } = await supabase
          .from('games')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (candidates && Array.isArray(candidates)) {
          const existing = new Set(ordered.map((g) => g.title));
          for (const c of candidates) {
            if (ordered.length >= 3) break;
            if (!existing.has(c.title)) {
              ordered.push(c as Game);
              existing.add(c.title);
            }
          }
        }
      }

      // Ensure exactly 3 recommendations
      setRecommendations(ordered.slice(0, 3));
    } catch (e) {
      console.error('Failed to fetch recommended games:', e);
      setRecommendations([]);
    }
  };

  useEffect(() => {
    // fetch top 3 popular games to display covers (admin-controlled)
    let mounted = true;
    const fetchPopular = async () => {
      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('is_popular', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (!mounted) return;

        if (data && Array.isArray(data) && data.length > 0) {
          setPopularGames(data as any);
          return;
        }

        // Fallback (no pinned popular games yet): show well-known starter games,
        // still pulling from DB so admin cover_image_url reflects in the UI.
        const fallbackTitles = ['Box Breathing', 'Diaphragmatic Breathing', '4-7-8 Breathing'] as const;
        const { data: fallbackData } = await supabase
          .from('games')
          .select('*')
          .in('title', [...fallbackTitles]);

        if (!mounted) return;
        if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
          const order = new Map<string, number>(fallbackTitles.map((t, i) => [t, i]));
          const sorted = [...fallbackData].sort((a: any, b: any) => {
            const ai = order.get(a?.title) ?? 999;
            const bi = order.get(b?.title) ?? 999;
            return ai - bi;
          });
          setPopularGames(sorted as any);
        }
      } catch (e) {
        console.error('Failed to fetch popular games:', e);
      }
    };

    fetchPopular();
  }, []);

  const [popularGames, setPopularGames] = useState<Game[]>([]);

  const moods = [
    { id: 'stressed', label: 'Stressed', symbol: 'mood-stressed' },
    { id: 'sad', label: 'Sad', symbol: 'mood-sad' },
    { id: 'anxious', label: 'Anxious', symbol: 'mood-anxious' },
    { id: 'bored', label: 'Bored', symbol: 'mood-bored' },
    { id: 'happy', label: 'Happy', symbol: 'mood-happy' },
  ] as const;

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: string } = {
      brain: '🧠',
      'flower-2': '🌸',
      lightbulb: '💡',
      target: '🎯',
      heart: '❤️',
      'book-open': '📖',
    };
    return icons[iconName] || '🎮';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <StructuredData
        script={{
          "@context": "https://schema.org",
          "url": "/",
          "publisher": {
            "url": "/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://moodlift.com/images/logo.png"
            }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <StructuredData
        script={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "MoodLift",
          "url": "https://moodlift.com",
          "description": "AI-powered emotional wellness platform helping people improve mental health through interactive games and activities.",
          "foundingDate": "2024",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-89405-06900",
            "contactType": "customer service",
            "email": "support@moodlift.com"
          }
        }}
      />
      {/* FAQ structured data (sampleed from site FAQs) */}
      <StructuredData script={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How long does each activity take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most activities take 3-15 minutes. Specific durations are displayed on each game card and in the detailed view."
            }
          },
          {
            "@type": "Question",
            "name": "What's the difference between breathing exercises and grounding techniques?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Breathing exercises focus on controlling your breath to calm the nervous system. Grounding techniques use sensory awareness to bring you into the present moment and reduce anxiety."
            }
          },
          {
            "@type": "Question",
            "name": "Can I practice activities multiple times?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! You can practice any activity as many times as you like. Regular practice enhances the benefits. We track your activity history in your dashboard."
            }
          }
        ]
      }} />
      <HomeNavbar
        authModal={{
          isOpen: showAuthModal,
          onClose: () => setShowAuthModal(false),
          onSuccess: handleAuthSuccess,
          open: () => setShowAuthModal(true),
        }}
        onMoodCheckClick={handleAssessmentClick}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
            Transform Your Mood
            <br />
            One Game at a Time
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered wellness games designed to boost your emotional well-being and create lasting positive habits
          </p>
        </div>

        <div className="mb-8 sm:mb-12 md:mb-16">
          <h2 className="section-title font-semibold text-primary mb-6 text-center">
            {user ? (
              <>
                How are you feeling today?{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {isAdmin ? 'admin' : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'there')}
                </span>
              </>
            ) : (
              'How are you feeling today?'
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className="bg-muted/70 hover:bg-muted border border-border rounded-3xl p-4 sm:p-5 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-24 h-24 mx-auto" viewBox="0 0 53 53" aria-hidden="true">
                  <use href={`/track-your-mood.svg#${mood.symbol}`} width="53" height="53" />
                </svg>
                <p className="mt-2 text-base sm:text-lg font-semibold text-muted-foreground">{mood.label}</p>
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="text-center mt-6 text-primary font-medium animate-in fade-in duration-500">
              Great! Let’s find the perfect game to help you feel better
            </p>
          )}

          {recommendations.length > 0 && (
            <div className="mt-12 max-w-4xl mx-auto">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-6 text-center">Recommended for you</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {recommendations.map((g) => {
                  const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                  return (
                    <Link key={g.id} href={`/games/${slug}`} className="md:col-span-1" title={`Play ${g.title} - ${g.description}`}>
                      <div className="text-card-foreground group relative w-full max-w-[420px] aspect-square rounded-[24px] bg-white border-2 border-secondary/80 shadow-[0_8px_16px_rgba(75,52,37,0.05)] overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer perspective-1000 hover:transform hover:rotate-x-6 hover:rotate-y-6 hover:scale-105 transition-all duration-300">
                        <div className="flex h-full flex-col p-4 sm:p-5">
                          <div className="relative h-[46%] w-full overflow-hidden rounded-[24px] bg-[#D9D9D9]">
                            {g.cover_image_url ? (
                              <img src={g.cover_image_url} alt={g.title} title={g.title} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="h-full w-full relative bg-gray-100 flex items-center justify-center">
                                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600">{g.title.charAt(0).toUpperCase()}</div>
                              </div>
                            )}
                          </div>
                          <div className="mt-[11px]">
                            <h3 className="line-clamp-2 text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-[1.2] text-primary">{g.title}</h3>
                            <p className="mt-2 line-clamp-3 text-[12px] sm:text-[13px] leading-[1.35] text-[rgba(31,22,15,0.64)]">{g.description}</p>
                          </div>
                          <div className="mt-auto flex items-end justify-between pt-3">
                            <span className="text-[12px] sm:text-[13px] font-semibold text-primary">{g.category}</span>
                            <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-9 w-[120px] sm:w-[140px] rounded-[16px] bg-primary px-0 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-primary/90">PLAY NOW</button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <QuoteCarousel />

        {/* Most Popular Activity Session */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="section-title font-bold text-primary mb-2">
              Most Popular Activities
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {popularGames.length > 0 ? (
              popularGames.slice(0, 3).map((g, idx) => {
                const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                const durationBySlug: Record<string, string | undefined> = {
                  'diaphragmatic-breathing': '5-10 min',
                  'four-seven-eight-breathing': '3-5 min',
                };

                const badge = durationBySlug[slug] ?? g.category;

                return (
                  <Link key={g.id} href={`/games/${slug}`} className="md:col-span-1" title={`Play ${g.title} - ${g.description}`}>
                    <div className="text-card-foreground group relative w-full max-w-[420px] aspect-square rounded-[24px] bg-white border-2 border-secondary/80 shadow-[0_8px_16px_rgba(75,52,37,0.05)] overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer perspective-1000 hover:transform hover:rotate-x-6 hover:rotate-y-6 hover:scale-105 transition-all duration-300">
                      <div className="flex h-full flex-col p-4 sm:p-5">
                        <div className="relative h-[46%] w-full overflow-hidden rounded-[24px] bg-[#D9D9D9]">
                          {g.cover_image_url ? (
                              <img src={g.cover_image_url} alt={g.title} title={g.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="h-full w-full relative bg-gray-100 flex items-center justify-center">
                              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600">{g.title.charAt(0).toUpperCase()}</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-[11px]">
                          <h3 className="line-clamp-2 text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-[1.2] text-primary">{g.title}</h3>
                          <p className="mt-2 line-clamp-3 text-[12px] sm:text-[13px] leading-[1.35] text-[rgba(31,22,15,0.64)]">{g.description}</p>
                        </div>
                        <div className="mt-auto flex items-end justify-between pt-3">
                          <span className="text-[12px] sm:text-[13px] font-semibold text-primary">{g.category}</span>
                          <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-9 w-[120px] sm:w-[140px] rounded-[16px] bg-primary px-0 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-primary/90">PLAY NOW</button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // fallback static content if no popular games set
              <>
                <Link href="/games/box-breathing" className="md:col-span-1" title="Play Box Breathing - A simple breathing technique supported by CBT principles to help reduce stress">
                  <div className="text-card-foreground group relative w-full max-w-[420px] aspect-square rounded-[24px] bg-white border-2 border-secondary/80 shadow-[0_8px_16px_rgba(75,52,37,0.05)] overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer perspective-1000 hover:transform hover:rotate-x-6 hover:rotate-y-6 hover:scale-105 transition-all duration-300">
                    <div className="flex h-full flex-col p-4 sm:p-5">
                      <div className="relative h-[46%] w-full overflow-hidden rounded-[24px] bg-[#D9D9D9]">
                        <div className="h-full w-full relative bg-gray-100 flex items-center justify-center">
                          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600">B</div>
                        </div>
                      </div>
                      <div className="mt-[11px]">
                        <h3 className="line-clamp-2 text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-[1.2] text-primary">Box Breathing</h3>
                        <p className="mt-2 line-clamp-3 text-[12px] sm:text-[13px] leading-[1.35] text-[rgba(31,22,15,0.64)]">A simple breathing technique supported by CBT principles to help reduce stress.</p>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <span className="text-[12px] sm:text-[13px] font-semibold text-primary">Breathing</span>
                        <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-9 w-[120px] sm:w-[140px] rounded-[16px] bg-primary px-0 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-primary/90">PLAY NOW</button>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/games/diaphragmatic-breathing" className="md:col-span-1" title="Play Diaphragmatic Breathing - Deep belly breathing that activates your parasympathetic nervous system for instant calm and stress relief">
                  <div className="text-card-foreground group relative w-full max-w-[420px] aspect-square rounded-[24px] bg-white border-2 border-secondary/80 shadow-[0_8px_16px_rgba(75,52,37,0.05)] overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer perspective-1000 hover:transform hover:rotate-x-6 hover:rotate-y-6 hover:scale-105 transition-all duration-300">
                    <div className="flex h-full flex-col p-4 sm:p-5">
                      <div className="relative h-[46%] w-full overflow-hidden rounded-[24px] bg-[#D9D9D9]">
                        <img src="https://vsarsdunppymyunnjmqk.supabase.co/storage/v1/object/public/assets/1766410867830-download (3).jfif" alt="Diaphragmatic Breathing" title="Diaphragmatic Breathing" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <div className="mt-[11px]">
                        <h3 className="line-clamp-2 text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-[1.2] text-primary">Diaphragmatic Breathing</h3>
                        <p className="mt-2 line-clamp-3 text-[12px] sm:text-[13px] leading-[1.35] text-[rgba(31,22,15,0.64)]">Deep belly breathing that activates your parasympathetic nervous system for instant calm and stress relief.</p>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <span className="text-[12px] sm:text-[13px] font-semibold text-primary">Breathing</span>
                        <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-9 w-[120px] sm:w-[140px] rounded-[16px] bg-primary px-0 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-primary/90">PLAY NOW</button>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/games/four-seven-eight-breathing" className="md:col-span-1" title="Play 4-7-8 Breathing - The famous 4-7-8 technique for anxiety relief and better sleep">
                  <div className="text-card-foreground group relative w-full max-w-[420px] aspect-square rounded-[24px] bg-white border-2 border-secondary/80 shadow-[0_8px_16px_rgba(75,52,37,0.05)] overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer perspective-1000 hover:transform hover:rotate-x-6 hover:rotate-y-6 hover:scale-105 transition-all duration-300">
                    <div className="flex h-full flex-col p-4 sm:p-5">
                      <div className="relative h-[46%] w-full overflow-hidden rounded-[24px] bg-[#D9D9D9]">
                        <div className="h-full w-full relative bg-gray-100 flex items-center justify-center">
                          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600">4</div>
                        </div>
                      </div>
                      <div className="mt-[11px]">
                        <h3 className="line-clamp-2 text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-[1.2] text-primary">4-7-8 Breathing</h3>
                        <p className="mt-2 line-clamp-3 text-[12px] sm:text-[13px] leading-[1.35] text-[rgba(31,22,15,0.64)]">The famous 4-7-8 technique for anxiety relief and better sleep.</p>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <span className="text-[12px] sm:text-[13px] font-semibold text-primary">Breathing</span>
                        <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-9 w-[120px] sm:w-[140px] rounded-[16px] bg-primary px-0 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-primary/90">PLAY NOW</button>
                      </div>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        <Card className="mb-12 overflow-hidden rounded-[24px] border-2 border-secondary/80 bg-secondary/15">
          <CardContent className="p-4 sm:p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-start gap-5 flex-1">
                <div className="shrink-0 w-[72px] h-[72px] rounded-[20px] bg-primary flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-white" aria-hidden />
                </div>

                <div className="min-w-0">
                  <h2 className="section-title font-bold text-primary leading-tight">
                    Confused About Your Mental State?
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Take a short <span className="font-semibold">Scientifically</span> validated assessment to get clarity on your mood, stress, or anxiety.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto md:ml-auto">
                <Button
                  className="w-full md:w-auto h-10 sm:h-12 rounded-full px-8 bg-primary hover:bg-primary/90 text-sm sm:text-base font-semibold"
                  onClick={handleAssessmentClick}
                >
                  Start Assessment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ConsultantCarousel />

        <div className="mt-12 sm:mt-16 md:mt-24">
          <div className="text-center mb-12">
            <h2 className="section-title font-bold text-primary mb-4">
              What Mental Health Professionals Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Feedback from mental health professionals on how MoodLift supports emotional awareness and self-care.
            </p>
          </div>
          <TestimonialCarousel />
        </div>

        <div className="mb-16">
          <FAQSection
            title="Frequently Asked Questions"
            items={[
              {
                question: "What is MoodLift?",
                answer: "MoodLift is an AI-powered emotional wellness platform that combines psychometric assessments, therapeutic games, breathing exercises, and personalized recommendations to support your mental health journey."
              },
              {
                question: "How accurate are the mood assessments?",
                answer: "Our assessments use validated psychometric scales (PHQ-9, GAD-7, PANAS-SF) developed by leading mental health researchers. These are the same tools used in clinical settings worldwide."
              },
              {
                question: "Are the games scientifically backed?",
                answer: "Yes! All our games and activities are based on evidence-based therapeutic techniques like CBT, MBSR, DBT, and somatic practices. Each game comes with detailed information about its mood benefits."
              },
              {
                question: "Is my data secure and private?",
                answer: "Absolutely. We use enterprise-grade encryption, secure servers, and comply with GDPR and data protection regulations. Your personal data is never shared with third parties."
              },
              {
                question: "Can I use MoodLift as a replacement for therapy?",
                answer: "MoodLift is designed to complement, not replace, professional mental health treatment. If you're experiencing a mental health crisis, please reach out to a healthcare professional or crisis helpline immediately."
              },
              {
                question: "How do I pin my favorite games?",
                answer: "Simply click the pin icon on any game card to save it to your favorites. Your pinned games appear in the 'Your Favorites' section for quick access."
              }
            ]}
          />
        </div>
      </main>

      <AppFooter />

      <GoogleSignInPopup />
    </div>
  );
}
