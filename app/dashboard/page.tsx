'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Heart, Sparkles, Trophy, Calendar, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { AppFooter } from '@/components/app-footer';
import { useStreak } from '@/hooks/use-streak';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getUserProgress, getContributionHeatmap } from '@/lib/progress-service';
import StructuredData from '@/components/structured-data';
import TodoList from '@/components/todo-list';
import { HomeNavbar } from '@/components/home-navbar';

interface RecentActivity {
  id: string;
  activity_type: string;
  points_earned: number;
  created_at: string;
  description: string;
}

function DashboardContent() {
  const { user } = useAuth();
  const { streakData, loading: streakLoading } = useStreak();
  const [streakHighlight, setStreakHighlight] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [moodAssessments, setMoodAssessments] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; games: number; mood: number }[]>([]);
  const [contributionHeatmap, setContributionHeatmap] = useState<{ date: string; count: number }[]>([]);

  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;

  useEffect(() => {
    if (currentStreak > 0 && !streakLoading) {
      setStreakHighlight(true);
      const timer = setTimeout(() => setStreakHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, streakLoading]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        const progress = await getUserProgress(user.id);
        setWeeklyActivity(progress?.weeklyActivity || []);
        // fetch year-long contribution heatmap
        try {
          const heat = await getContributionHeatmap(user.id);
          setContributionHeatmap(heat || []);
        } catch (e) {
          console.error('Error fetching contribution heatmap:', e);
        }
      } catch (e) {
        console.error('Error fetching progress for contribution grid:', e);
      }

      try {
        const [rewardsRes, activitiesRes, assessmentsRes] = await Promise.all([
          supabase
            .from('user_rewards')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('reward_activities')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('mood_assessments')
            .select('id')
            .eq('user_id', user.id)
            .eq('mood_result', null)
        ]);

        if (rewardsRes.data?.total_points !== undefined) {
          setTotalPoints(rewardsRes.data.total_points);
        }

        if (activitiesRes.data) {
          setRecentActivities(activitiesRes.data);
          const gameCount = (activitiesRes.data as RecentActivity[]).filter((a: RecentActivity) => a.activity_type === 'game').length;
          setGamesPlayed(gameCount);
        }

        if (assessmentsRes.data) {
          setMoodAssessments(assessmentsRes.data.length);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const stats = [
    { label: 'Games Played', value: gamesPlayed.toString(), icon: Trophy, color: 'from-yellow-400 to-orange-500' },
    {
      label: 'Current Streak',
      value: streakLoading ? '...' : currentStreak > 0 ? `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}` : '0 days',
      icon: Flame,
      color: 'from-orange-400 to-rose-500',
      highlight: streakHighlight && currentStreak > 0
    },
    {
      label: 'Total Points',
      value: totalPoints.toString(),
      icon: TrendingUp,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      label: 'Wellness Score',
      value: totalPoints > 0 ? ((totalPoints / 50).toFixed(1)) : '0',
      icon: Heart,
      color: 'from-pink-400 to-rose-500'
    },
  ];

  const personSchema = user ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.user_metadata?.full_name || user.email || 'User',
    "url": `https://your-production-url.example.com/users/${user.id}`,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <StructuredData script={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "MoodLift Dashboard",
        "url": "https://your-production-url.example.com/dashboard",
        "description": "Personal dashboard showing your streaks, points and recent activities"
      }} />
      {personSchema && <StructuredData script={personSchema} />}
      <HomeNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-8">
          <h2 className="section-title font-bold text-primary mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Here's your emotional wellness journey at a glance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isStreakCard = stat.label === 'Current Streak';
            return (
              <Card
                key={stat.label}
                className={`border-2 transition-all duration-500 ${
                  isStreakCard && stat.highlight
                    ? 'ring-4 ring-orange-400 shadow-2xl scale-105 animate-pulse'
                    : ''
                }`}
                style={{
                  backgroundColor: isStreakCard && stat.highlight ? '#FFF7ED' : undefined
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center transition-transform duration-500 ${
                      isStreakCard && stat.highlight ? 'scale-110 animate-bounce' : ''
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 transition-all duration-500 ${
                    isStreakCard && stat.highlight ? 'text-orange-600 scale-110' : ''
                  }`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {isStreakCard && longestStreak > 0 && (
                    <p className="text-xs text-orange-600 mt-2 font-semibold">
                      Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          <Card className="border-2 border-secondary/80 bg-white rounded-[24px]" style={{ boxShadow: '0 8px 24px rgba(67,38,122,0.08)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <p className="text-muted-foreground">Loading activities...</p>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const date = new Date(activity.created_at);
                    const today = new Date();
                    const isToday = date.toDateString() === today.toDateString();
                    const dateStr = isToday ? 'Today' : date.toLocaleDateString();

                    const activityLabels: { [key: string]: string } = {
                      'daily_login': 'Daily Login',
                      'assessment': 'Mood Assessment',
                      'game': 'Game Played',
                      'content_engagement': 'Content Engagement'
                    };

                    return (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium text-primary">{activityLabels[activity.activity_type]}</p>
                          <p className="text-sm text-muted-foreground">{dateStr}</p>
                        </div>
                        <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                          +{activity.points_earned} pts
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">No activities yet. Start by playing a game!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 max-w-[380px] mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStreak > 0 && (
                <div className="p-4 bg-gradient-to-br from-orange-50 to-rose-50 rounded-lg border-2 border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5" style={{ color: '#FF6B35' }} fill="#FF6B35" />
                    <p className="font-medium" style={{ color: '#3C1F71' }}>You're on a roll!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your {currentStreak}-day streak shows dedication. {currentStreak >= 7 ? 'Amazing commitment!' : 'Keep it up!'}
                  </p>
                </div>
              )}
              {totalPoints > 0 && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <p className="font-medium text-primary mb-2">Your Progress</p>
                  <p className="text-sm text-muted-foreground">
                    You've earned {totalPoints} points! {gamesPlayed > 0 ? `You've played ${gamesPlayed} game${gamesPlayed === 1 ? '' : 's'}.` : 'Start playing games to earn points.'}
                  </p>
                </div>
              )}
              {moodAssessments > 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <p className="font-medium text-primary mb-2">Mood Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    You've completed {moodAssessments} mood assessment{moodAssessments === 1 ? '' : 's'}. Keep monitoring your emotional well-being!
                  </p>
                </div>
              )}
              {currentStreak === 0 && totalPoints === 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <p className="font-medium text-primary mb-2">Get Started</p>
                  <p className="text-sm text-muted-foreground">
                    Begin your wellness journey by playing a game or taking a mood assessment to start earning points!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  
          {/* Contribution Activity removed per request */}

        <Card className="bg-gradient-to-r from-primary to-accent text-white border-2 border-secondary/80">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Ready for today's session?</h3>
                <p className="text-white/90">
                  Keep building your positive habits with a quick game
                </p>
              </div>
              <Link href="/" title="Go to home page to start playing games">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-xs sm:text-sm md:text-base">
                  Play Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Todo List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TodoList />
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

 