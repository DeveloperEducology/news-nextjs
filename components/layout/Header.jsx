import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" legacyBehavior>
          <a className="text-2xl font-bold text-gray-800">తెలుగు Shorts</a>
        </Link>
        <nav>
          <Link href="/create-article" legacyBehavior>
            <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create Post
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}