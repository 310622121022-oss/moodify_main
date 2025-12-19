'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Award, Target, Star } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { AppFooter } from '@/components/app-footer';
import { getUserProgress, UserProgress } from '@/lib/progress-service';
import StructuredData from '@/components/structured-data';

function ProgressContent() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const fetchProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserProgress(user.id);
    setProgress(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  // load todos for this user from localStorage
  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }
    try {
      const key = `todos_${user.id}`;
      const raw = localStorage.getItem(key);
      if (raw) setTodos(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading todos:', e);
    }
  }, [user]);

  // persist todos
  useEffect(() => {
    if (!user) return;
    try {
      const key = `todos_${user.id}`;
      localStorage.setItem(key, JSON.stringify(todos));
    } catch (e) {
      console.error('Error saving todos:', e);
    }
  }, [todos, user]);

  const addTodo = () => {
    const text = newTodo.trim();
    if (!text || !user) return;
    setTodos(prev => [{ id: `${Date.now()}`, text, done: false }, ...prev]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Loading your progress...</p>
          <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const weeklyProgress = progress?.weeklyActivity || [];
  const maxGames = weeklyProgress.length > 0 ? Math.max(...weeklyProgress.map(d => d.games)) : 1;
  const achievements = progress?.achievements.map(a => ({
    ...a,
    icon: [Star, Award, Target, TrendingUp, Star, Award][Math.floor(Math.random() * 6)],
  })) || [];
  const totalGames = progress?.totalGames || 0;
  const avgMood = progress?.avgMood || 0;
  const currentStreak = progress?.currentStreak || 0;
  const unlockedCount = achievements.filter(a => a.earned).length;
  const remaining = Math.max(0, 6 - unlockedCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <StructuredData script={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "MoodLift Progress",
        "url": "https://your-production-url.example.com/progress",
        "description": "Track your weekly activity, achievements and mood progress"
      }} />
      {/* Course schema for the AI Mood Assessment featured on the site */}
      <StructuredData script={{
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "AI Mood Assessment",
        "description": "A quick 2-3 minute psychometric mood assessment that provides personalized insights and recommended activities.",
        "provider": {
          "@type": "Organization",
          "name": "MoodLift",
          "url": "https://your-production-url.example.com"
        }
      }} />
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary">Your Progress</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">Track Your Growth</h2>
          <p className="text-muted-foreground">Celebrate your achievements and stay motivated</p>
        </div>

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-accent rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${(day.games / maxGames) * 100}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground">{day.day}</p>
                    <p className="text-xs text-primary font-semibold">{day.games}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Games</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{totalGames}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg Mood</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-accent">{avgMood.toFixed(1)}/10</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-accent">{currentStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-accent/10 to-primary/10 border-accent'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-primary to-accent'
                        : 'bg-gray-300'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-primary mb-1">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.earned && (
                      <p className="text-xs text-accent font-medium mt-2">Unlocked!</p>
                    )}
                  </div>
                );
              })}
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
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }}
                  placeholder="Add a quick task (e.g., Play a 5-min breathing game)"
                  className="flex-1 px-3 py-2 rounded border bg-white text-primary"
                />
                <Button onClick={addTodo} className="whitespace-nowrap">Add</Button>
              </div>

              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No todos yet. Add one to stay focused.</p>
                ) : (
                  todos.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                        <span className={`${t.done ? 'line-through text-muted-foreground' : 'text-primary'}`}>{t.text}</span>
                      </div>
                      <Button variant="ghost" onClick={() => removeTodo(t.id)}>Remove</Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary to-accent text-white border-0">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <Target className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Keep Going!</h3>
            <p className="text-lg text-white/90 mb-6">
              You're {remaining} achievement{remaining !== 1 ? 's' : ''} away from unlocking the "Wellness Champion" badge
            </p>
            <Link href="/">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Continue Your Journey
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}

export default function Progress() {
  return (
    <ProtectedRoute>
      <ProgressContent />
    </ProtectedRoute>
  );
}
