'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ClipboardList, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
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

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    
    if (user) {
      await saveDailyMood(user.id, moodId as MoodType);
    }
    
    const gameRecommendations = getGameRecommendations(moodId as MoodType);
    setRecommendations(gameRecommendations);
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
          "@type": "WebPage",
          "name": "MoodLift - Home",
          "url": "https://your-production-url.example.com/",
          "description": "AI-powered wellness games to improve emotional well-being",
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
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl sm:text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MoodLift
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleAssessmentClick}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Mood Check
              </Button>
              {user && (
                <>
                  <Link href="/games">
                    <Button variant="ghost" size="sm">Games</Button>
                  </Link>
                  <Link href="/discover">
                    <Button variant="ghost" size="sm">Discover</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <Link href="/progress">
                    <Button variant="ghost" size="sm">Progress</Button>
                  </Link>
                </>
              )}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E2DAF5' }}>
                        <UserIcon className="w-4 h-4" style={{ color: '#3C1F71' }} />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} size="sm" style={{ backgroundColor: '#3C1F71' }}>
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm"
                onClick={() => {
                  handleAssessmentClick();
                  setMobileMenuOpen(false);
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Mood Check
              </Button>
              {user && (
                <>
                  <Link href="/games" className="block">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Games
                    </Button>
                  </Link>
                  <Link href="/discover" className="block">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Discover
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="block">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/progress" className="block">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Progress
                    </Button>
                  </Link>
                </>
              )}
              {user ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full text-sm"
                  style={{ backgroundColor: '#3C1F71' }}
                >
                  Login
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

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
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-6 text-center">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, idx) => (
                  <Link key={idx} href={rec.url}>
                    <Card className="border-2 cursor-pointer hover:shadow-lg transition-all h-full">
                      <CardHeader>
                        <div className="text-4xl mb-2">{rec.emoji}</div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <p className="text-xs text-accent font-medium">✨ {rec.reason}</p>
                        <Button className="w-full sm:w-auto bg-gradient-to-r text-xs sm:text-sm md:text-base from-primary to-accent hover:opacity-90">
                          Play Now
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <QuoteCarousel />

        {/* Most Popular Activity Session */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
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
                  <Link key={g.id} href={`/games/${slug}`} className="md:col-span-1">
                    <div className="bg-secondary/50 shadow-lg hover:shadow-xl transition-all h-full rounded-[32px] p-3">
                      <div className="bg-white rounded-[32px] overflow-hidden h-full flex flex-col min-h-[240px]">
                        <div className="relative h-[96px] bg-muted-foreground/15 flex items-center justify-center overflow-hidden">
                          {g.cover_image_url ? (
                            <img src={g.cover_image_url} alt={g.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span className="text-6xl" aria-hidden>
                              {getIconComponent(g.icon)}
                            </span>
                          )}
                        </div>

                        <div className="px-6 pb-6 pt-3 flex-1 flex flex-col gap-3">
                          <h3 className="inline-flex self-center items-center justify-center rounded-full bg-secondary/50 px-5 h-[28px] text-[14px] font-semibold leading-none text-primary whitespace-nowrap uppercase text-center">
                            {g.title}
                          </h3>
                          <p className="text-sm text-primary/60 leading-relaxed">{g.description}</p>

                          <div className="mt-auto pt-3 flex justify-center">
                            <Button className="w-[120px] h-[32px] px-0 rounded-full bg-primary text-white hover:bg-primary/90 text-sm font-semibold leading-none">
                              Start Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // fallback static content if no popular games set
              <>
                <Link href="/games/box-breathing" className="md:col-span-1">
                  <div className="bg-secondary/50 shadow-lg hover:shadow-xl transition-all h-full rounded-[32px] p-3">
                    <div className="bg-white rounded-[32px] overflow-hidden h-full flex flex-col min-h-[240px]">
                      <div className="relative h-[96px] bg-muted-foreground/15 flex items-center justify-center overflow-hidden">
                        <span className="text-6xl" aria-hidden>
                          🫁
                        </span>
                      </div>

                      <div className="px-6 pb-6 pt-3 flex-1 flex flex-col gap-3">
                        <h3 className="inline-flex self-center items-center justify-center rounded-full bg-secondary/50 px-5 h-[28px] text-[14px] font-semibold leading-none text-primary whitespace-nowrap uppercase text-center">
                          Box Breathing
                        </h3>
                        <p className="text-sm text-primary/60 leading-relaxed">A simple breathing technique supported by CBT principles to help reduce stress.</p>
                        <div className="mt-auto pt-3 flex justify-center">
                          <Button className="w-[120px] h-[32px] px-0 rounded-full bg-primary text-white hover:bg-primary/90 text-sm font-semibold leading-none">
                            Start Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/games/diaphragmatic-breathing" className="md:col-span-1">
                  <div className="bg-secondary/50 shadow-lg hover:shadow-xl transition-all h-full rounded-[32px] p-3">
                    <div className="bg-white rounded-[32px] overflow-hidden h-full flex flex-col min-h-[240px]">
                      <div className="relative h-[96px] bg-muted-foreground/15 flex items-center justify-center overflow-hidden">
                        <span className="text-6xl" aria-hidden>
                          💨
                        </span>
                      </div>

                      <div className="px-6 pb-6 pt-3 flex-1 flex flex-col gap-3">
                        <h3 className="inline-flex self-center items-center justify-center rounded-full bg-secondary/50 px-5 h-[28px] text-[14px] font-semibold leading-none text-primary whitespace-nowrap uppercase text-center">
                          Diaphragmatic Breathing
                        </h3>
                        <p className="text-sm text-primary/60 leading-relaxed">Deep belly breathing that activates your parasympathetic nervous system for instant calm.</p>
                        <div className="mt-auto pt-3 flex justify-center">
                          <Button className="w-[120px] h-[32px] px-0 rounded-full bg-primary text-white hover:bg-primary/90 text-sm font-semibold leading-none">
                            Start Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/games/four-seven-eight-breathing" className="md:col-span-1">
                  <div className="bg-secondary/50 shadow-lg hover:shadow-xl transition-all h-full rounded-[32px] p-3">
                    <div className="bg-white rounded-[32px] overflow-hidden h-full flex flex-col min-h-[240px]">
                      <div className="relative h-[96px] bg-muted-foreground/15 flex items-center justify-center overflow-hidden">
                        <span className="text-6xl" aria-hidden>
                          🌙
                        </span>
                      </div>

                      <div className="px-6 pb-6 pt-3 flex-1 flex flex-col gap-3">
                        <h3 className="inline-flex self-center items-center justify-center rounded-full bg-secondary/50 px-5 h-[28px] text-[14px] font-semibold leading-none text-primary whitespace-nowrap uppercase text-center">
                          4-7-8 Breathing
                        </h3>
                        <p className="text-sm text-primary/60 leading-relaxed">The famous 4-7-8 technique for anxiety relief and better sleep.</p>
                        <div className="mt-auto pt-3 flex justify-center">
                          <Button className="w-[120px] h-[32px] px-0 rounded-full bg-primary text-white hover:bg-primary/90 text-sm font-semibold leading-none">
                            Start Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        <Card className="mb-12 overflow-hidden border-0 bg-accent/20">
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
                  <Button
                    className="w-full md:w-auto h-11 rounded-md px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm md:text-base"
                    onClick={handleAssessmentClick}
                  >
                    Start Assessment
                  </Button>
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

        <ConsultantCarousel />

        <div className="mt-12 sm:mt-16 md:mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people improving their mental wellness with MoodLift
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

      <footer className="border-t mt-8 bg-gradient-to-br from-white via-secondary/20 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MoodLift
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI-powered companion for emotional wellness and mental health support.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/assessment" className="hover:text-primary transition-colors">
                    Mood Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/games" className="hover:text-primary transition-colors">
                    Wellness Games
                  </Link>
                </li>
                <li>
                  <Link href="/books" className="hover:text-primary transition-colors">
                    Book Recommendations
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/progress" className="hover:text-primary transition-colors">
                    Track Progress
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/discover" className="hover:text-primary transition-colors">
                    Discover
                  </Link>
                </li>
                <li>
                  <Link href="/rewards" className="hover:text-primary transition-colors">
                    Rewards
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href="https://hexpertify-blog-sigma.vercel.app/"
                    className="hover:text-primary transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-center md:text-left">
                2024 MoodLift. All rights reserved. Your mental health matters.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <GoogleSignInPopup />
    </div>
  );
}
