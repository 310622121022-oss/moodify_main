'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Heart, Sparkles, Trophy, Calendar, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { UserProfile } from '@/components/user-profile';
import { AppFooter } from '@/components/app-footer';
import { useStreak } from '@/hooks/use-streak';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getUserProgress, getContributionHeatmap } from '@/lib/progress-service';
import StructuredData from '@/components/structured-data';

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
          const gameCount = activitiesRes.data.filter(a => a.activity_type === 'game').length;
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
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">Your Wellness Dashboard</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">Welcome back!</h2>
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
          <Card className="border-2">
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

          <Card className="border-2">
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
  
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Contribution Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">Your activity over the last 30 days</p>

                {/* Heatmap calendar: columns = weeks, rows = days (Sun-Sat) */}
                <div className="overflow-x-auto w-full">
                    <div className="flex items-start gap-3 py-3">
                      {/* build weeks from contributionHeatmap and render month/day axes */}
                      {(() => {
                        const rawDays = contributionHeatmap || [];
                        // focus on last 30 days
                        const now = new Date();
                        const thirtyAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
                        let days = rawDays
                          .filter(d => new Date(d.date) >= thirtyAgo)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                        if (days.length === 0) {
                          // generate the last 30 days with zero counts to show an empty grid
                          const startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
                          const generated: { date: string; count: number }[] = [];
                          for (let i = 0; i < 30; i++) {
                            const d = new Date(startDate);
                            d.setDate(startDate.getDate() + i);
                            generated.push({ date: d.toISOString().split('T')[0], count: 0 });
                          }
                          days = generated;
                        }

                        const start = new Date(days[0].date);
                        const startDay = start.getDay(); // 0 = Sun
                        const total = days.length;
                        const totalWeeks = Math.ceil((startDay + total) / 7);

                        const weeks: ( { date: string; count: number } | null)[][] = [];
                        for (let w = 0; w < totalWeeks; w++) {
                          weeks[w] = new Array(7).fill(null);
                        }

                        for (let i = 0; i < total; i++) {
                          const idx = (startDay + i) % 7;
                          const wk = Math.floor((startDay + i) / 7);
                          weeks[wk][idx] = days[i];
                        }

                        const maxCount = Math.max(1, ...days.map(d => d.count));
                        const shades = ['bg-gray-100', 'bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-700'];

                        // compute month labels per week (show month when it first appears in a week)
                        const monthLabels: (string | null)[] = new Array(totalWeeks).fill(null);
                        let lastMonth = '';
                        for (let w = 0; w < totalWeeks; w++) {
                          const week = weeks[w];
                          for (let d = 0; d < 7; d++) {
                            const cell = week[d];
                            if (cell) {
                              const m = new Date(cell.date).toLocaleString(undefined, { month: 'short' });
                              if (m !== lastMonth) {
                                monthLabels[w] = m;
                                lastMonth = m;
                              }
                              break;
                            }
                          }
                        }

                        return (
                          <div className="w-full">
                            {/* month axis */}
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 flex-shrink-0" />
                              <div className="flex items-center gap-3">
                                {monthLabels.map((m, i) => (
                                  <div key={i} className="w-6 text-xs text-muted-foreground text-center">
                                    {m || '\u00A0'}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex">
                              {/* day axis */}
                              <div className="flex flex-col mr-2 space-y-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                  <div key={d} className="text-xs text-muted-foreground h-6 w-10 flex items-center justify-end pr-2">{d}</div>
                                ))}
                              </div>

                              <div className="flex items-start gap-3">
                                {weeks.map((week, wi) => (
                                  <div key={wi} className="flex flex-col items-center gap-2">
                                    {week.map((cell, di) => {
                                      const count = cell?.count || 0;
                                      const intensity = count > 0 ? Math.min(4, Math.ceil((count / maxCount) * 4)) : 0;
                                      const cls = shades[intensity] || shades[0];
                                      const title = cell ? `${cell.date}: ${cell.count} activities` : '';
                                      return (
                                        <div key={di} className="w-6 h-6 rounded-sm border" title={title}>
                                          <div className={`${cls} w-6 h-6 rounded-sm`} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-r from-primary to-accent text-white border-0">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Ready for today's session?</h3>
                <p className="text-white/90">
                  Keep building your positive habits with a quick game
                </p>
              </div>
              <Link href="/">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-xs sm:text-sm md:text-base">
                  Play Now
                </Button>
              </Link>
            </div>
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

 