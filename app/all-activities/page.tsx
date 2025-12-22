'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppFooter } from '@/components/app-footer';

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color_from: string;
  color_to: string;
  cover_image_url?: string;
}

const tailwindColorToHex: Record<string, string> = {
  'violet-400': '#a78bfa',
  'violet-500': '#8b5cf6',
  'purple-400': '#c084fc',
  'purple-500': '#a855f7',
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'rose-400': '#fb7185',
  'rose-500': '#f43f5e',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'amber-400': '#fbbf24',
  'amber-500': '#f59e0b',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'cyan-400': '#22d3ee',
  'cyan-500': '#06b6d4',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'indigo-400': '#818cf8',
  'indigo-500': '#6366f1',
};

const toHex = (value: string) => {
  if (!value) return '#9b87f5';
  if (value.startsWith('#')) return value;
  return tailwindColorToHex[value] || '#9b87f5';
};

const categoryToRoute: Record<string, string> = {
  'Box Breathing': 'box-breathing',
  'Alternate Nostril Breathing': 'alternate-nostril-breathing',
  'Diaphragmatic Breathing': 'diaphragmatic-breathing',
  '4-7-8 Breathing': 'four-seven-eight-breathing',
  'Cognitive Grounding': 'cognitive-grounding',
  'Physical Grounding': 'physical-grounding',
  'Describe Your Room': 'describe-room',
  'Name the Moment': 'name-the-moment',
  'Posture Reset': 'posture-reset',
  'Self-Soothing': 'self-soothing',
};

export default function AllActivities() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/seed-games');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setGames(data.data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-accent/10">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary">All Activities</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">All Activities & Favorites</h2>
          <p className="text-gray-600">Explore all therapeutic exercises to support your wellness</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <p className="text-gray-500">No activities available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const route = categoryToRoute[game.title] || game.title.toLowerCase().replace(/\s+/g, '-');
              const colorFrom = toHex(game.color_from);
              const colorTo = toHex(game.color_to);
              
              return (
                <Link key={game.id} href={`/games/${route}`}>
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow border-2 overflow-hidden">
                    <div className="relative h-24 overflow-hidden">
                      {game.cover_image_url ? (
                        <img
                          src={game.cover_image_url}
                          alt={game.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
                        />
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase">{game.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{game.title}</h3>
                      <p className="text-sm text-gray-600">{game.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
