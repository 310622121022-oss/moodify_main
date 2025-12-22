'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Game {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  is_popular?: boolean;
}

export default function GamesCoversAdmin() {
  const { user } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAdminAndFetch();
  }, [user]);

  const checkAdminAndFetch = async () => {
    if (!user) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!data.isAdmin) {
        router.push('/admin/login');
        return;
      }

      await fetchGames();
    } catch (err) {
      setError('Failed to verify admin access');
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      const data = await response.json();
      setGames(data.games || []);
      if (data.games?.length > 0) {
        setSelectedGame(data.games[0]);
      }
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGame) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedGame),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('Save cover error:', data);
        throw new Error(data?.error || `Failed to save (${response.status})`);
      }

      setSuccess('Game cover updated successfully!');
      await fetchGames();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = (err as any)?.message || 'Failed to save game cover';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Manage Games Cover Images</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Games List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Games</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedGame?.id === game.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{game.title}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            {selectedGame && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedGame.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                    <Input
                      value={selectedGame.cover_image_url || ''}
                      onChange={(e) =>
                        setSelectedGame({
                          ...selectedGame,
                          cover_image_url: e.target.value,
                        })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="w-full"
                    />
                  </div>

                  {selectedGame.cover_image_url && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Preview</label>
                      <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={selectedGame.cover_image_url}
                          alt={selectedGame.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Most Popular</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="is_popular_cover"
                        type="checkbox"
                        checked={!!selectedGame.is_popular}
                        onChange={(e) => setSelectedGame({...selectedGame, is_popular: e.target.checked})}
                      />
                      <label htmlFor="is_popular_cover" className="text-sm text-muted-foreground">Pin this game as Most Popular</label>
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Cover Image'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
