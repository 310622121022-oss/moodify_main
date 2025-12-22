'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppFooter } from '@/components/app-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeoMetadata {
  id: string;
  page_url: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_title?: string;
  og_description?: string;
  twitter_card: string;
  canonical_url?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_color: string;
  genre: string;
  cover_image_url?: string;
  recommended_by?: string;
  recommendation_reason?: string;
  amazon_affiliate_link?: string;
  flipkart_affiliate_link?: string;
  affiliate_link?: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color_from: string;
  color_to: string;
  cover_image_url?: string;
  is_popular?: boolean;
}

interface Testimonial {
  id: string;
  user_name: string;
  user_title: string | null;
  feedback: string;
  rating: number;
  avatar_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface Asset {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

interface Consultant {
  id: string;
  full_name: string;
  title?: string | null;
  picture_url?: string | null;
  booking_url?: string | null;
  is_active?: boolean;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [metadata, setMetadata] = useState<SeoMetadata[]>([]);
  const [selectedPage, setSelectedPage] = useState<SeoMetadata | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isAddingConsultant, setIsAddingConsultant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, [user]);

  const withTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  };

  const parseJsonSafe = async (response: Response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };

  const checkAdminAndFetch = async () => {
    // Allow development access without user
    if (!user && process.env.NODE_ENV === 'production') {
      router.push('/admin/login');
      return;
    }

    try {
      if (user) {
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
      }

      await Promise.all([
        withTimeout(fetchMetadata()),
        withTimeout(fetchBooks()),
        withTimeout(fetchGames()),
        withTimeout(fetchTestimonials()),
        withTimeout(fetchConsultants())
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Admin check error:', err);
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await fetch('/api/admin/seo-metadata');
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError(data?.error || `Failed to load SEO metadata (${response.status})`);
        return;
      }
      setMetadata(data.metadata || []);
      if (data.metadata?.length > 0) {
        setSelectedPage(data.metadata[0]);
      }
    } catch (err) {
      console.error('Failed to load SEO metadata:', err);
      setError('Failed to load SEO metadata');
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books');
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError(data?.error || `Failed to load books (${response.status})`);
        return;
      }
      setBooks(data.books || []);
    } catch (err) {
      console.error('Failed to load books:', err);
      setError('Failed to load books');
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError(data?.error || `Failed to load games (${response.status})`);
        return;
      }
      setGames(data.games || []);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError('Failed to load games');
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/testimonials');
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError(data?.error || `Failed to load testimonials (${response.status})`);
        return;
      }
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      setError('Failed to load testimonials');
    }
  };

  const fetchConsultants = async () => {
    try {
      const response = await fetch('/api/admin/consultants');
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError(data?.error || `Failed to load consultants (${response.status})`);
        return;
      }
      if (data?.error) {
        setError(data.error);
        return;
      }
      setConsultants(data.consultants || []);
    } catch (err) {
      console.error('Failed to load consultants:', err);
      setError('Failed to load consultants');
    }
  };


  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await parseJsonSafe(response);
        throw new Error(errData?.error || 'Upload failed');
      }

      const data = await parseJsonSafe(response);
      const url = data?.url || data?.asset?.url;
      const assetName = data?.name || data?.asset?.name;

      if (url) {
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 2000);
        return url;
      }

      // If API returned a name but not a URL, derive the public URL from the name.
      if (assetName && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const derivedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${assetName}`;
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 2000);
        return derivedUrl;
      }

      throw new Error('Upload succeeded but no URL was returned');
    } catch (err) {
      console.error('Failed to upload cover image:', err);
      setError('Failed to upload image');
      return null;
    }
  };

  // Note: book file uploads removed; use affiliate links instead.

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/seo-metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPage),
      });

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      setSuccess('SEO metadata updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save metadata. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (selectedPage) {
      setSelectedPage({ ...selectedPage, [field]: value });
    }
  };

  const handleBookSave = async () => {
    if (!selectedBook?.title || !selectedBook?.author) {
      setError('Title and author are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const method = selectedBook.id && !isAddingBook ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/books', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedBook),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Save book error:', data);
        throw new Error(data?.error || 'Failed to save book');
      }

      const savedBook = data?.book;
      setSuccess('Book saved successfully!');
      await fetchBooks();
      setIsAddingBook(false);
      if (savedBook) {
        setSelectedBook(savedBook);
      } else {
        setSelectedBook(null);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = (err as any)?.message || 'Failed to save book';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/admin/books?id=${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete book');
      
      setSuccess('Book deleted successfully!');
      await fetchBooks();
      setSelectedBook(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete book');
    }
  };

  const handleGameSave = async () => {
    if (!selectedGame?.title || !selectedGame?.description) {
      setError('Title and description are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const method = selectedGame.id && !isAddingGame ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/games', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedGame),
      });

      const data = await parseJsonSafe(response);
      if (!response.ok) {
        console.error('Save game error:', data);
        throw new Error(data?.error || `Failed to save game (${response.status})`);
      }
      
      setSuccess('Game saved successfully!');
      await fetchGames();
      setIsAddingGame(false);
      setSelectedGame(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = (err as any)?.message || 'Failed to save game';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;

    try {
      const response = await fetch(`/api/admin/games?id=${gameId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete game');
      
      setSuccess('Game deleted successfully!');
      await fetchGames();
      setSelectedGame(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete game');
    }
  };

  const handleAddNewGame = () => {
    setIsAddingGame(true);
    setSelectedGame({
      id: '',
      title: '',
      description: '',
      category: 'Breathing',
      icon: 'heart',
      color_from: '#3B82F6',
      color_to: '#8B5CF6',
      cover_image_url: '',
    });
  };

  const handleAddNewBook = () => {
    setIsAddingBook(true);
    setSelectedBook({
      id: '',
      title: '',
      author: '',
      description: '',
      cover_color: '#9b87f5',
      genre: 'Self-Help',
      cover_image_url: '',
      recommended_by: '',
      recommendation_reason: '',
      amazon_affiliate_link: '',
      flipkart_affiliate_link: '',
      affiliate_link: '',
    });
  };

  const handleTestimonialSave = async () => {
    if (!selectedTestimonial?.user_name || !selectedTestimonial?.feedback) {
      setError('User name and feedback are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const method = selectedTestimonial.id && !isAddingTestimonial ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTestimonial),
      });

      if (!response.ok) throw new Error('Failed to save testimonial');
      
      setSuccess('Testimonial saved successfully!');
      await fetchTestimonials();
      setIsAddingTestimonial(false);
      setSelectedTestimonial(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/admin/testimonials?id=${testimonialId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete testimonial');
      
      setSuccess('Testimonial deleted successfully!');
      await fetchTestimonials();
      setSelectedTestimonial(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete testimonial');
    }
  };

  const handleConsultantSave = async () => {
    if (!selectedConsultant?.full_name) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const method = selectedConsultant.id && !isAddingConsultant ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/consultants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedConsultant),
      });

      let data: any = {};
      try { data = await response.json(); } catch (e) { data = {}; }
      if (!response.ok) {
        console.error('Save consultant error:', data);
        const msg = data?.error || 'Failed to save consultant';
        setError(msg);
        throw new Error(msg);
      }

      const saved = data?.consultant;
      setSuccess('Consultant saved successfully!');
      await fetchConsultants();
      setIsAddingConsultant(false);
      if (saved) setSelectedConsultant(saved);
      else setSelectedConsultant(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save consultant:', err);
      if (!error) {
        // if server didn't already set a helpful message, set a generic one
        setError(err instanceof Error ? err.message : 'Failed to save consultant');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsultant = async (consultantId: string) => {
    if (!window.confirm('Are you sure you want to delete this consultant?')) return;

    try {
      const response = await fetch(`/api/admin/consultants?id=${consultantId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete consultant');
      setSuccess('Consultant deleted successfully!');
      await fetchConsultants();
      setSelectedConsultant(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete consultant:', err);
      setError('Failed to delete consultant');
    }
  };

  const handleAddNewConsultant = () => {
    setIsAddingConsultant(true);
    setSelectedConsultant({ id: '', full_name: '', title: '', picture_url: '', booking_url: '', is_active: true });
  };

  const handleAddNewTestimonial = () => {
    setIsAddingTestimonial(true);
    setSelectedTestimonial({
      id: '',
      user_name: '',
      user_title: '',
      feedback: '',
      rating: 5,
      avatar_url: '',
      display_order: testimonials.length,
      is_active: true,
    });
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pages">Page SEO Metadata</TabsTrigger>
            <TabsTrigger value="books">Book Recommendations</TabsTrigger>
            <TabsTrigger value="games">Games Details</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="consultants">Consultants</TabsTrigger>
            <TabsTrigger value="faqs" asChild>
              <Link href="/admin/dashboard/faqs" className="cursor-pointer">
                FAQs
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pages List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pages</CardTitle>
                    <CardDescription>Select a page to edit</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {metadata.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedPage?.id === page.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium truncate">{page.page_url}</div>
                        <div className="text-sm text-muted-foreground truncate">{page.title}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Edit Form */}
              <div className="lg:col-span-2">
                {selectedPage ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit SEO Metadata</CardTitle>
                      <CardDescription>{selectedPage.page_url}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Page URL</label>
                        <Input
                          value={selectedPage.page_url}
                          onChange={(e) => handleChange('page_url', e.target.value)}
                          placeholder="e.g., /books, /, /resources"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Page Title</label>
                        <Input
                          value={selectedPage.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder="Enter page title (50-60 characters recommended)"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Meta Description</label>
                        <Textarea
                          value={selectedPage.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Enter meta description (150-160 characters recommended)"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Keywords</label>
                        <Input
                          value={selectedPage.keywords}
                          onChange={(e) => handleChange('keywords', e.target.value)}
                          placeholder="Comma-separated keywords"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Open Graph Image URL</label>
                        <Input
                          value={selectedPage.og_image}
                          onChange={(e) => handleChange('og_image', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Open Graph Title</label>
                        <Input
                          value={selectedPage.og_title || ''}
                          onChange={(e) => handleChange('og_title', e.target.value)}
                          placeholder="Title shown when shared (leave blank to use Meta Title)"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Open Graph Description</label>
                        <Textarea
                          value={selectedPage.og_description || ''}
                          onChange={(e) => handleChange('og_description', e.target.value)}
                          placeholder="Description shown when shared (leave blank to use Meta Description)"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Twitter Card Type</label>
                        <Input
                          value={selectedPage.twitter_card}
                          onChange={(e) => handleChange('twitter_card', e.target.value)}
                          placeholder="summary_large_image"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Canonical URL</label>
                        <Input
                          value={selectedPage.canonical_url || ''}
                          onChange={(e) => handleChange('canonical_url', e.target.value)}
                          placeholder="https://moodlift.app/page"
                        />
                        <p className="text-xs text-muted-foreground">The preferred URL for this page for search engines</p>
                      </div>

                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full gap-2 mt-6"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Select a page to edit SEO metadata</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consultants" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Consultants</CardTitle>
                      <CardDescription>Manage consultant carousel items</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAddNewConsultant} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {consultants.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setIsAddingConsultant(false); setSelectedConsultant(c); }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                          selectedConsultant?.id === c.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium truncate">{c.full_name}</div>
                        <div className="text-xs text-muted-foreground">{c.title}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedConsultant ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{isAddingConsultant ? 'Add New Consultant' : 'Edit Consultant'}</CardTitle>
                      <CardDescription>Manage consultant details shown in the homepage carousel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={selectedConsultant.full_name}
                          onChange={(e) => setSelectedConsultant({...selectedConsultant, full_name: e.target.value})}
                          placeholder="Full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={selectedConsultant.title || ''}
                          onChange={(e) => setSelectedConsultant({...selectedConsultant, title: e.target.value})}
                          placeholder="e.g., Licensed Therapist"
                        />
                      </div>



                      <div className="space-y-2">
                        <label className="text-sm font-medium">Picture URL</label>
                        <Input
                          type="url"
                          value={selectedConsultant.picture_url || ''}
                          onChange={(e) => setSelectedConsultant({...selectedConsultant, picture_url: e.target.value})}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Booking URL</label>
                        <Input
                          type="url"
                          value={selectedConsultant.booking_url || ''}
                          onChange={(e) => setSelectedConsultant({...selectedConsultant, booking_url: e.target.value})}
                          placeholder="https://calendly.com/your-profile"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedConsultant.is_active}
                          onChange={(e) => setSelectedConsultant({...selectedConsultant, is_active: e.target.checked})}
                          id="consultant-active"
                          className="w-4 h-4"
                        />
                        <label htmlFor="consultant-active" className="text-sm font-medium cursor-pointer">Active (Show on website)</label>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleConsultantSave}
                          disabled={saving}
                          className="flex-1 gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Consultant'}
                        </Button>
                        {!isAddingConsultant && (
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteConsultant(selectedConsultant.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Select a consultant to edit or click "Add" to create a new one</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="books" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Books List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Books</CardTitle>
                      <CardDescription>Manage book recommendations</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAddNewBook} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {books.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => { setIsAddingBook(false); setSelectedBook(book); }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                          selectedBook?.id === book.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium truncate">{book.title}</div>
                        <div className="text-xs text-muted-foreground">{book.author}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Book Form */}
              <div className="lg:col-span-2">
                {selectedBook ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{isAddingBook ? 'Add New Book' : 'Edit Book'}</CardTitle>
                      <CardDescription>Manage book details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={selectedBook.title}
                          onChange={(e) => setSelectedBook({...selectedBook, title: e.target.value})}
                          placeholder="Book title"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Author</label>
                        <Input
                          value={selectedBook.author}
                          onChange={(e) => setSelectedBook({...selectedBook, author: e.target.value})}
                          placeholder="Author name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Genre</label>
                        <Input
                          value={selectedBook.genre}
                          onChange={(e) => setSelectedBook({...selectedBook, genre: e.target.value})}
                          placeholder="e.g., Self-Help, Fiction"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={selectedBook.description}
                          onChange={(e) => setSelectedBook({...selectedBook, description: e.target.value})}
                          placeholder="Book description"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cover Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedBook.cover_color}
                            onChange={(e) => setSelectedBook({...selectedBook, cover_color: e.target.value})}
                            className="w-16 h-10"
                          />
                          <Input
                            value={selectedBook.cover_color}
                            onChange={(e) => setSelectedBook({...selectedBook, cover_color: e.target.value})}
                            placeholder="#9b87f5"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      {/* Removed file upload UI — affiliate links will be used instead */}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cover Image</label>
                        <div 
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const files = e.dataTransfer.files;
                            if (files?.length) {
                              const url = await uploadCoverImage(files[0]);
                              if (url) setSelectedBook({...selectedBook, cover_image_url: url});
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e: any) => {
                              const url = await uploadCoverImage(e.target.files[0]);
                              if (url) setSelectedBook({...selectedBook, cover_image_url: url});
                            };
                            input.click();
                          }}
                        >
                          <div className="space-y-2">
                            <div className="text-2xl">📸</div>
                            <p className="font-medium text-sm">Click or drag image here</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Max 5MB)</p>
                          </div>
                        </div>
                        {selectedBook.cover_image_url && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            ✓ Image ready to save
                          </div>
                        )}
                      </div>

                      {selectedBook.cover_image_url && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cover Preview</label>
                          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                            <img
                              src={selectedBook.cover_image_url}
                              alt={selectedBook.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={(e) => {
                                (e.target as HTMLImageElement).style.display = 'block';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-sm mb-4">Recommendation Information</h3>
                        
                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">Recommended By</label>
                          <Input
                            value={selectedBook.recommended_by || ''}
                            onChange={(e) => setSelectedBook({...selectedBook, recommended_by: e.target.value})}
                            placeholder="e.g., Dr. Sarah Johnson"
                          />
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">Recommendation Reason</label>
                          <Textarea
                            value={selectedBook.recommendation_reason || ''}
                            onChange={(e) => setSelectedBook({...selectedBook, recommendation_reason: e.target.value})}
                            placeholder="Why this book is recommended..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-sm mb-4">Affiliate Links</h3>
                        
                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">Amazon Affiliate Link</label>
                          <Input
                            value={selectedBook.amazon_affiliate_link || ''}
                            onChange={(e) => setSelectedBook({...selectedBook, amazon_affiliate_link: e.target.value})}
                            placeholder="https://amazon.in/dp/..."
                          />
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">Flipkart Affiliate Link</label>
                          <Input
                            value={selectedBook.flipkart_affiliate_link || ''}
                            onChange={(e) => setSelectedBook({...selectedBook, flipkart_affiliate_link: e.target.value})}
                            placeholder="https://flipkart.com/..."
                          />
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">Affiliate / External Link</label>
                          <Input
                            value={(selectedBook as any).affiliate_link || ''}
                            onChange={(e) => setSelectedBook({...selectedBook, affiliate_link: e.target.value})}
                            placeholder="https://example.com/book-page-or-affiliate"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleBookSave}
                          disabled={saving}
                          className="flex-1 gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Book'}
                        </Button>
                        {!isAddingBook && (
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteBook(selectedBook.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Select a book to edit or click "Add" to create a new one</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Games List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Games</CardTitle>
                      <CardDescription>Manage game details</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAddNewGame} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {games.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => { setIsAddingGame(false); setSelectedGame(game); }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                          selectedGame?.id === game.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium truncate">{game.title}</div>
                        <div className="text-xs text-muted-foreground">{game.category}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Game Form */}
              <div className="lg:col-span-2">
                {selectedGame ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{isAddingGame ? 'Add New Game' : 'Edit Game'}</CardTitle>
                      <CardDescription>Manage game details and cover image</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={selectedGame.title}
                          onChange={(e) => setSelectedGame({...selectedGame, title: e.target.value})}
                          placeholder="Game title"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={selectedGame.description}
                          onChange={(e) => setSelectedGame({...selectedGame, description: e.target.value})}
                          placeholder="Game description"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Input
                          value={selectedGame.category}
                          onChange={(e) => setSelectedGame({...selectedGame, category: e.target.value})}
                          placeholder="e.g., Breathing, Cognitive, Meditation"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Icon</label>
                        <Input
                          value={selectedGame.icon}
                          onChange={(e) => setSelectedGame({...selectedGame, icon: e.target.value})}
                          placeholder="e.g., heart, lightbulb, flower"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Gradient From</label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedGame.color_from}
                              onChange={(e) => setSelectedGame({...selectedGame, color_from: e.target.value})}
                              className="w-12 h-10"
                            />
                            <Input
                              value={selectedGame.color_from}
                              onChange={(e) => setSelectedGame({...selectedGame, color_from: e.target.value})}
                              placeholder="#3B82F6"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Gradient To</label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedGame.color_to}
                              onChange={(e) => setSelectedGame({...selectedGame, color_to: e.target.value})}
                              className="w-12 h-10"
                            />
                            <Input
                              value={selectedGame.color_to}
                              onChange={(e) => setSelectedGame({...selectedGame, color_to: e.target.value})}
                              placeholder="#8B5CF6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cover Image</label>
                        <div 
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const files = e.dataTransfer.files;
                            if (files?.length) {
                              const url = await uploadCoverImage(files[0]);
                              if (url) setSelectedGame({...selectedGame, cover_image_url: url});
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e: any) => {
                              const url = await uploadCoverImage(e.target.files[0]);
                              if (url) setSelectedGame({...selectedGame, cover_image_url: url});
                            };
                            input.click();
                          }}
                        >
                          <div className="space-y-2">
                            <div className="text-2xl">📸</div>
                            <p className="font-medium text-sm">Click or drag image here</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Max 5MB)</p>
                          </div>
                        </div>
                        {selectedGame.cover_image_url && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            ✓ Image ready to save
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Most Popular</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="is_popular"
                            type="checkbox"
                            checked={!!selectedGame.is_popular}
                            onChange={(e) => setSelectedGame({...selectedGame, is_popular: e.target.checked})}
                          />
                          <label htmlFor="is_popular" className="text-sm text-muted-foreground">Pin this game as Most Popular</label>
                        </div>
                      </div>

                      {selectedGame.cover_image_url && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cover Preview</label>
                          <div className="w-full h-48 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300" style={{background: `linear-gradient(135deg, ${selectedGame.color_from} 0%, ${selectedGame.color_to} 100%)`}}>
                            <img
                              src={selectedGame.cover_image_url}
                              alt={selectedGame.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={(e) => {
                                (e.target as HTMLImageElement).style.display = 'block';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleGameSave}
                          disabled={saving}
                          className="flex-1 gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Game'}
                        </Button>
                        {!isAddingGame && (
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteGame(selectedGame.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Select a game to edit or click "Add" to create a new one</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Testimonials List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Testimonials</CardTitle>
                      <CardDescription>Manage user testimonials</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAddNewTestimonial} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {testimonials.map((testimonial) => (
                      <button
                        key={testimonial.id}
                        onClick={() => { setIsAddingTestimonial(false); setSelectedTestimonial(testimonial); }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                          selectedTestimonial?.id === testimonial.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium truncate">{testimonial.user_name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{testimonial.feedback}</div>
                        <div className="text-xs mt-1">{'⭐'.repeat(testimonial.rating)}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Testimonial Form */}
              <div className="lg:col-span-2">
                {selectedTestimonial ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{isAddingTestimonial ? 'Add New Testimonial' : 'Edit Testimonial'}</CardTitle>
                      <CardDescription>Manage testimonial details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">User Name</label>
                        <Input
                          value={selectedTestimonial.user_name}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, user_name: e.target.value})}
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">User Title</label>
                        <Input
                          value={selectedTestimonial.user_title || ''}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, user_title: e.target.value})}
                          placeholder="e.g., CEO at TechCorp"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Feedback</label>
                        <Textarea
                          value={selectedTestimonial.feedback}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, feedback: e.target.value})}
                          placeholder="User testimonial"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setSelectedTestimonial({...selectedTestimonial, rating: star})}
                              className={`text-2xl transition-opacity ${star <= selectedTestimonial.rating ? 'opacity-100' : 'opacity-30'}`}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Avatar URL</label>
                        <Input
                          type="url"
                          value={selectedTestimonial.avatar_url || ''}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, avatar_url: e.target.value})}
                          placeholder="Paste web URL: https://example.com/avatar.jpg"
                        />
                        <p className="text-xs text-muted-foreground">Supports any public web image URL</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Display Order</label>
                        <Input
                          type="number"
                          value={selectedTestimonial.display_order}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, display_order: parseInt(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTestimonial.is_active}
                          onChange={(e) => setSelectedTestimonial({...selectedTestimonial, is_active: e.target.checked})}
                          id="active"
                          className="w-4 h-4"
                        />
                        <label htmlFor="active" className="text-sm font-medium cursor-pointer">Active (Show on website)</label>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleTestimonialSave}
                          disabled={saving}
                          className="flex-1 gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Testimonial'}
                        </Button>
                        {!isAddingTestimonial && (
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteTestimonial(selectedTestimonial.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Select a testimonial to edit or click "Add" to create a new one</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
      <AppFooter />
    </div>
  );
}
