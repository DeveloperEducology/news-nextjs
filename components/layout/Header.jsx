import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { useRouter } from 'next/router'; // <-- 1. Import useRouter

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

  // --- 2. CHECK THE CURRENT PAGE ---
  const router = useRouter();
  const isShortsPage = router.pathname === '/shorts';
  // --- END ---

  // --- 3. RENDER THE TRANSPARENT SHORTS HEADER ---
  if (isShortsPage) {
    return (
      <>
        <header className="absolute top-0 left-0 right-0 z-30 p-4">
          <div className="container mx-auto flex max-w-6xl items-center justify-end">
            {/* Menu Button on the right */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* The mobile menu component still works */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          categories={CATEGORIES}
        />
      </>
    );
  }
  // --- END OF SHORTS HEADER ---

  // --- 4. RENDER THE DEFAULT HEADER (Your existing code) ---
  return (
    <header className="sticky top-0 z-30 bg-white shadow-md">
      {/* Top Bar: Logo, Mobile Menu, Desktop Auth */}
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        
        {/* Mobile Menu Button (Hamburger) */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>
        
        {/* Logo (Centering on mobile, left on desktop) */}
        <div className="flex-1 md:flex-none">
          <Link href="/" className="flex justify-center text-2xl font-bold text-gray-800 md:justify-start">
            తెలుగు Shorts
          </Link>
        </div>

        {/* Desktop Auth Section */}
        <nav className="hidden items-center gap-4 md:flex">
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200"></div>
          ) : session ? (
            <>
              {session.user.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-red-600 hover:text-red-800">
                  Dashboard
                </Link>
              )}
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>

      {/* Desktop Category Nav Bar */}
      <nav className="hidden border-t border-gray-200 bg-gray-50 md:flex">
        <div className="container mx-auto flex max-w-6xl justify-center gap-6 px-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="py-3 text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/shorts" className="py-3 text-sm font-medium text-gray-600 hover:text-blue-600">
            Shorts
          </Link>
          <Link href="/gallery" className="py-3 text-sm font-medium text-gray-600 hover:text-blue-600">
            Gallery
          </Link>
        </div>
      </nav>

      {/* Render the Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        categories={CATEGORIES}
      />
    </header>
  );
}