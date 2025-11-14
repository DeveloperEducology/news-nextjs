import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

// We pass the categories as a prop from the Header
export default function MobileMenu({ isOpen, setIsOpen, categories }) {
  const { data: session } = useSession();

  // Helper function to close the menu
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Background overlay */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Menu panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 transform bg-white
          shadow-xl transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Menu Content */}
        <div className="flex h-full flex-col">
          
          {/* Header with Logo and Close button */}
          <div className="flex items-center justify-between border-b p-4">
            <Link href="/" onClick={closeMenu} className="text-xl font-extrabold text-gray-900">
              తెలుగు Shorts
            </Link>
            <button
              onClick={closeMenu}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-grow overflow-y-auto p-4">
            
            {/* Auth Section */}
            <div className="mb-4 border-b pb-4">
              {session ? (
                <div className="flex items-center gap-3">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="truncate text-sm font-medium">{session.user.name}</p>
                    <button
                      onClick={() => {
                        signOut();
                        closeMenu();
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    signIn();
                    closeMenu();
                  }}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Admin Section (if admin) */}
            {session?.user.role === 'admin' && (
              <div className="mb-4 border-b pb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Admin</p>
                <Link href="/admin" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/create-article" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
                  New Article
                </Link>
                <Link href="/admin/create-gallery" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
                  New Gallery
                </Link>
              </div>
            )}
            
            {/* Main Links */}
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Main</p>
            <Link href="/" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Home
            </Link>
            <Link href="/shorts" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Shorts
            </Link>
            <Link href="/gallery" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Gallery
            </Link>

            {/* Categories */}
            <p className="mt-4 mb-2 text-xs font-semibold uppercase text-gray-400">Categories</p>
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}