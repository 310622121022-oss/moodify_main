'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

type Game = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color_from: string;
  color_to: string;
  cover_image_url?: string;
};

type GameDetails = {
  moodBenefits: string[];
  duration: string;
  howItHelps: string;
  gameUrl: string;
};

const gameDetailsMap: Readonly<{ [key: string]: GameDetails }> = {
  'Diaphragmatic Breathing': {
    moodBenefits: ['Reduces Stress', 'Improves Focus', 'Enhances Relaxation'],
    duration: '5-10 minutes',
    howItHelps: 'Deep belly breathing technique to reduce stress and anxiety naturally.',
    gameUrl: '/games/diaphragmatic-breathing'
  },
  'Box Breathing': {
    moodBenefits: ['Calms Mind', 'Reduces Anxiety', 'Improves Concentration'],
    duration: '4-8 minutes',
    howItHelps: 'Navy SEAL breathing technique for staying calm under pressure with 4-4-4-4 pattern.',
    gameUrl: '/games/box-breathing'
  },
  '4-7-8 Breathing': {
    moodBenefits: ['Promotes Better Sleep', 'Reduces Anxiety', 'Calms the Nervous System'],
    duration: '2-3 minutes',
    howItHelps: 'The famous 4-7-8 breathing technique popularized by Dr. Andrew Weil is a simple yet powerful method for anxiety relief and better sleep. By following the pattern of inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds, you activate your parasympathetic nervous system and experience deep relaxation.',
    gameUrl: '/games/4-7-8-breathing'
  },
  'Alternate Nostril Breathing': {
    moodBenefits: ['Balances Brain Hemispheres', 'Promotes Deep Relaxation', 'Enhances Mental Clarity'],
    duration: '5-10 minutes',
    howItHelps: 'This ancient yogic breathing technique alternates airflow between nostrils to balance the left and right brain hemispheres. By harmonizing your nervous system, it reduces stress, improves focus, and creates a profound sense of calm and mental clarity.',
    gameUrl: '/games/alternate-nostril-breathing'
  },
  'Describe Your Room': {
    moodBenefits: ['Improves Presence', 'Grounds in Reality', 'Enhances Sensory Awareness'],
    duration: '1-2 minutes',
    howItHelps: 'Use mindfulness to anchor yourself in the present moment by describing your surroundings in detail. This grounding technique helps redirect anxious thoughts and brings you into the here-and-now through sensory awareness.',
    gameUrl: '/games/describe-room'
  },
  'Name the Moment': {
    moodBenefits: ['Builds Self-Compassion', 'Reduces Emotional Overwhelm', 'Strengthens Inner Resilience'],
    duration: '2-3 minutes',
    howItHelps: 'This guided self-reassurance exercise helps you acknowledge difficult emotions with kindness and compassion. By speaking affirmations and reassurances to yourself, you rewire your nervous system to respond to stress with self-support instead of self-criticism, building lasting emotional resilience.',
    gameUrl: '/games/name-the-moment'
  },
  'Physical Grounding': {
    moodBenefits: ['Anchors You in Your Body', 'Releases Trauma Responses', 'Activates Safety Signals'],
    duration: '5-10 minutes',
    howItHelps: 'Engage your five senses through tactile and physical experiences to bring you fully into the present moment. This somatic grounding technique interrupts the stress response cycle by signaling to your nervous system that you are safe, helping you move out of fight-or-flight mode into calm awareness.',
    gameUrl: '/games/physical-grounding'
  },
  'Posture Reset': {
    moodBenefits: ['Releases Physical Tension', 'Improves Body Awareness', 'Restores Natural Alignment'],
    duration: '1-1.5 minutes',
    howItHelps: 'Your body and mind are deeply connected. By intentionally adjusting your posture and releasing tension through gentle movements, you signal to your nervous system that you are safe and grounded. This practice helps you reclaim your physical presence and mental clarity.',
    gameUrl: '/games/posture-reset'
  },
  'Self-Soothing': {
    moodBenefits: ['Soothes Emotional Pain', 'Provides Immediate Relief', 'Builds Distress Tolerance'],
    duration: '5-10 minutes',
    howItHelps: 'Drawing from Dialectical Behavior Therapy (DBT), this technique teaches you to soothe yourself through multisensory engagement. By intentionally activating your senses—touch, smell, taste, sight, sound—you create a safe container for emotional pain and build your capacity to tolerate distressing moments.',
    gameUrl: '/games/self-soothing'
  },
  'CBT Thought-Challenger': {
    moodBenefits: ['Challenges Negative Thinking', 'Reduces Anxiety', 'Builds Emotional Resilience'],
    duration: '10-15 minutes',
    howItHelps: 'Using Cognitive Behavioral Therapy techniques, challenge automatic negative thoughts by examining the evidence for and against them. Develop balanced, realistic perspectives that reduce anxiety, low mood, and self-criticism through cognitive restructuring.',
    gameUrl: '/games/cbt-thought-challenger'
  },
  'Affirmation Mirror': {
    moodBenefits: ['Boosts Self-Esteem', 'Builds Self-Compassion', 'Reduces Negative Self-Talk'],
    duration: '5-10 minutes',
    howItHelps: 'Transform negative self-talk into powerful, personalized affirmations that rewire your brain toward self-compassion. By mirroring empowering statements back to yourself, you create new neural pathways that support lasting confidence, resilience, and emotional wellbeing.',
    gameUrl: '/games/affirmation-mirror'
  },
  'Worry Box': {
    moodBenefits: ['Reduces Mental Clutter', 'Prevents Rumination', 'Increases Emotional Control'],
    duration: '3-5 minutes',
    howItHelps: 'Externalize your worries by placing them somewhere safe—outside your mind. This CBT-based technique helps your brain interpret the worry as "stored and contained," reducing its emotional intensity. When worries feel infinite in your head, simply writing them down and placing them away creates essential psychological distance.',
    gameUrl: '/games/worry-box'
  }
};

export function GamesSection() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [pinnedGames, setPinnedGames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchGames();
    if (user) {
      fetchPinnedGames();
    }
  }, [user]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPinnedGames = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'game');

      if (error) throw error;
      setPinnedGames(new Set(data?.map(f => f.item_id) || []));
    } catch (error) {
      console.error('Error fetching pinned games:', error);
    }
  };

  const togglePin = useCallback(async (gameId: string) => {
    if (!user) return;

    try {
      const isPinned = pinnedGames.has(gameId);

      if (isPinned) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'game')
          .eq('item_id', gameId);

        if (error) throw error;

        const newPinned = new Set(pinnedGames);
        newPinned.delete(gameId);
        setPinnedGames(newPinned);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            item_type: 'game',
            item_id: gameId,
          });

        if (error) throw error;

        const newPinned = new Set(pinnedGames);
        newPinned.add(gameId);
        setPinnedGames(newPinned);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, [user, pinnedGames]);

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

  const parseColorFromString = (colorStr: string): string => {
    if (colorStr.startsWith('#')) {
      return colorStr;
    }
    // Handle Tailwind color names
    const tailwindColors: { [key: string]: string } = {
      'violet-400': '#a78bfa', 'violet-500': '#8b5cf6',
      'purple-400': '#c084fc', 'purple-500': '#a855f7',
      'pink-400': '#f472b6', 'pink-500': '#ec4899',
      'rose-400': '#fb7185', 'rose-500': '#f43f5e',
      'red-400': '#f87171', 'red-500': '#ef4444',
      'orange-400': '#fb923c', 'orange-500': '#f97316',
      'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
      'yellow-400': '#facc15', 'yellow-500': '#eab308',
      'lime-400': '#a3e635', 'lime-500': '#84cc16',
      'green-400': '#4ade80', 'green-500': '#22c55e',
      'emerald-400': '#34d399', 'emerald-500': '#10b981',
      'teal-400': '#2dd4bf', 'teal-500': '#14b8a6',
      'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
      'blue-400': '#60a5fa', 'blue-500': '#3b82f6',
      'indigo-400': '#818cf8', 'indigo-500': '#6366f1',
      'stone-400': '#a1a1aa', 'stone-500': '#71717a',
    };
    return tailwindColors[colorStr] || '#9b87f5';
  };

  const handleCardClick = useCallback((game: Game) => {
    setSelectedGame(game);
    setIsDialogOpen(true);
  }, []);

  const getGameDetails = useCallback((gameTitle: string): GameDetails => {
    return gameDetailsMap[gameTitle] || {
      moodBenefits: ['Improves Wellbeing', 'Reduces Stress', 'Enhances Mood'],
      duration: '5-10 minutes',
      howItHelps: 'This activity is designed to support your emotional wellness and mental health.',
      gameUrl: '/games/mindful-moments'
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-2 animate-pulse">
            <div className="h-32 sm:h-40 bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4 sm:p-6">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${filterCategory === null ? 'bg-primary text-white border-primary' : 'bg-white/60 text-primary border-gray-200'}`}
        >
          All
        </button>
        {Array.from(new Set(games.map(g => g.category))).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${filterCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white/60 text-primary border-gray-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {(filterCategory ? games.filter(g => g.category === filterCategory) : games).map((game, index) => {
          const isPinned = pinnedGames.has(game.id);
          const colorFrom = game.color_from || (game as any).colors?.split('-')[0] || '#9b87f5';
          const colorTo = game.color_to || (game as any).colors?.split('-')[1] || '#7c3aed';
          const parsedFrom = parseColorFromString(colorFrom);
          const parsedTo = parseColorFromString(colorTo);
          
          return (
            <Card
              key={game.id}
              className="group relative border-2 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleCardClick(game)}
            >
            <div
              className="h-2 transition-all duration-300"
              style={{
                background: `linear-gradient(to right, ${parsedFrom}, ${parsedTo})`,
              }}
            />

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(game.id);
                }}
                className={`absolute top-4 right-4 z-10 transition-all duration-300 ${
                  isPinned
                    ? 'text-white bg-white/20 backdrop-blur-sm hover:bg-white/30'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50 backdrop-blur-sm'
                }`}
                aria-label={isPinned ? 'Unpin game' : 'Pin game'}
              >
                <Pin
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isPinned ? 'fill-current rotate-45' : ''
                  }`}
                />
              </Button>
            )}

            {game.cover_image_url ? (
              <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img
                  src={game.cover_image_url}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="relative h-28 sm:h-32 md:h-36 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${parsedFrom}, ${parsedTo})`,
                }}
              >
                <div className="text-5xl sm:text-6xl md:text-7xl transform transition-transform duration-300 group-hover:scale-110">
                  {getIconComponent(game.icon)}
                </div>
              </div>
            )}

            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                  {game.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                {game.description}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span
                  className="text-xs font-semibold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap"
                  style={{
                    background: `linear-gradient(to right, ${parsedFrom}20, ${parsedTo}20)`,
                    color: parsedFrom,
                  }}
                >
                  {game.category}
                </span>
                <Button
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(game);
                  }}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Play
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        {selectedGame && (() => {
          const dialogColorFrom = selectedGame.color_from || (selectedGame as any).colors?.split('-')[0] || '#9b87f5';
          const dialogColorTo = selectedGame.color_to || (selectedGame as any).colors?.split('-')[1] || '#7c3aed';
          const dialogParsedFrom = parseColorFromString(dialogColorFrom);
          const dialogParsedTo = parseColorFromString(dialogColorTo);
          
          return (
          <>
            <DialogHeader>
              <div
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${dialogParsedFrom}, ${dialogParsedTo})`,
                }}
              >
                <span className="text-4xl sm:text-5xl">{getIconComponent(selectedGame.icon)}</span>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl text-center line-clamp-2" style={{ color: '#3C1F71' }}>
                {selectedGame.title}
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                {selectedGame.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6 py-4">
              <div>
                <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3" style={{ color: '#3C1F71' }}>
                  How This Lifts Your Mood
                </h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {getGameDetails(selectedGame.title).howItHelps}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3" style={{ color: '#3C1F71' }}>
                  Mood Benefits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getGameDetails(selectedGame.title).moodBenefits.map((benefit, idx) => (
                    <span
                      key={idx}
                      className="px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium border-2"
                      style={{
                        borderColor: dialogParsedFrom,
                        color: dialogParsedFrom,
                        backgroundColor: `${dialogParsedFrom}10`,
                      }}
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#E2DAF5' }}>
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: '#3C1F71' }}>Duration</p>
                  <p className="text-sm sm:text-lg font-bold" style={{ color: '#3C1F71' }}>
                    {getGameDetails(selectedGame.title).duration}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: '#3C1F71' }}>Category</p>
                  <p className="text-sm sm:text-lg font-bold truncate" style={{ color: '#3C1F71' }}>
                    {selectedGame.category}
                  </p>
                </div>
              </div>

              <div className="pt-4 sm:pt-6">
                <Link href={getGameDetails(selectedGame.title).gameUrl} className="w-full">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r text-xs sm:text-sm md:text-base from-primary to-accent hover:opacity-90 transition-opacity py-4 sm:py-6"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Playing Now
                  </Button>
                </Link>
              </div>
            </div>
          </>
          );
        })()}
      </DialogContent>
    </Dialog>
    </>
  );
}
