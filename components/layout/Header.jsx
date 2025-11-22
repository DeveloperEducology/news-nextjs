import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { useRouter } from 'next/router'; // Import the router

// Define your categories here
const CATEGORIES = [
  { name: 'Sports', href: '/category/sports' },
  { name: 'Tech', href: '/category/tech' },
  { name: 'Movie', href: '/category/movie' },
  { name: 'Telangana', href: '/category/telangana' },
  { name: 'Andhra Pradesh', href: '/category/andhra-pradesh' },
  { name: 'National', href: '/category/national' },
  { name: 'International', href: '/category/international' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const router = useRouter(); // Use the router

  // Check if we are on the 'live' or 'shorts' page
  const isSpecialPage = router.pathname === '/shorts' || router.pathname === '/live';

  // --- RENDER TRANSPARENT HEADER for special pages ---
  if (isSpecialPage) {
    return (
      <>
        <header className="absolute top-0 left-0 right-0 z-30 p-4">
          <div className="container mx-auto flex max-w-6xl items-center justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
        <MobileMenu
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          categories={CATEGORIES}
        />
      </>
    );
  }

  // --- RENDER DEFAULT HEADER for all other pages ---
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white shadow-sm">
      {/* Top Bar */}
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="flex-1 md:flex-none">
          <Link href="/" className="flex justify-center text-3xl font-extrabold text-gray-900 md:justify-start">
            తెలుగు Shorts
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {isLoading ? (
            <div className="h-5 w-24 animate-pulse rounded-md bg-gray-200"></div>
          ) : session ? (
            <div className="flex items-center gap-4">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              {session.user.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>

      {/* Desktop Category Nav Bar */}
      <nav className="hidden border-t border-gray-100 bg-blue md:flex">
        <div className="container mx-auto flex max-w-6xl justify-center gap-8 px-4">
          <Link href="/live" className="py-3 text-sm font-semibold text-red-600 hover:text-red-700">
            Live
          </Link>
          <div className="border-l border-gray-200"></div>
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="py-3 text-sm font-semibold text-gray-600 hover:text-blue-600"
            >
              {category.name}
            </Link>
          ))}
          <div className="border-l border-gray-200"></div>
          <Link href="/shorts" className="py-3 text-sm font-semibold text-gray-600 hover:text-blue-600">
            Shorts
          </Link>
          <Link href="/gallery" className="py-3 text-sm font-semibold text-gray-600 hover:text-blue-600">
            Gallery
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        categories={CATEGORIES}
      />
    </header>
  );
}