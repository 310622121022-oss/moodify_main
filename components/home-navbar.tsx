'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, ClipboardList, LogOut, Menu, X, Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useStreak } from '@/hooks/use-streak';
import { generateInitials, getAvatarColor, getAvatarTextColor } from '@/lib/streak-utils';
import { AuthModal } from '@/components/auth-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type HomeNavbarProps = {
  authModal?: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
    open: () => void;
  };
  onMoodCheckClick?: () => void;
};

export function HomeNavbar(props: HomeNavbarProps) {
  const { user, signOut } = useAuth();
  const { streakData } = useStreak();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localAuthOpen, setLocalAuthOpen] = useState(false);

  const openAuth = () => {
    if (props.authModal) props.authModal.open();
    else setLocalAuthOpen(true);
  };

  const closeAuth = () => {
    if (props.authModal) props.authModal.onClose();
    else setLocalAuthOpen(false);
  };

  const isAuthOpen = props.authModal ? props.authModal.isOpen : localAuthOpen;

  const handleAuthSuccess = async () => {
    if (props.authModal?.onSuccess) await props.authModal.onSuccess();
    closeAuth();
  };

  const handleMoodCheckClick = () => {
    if (props.onMoodCheckClick) {
      props.onMoodCheckClick();
      return;
    }

    if (user) router.push('/assessment');
    else openAuth();
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  const initials = generateInitials(displayName);
  const bgColor = getAvatarColor(displayName);
  const textColor = getAvatarTextColor(displayName);

  return (
    <>
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 flex-wrap">
            <Link href="/" className="flex items-center gap-2" title="Go to MoodLift home page">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl sm:text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MoodLift
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleMoodCheckClick}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Mood Check
              </Button>
              {user && (
                <>
                  <Link href="/games" title="Explore wellness games and activities">
                    <Button variant="ghost" size="sm">Games</Button>
                  </Link>
                  <Link href="/discover" title="Discover personalized recommendations">
                    <Button variant="ghost" size="sm">Discover</Button>
                  </Link>
                  <Link href="/dashboard" title="View your progress and achievements">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                </>
              )}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="p-0 bg-transparent hover:bg-transparent">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${bgColor} ${textColor} border-2 border-purple-200`}>
                          {initials}
                        </div>
                        {streakData?.currentStreak && streakData.currentStreak > 0 && (
                          <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-2 py-1 shadow-md border border-gray-200 flex items-center gap-1">
                            <Flame className="w-3 h-3" style={{ color: '#FF6B35' }} />
                            <span className="text-xs font-bold" style={{ color: '#FF6B35' }}>{streakData.currentStreak}</span>
                          </div>
                        )}
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
                <Button onClick={openAuth} size="sm" style={{ backgroundColor: '#3C1F71' }}>
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
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
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
                  handleMoodCheckClick();
                  setMobileMenuOpen(false);
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Mood Check
              </Button>
              {user && (
                <>
                  <Link href="/games" className="block" title="Explore wellness games and activities">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Games
                    </Button>
                  </Link>
                  <Link href="/discover" className="block" title="Discover personalized recommendations">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Discover
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="block" title="View your progress and achievements">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Dashboard
                    </Button>
                  </Link>
                </>
              )}
              {user ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    openAuth();
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

      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} onSuccess={handleAuthSuccess} />
    </>
  );
}
