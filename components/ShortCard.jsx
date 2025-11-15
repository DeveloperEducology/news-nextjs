import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Share2 } from 'lucide-react';
import { useState, useEffect } from 'react'; // <-- 1. Import hooks

// --- 2. Add Icon components here ---
const FullscreenIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" {...props}>
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);
const FullscreenExitIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" {...props}>
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

export default function ShortCard({ article }) {
  // --- 3. Add fullscreen state and logic ---
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    // We listen to the document, not an element
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  // --- End of logic ---

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: `/article/${article.slug}`,
      }).catch((err) => console.error("Share failed", err));
    } else {
      alert("Your browser doesn't support the Share API.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg">
      
      {/* --- 4. IMAGE SECTION (Modified) --- */}
      <div className="relative h-[45%] w-full flex-shrink-0">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
            unoptimized={true}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200 text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}
        <span className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold uppercase text-white">
          TS
        </span>

        {/* --- 5. ADD THE BUTTON HERE --- */}
        <button
          onClick={toggleFullScreen}
          className="absolute bottom-3 right-3 z-20 p-2 bg-black/30 rounded-full text-white backdrop-blur-sm hover:bg-black/50"
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </button>
      </div>

      {/* --- 6. CONTENT SECTION (No changes) --- */}
      <div className="flex h-[55%] flex-col justify-between p-5 min-h-0">
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
          <h2 className="mb-2 text-xl font-bold leading-snug text-gray-900">
            {article.title}
          </h2>
          <p className="mb-4 text-sm font-medium text-gray-500">
            <span className="font-bold text-red-600">{article.category}</span> | {format(new Date(article.createdAt), "hh:mm a")}
          </p>
          <p className="text-[15px] leading-relaxed text-gray-700">
            {article.summary}
          </p>
        </div>
        <div className="mt-4 flex flex-shrink-0 items-center justify-between pt-3">
          <Link href={`/article/${article.slug}`} legacyBehavior>
            <a 
              className="inline-block rounded-full bg-red-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-red-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Full Article
            </a>
          </Link>
          <button 
            onClick={shareArticle} 
            className="p-2 text-gray-500 hover:text-gray-800"
            aria-label="Share article"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}