import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ShortCard({ article }) {
  return (
    // Main container fills the exact swiper slide height
    <div className="flex h-full w-full flex-col bg-white">
      
      {/* --- TOP SECTION: IMAGE (approx 40% height) --- */}
      <div className="relative h-[40%] w-full flex-shrink-0 bg-gray-200">
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
          // Fallback if no image
          <div className="flex h-full items-center justify-center text-gray-400">
            <span className="text-sm">No Image Available</span>
          </div>
        )}
      </div>

      {/* --- BOTTOM SECTION: CONTENT (approx 60% height) --- */}
      <div className="flex h-[60%] flex-col justify-between p-5">
        
        {/* Scrollable Text Area */}
        <div className="overflow-y-auto pr-1 scrollbar-hide">
          {/* Title */}
          <h2 className="mb-2 text-xl font-bold leading-snug text-gray-900 md:text-2xl">
            {article.title}
          </h2>

          {/* Metadata (Author/Date) */}
          <p className="mb-4 text-xs font-medium text-gray-500">
            <span className="text-gray-900">short </span>
            by {article.author || 'Admin'} / {format(new Date(article.createdAt), "hh:mm a 'on' d MMM yyyy")}
          </p>

          {/* Summary/Content */}
          <div 
            className="text-[15px] leading-relaxed text-gray-700"
            // We use the summary if it exists, otherwise a snippet of content
            dangerouslySetInnerHTML={{ __html: article.summary || article.content.slice(0, 300) + '...' }}
          />
        </div>

        {/* Footer Area (Fixed at bottom of card) */}
        <div className="mt-4 flex-shrink-0 pt-3">
            <p className="text-xs text-gray-500">
              read more at{" "}
              <Link href={`/article/${article.slug}`} legacyBehavior>
                <a 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-gray-900 hover:underline"
                >
                  telugushorts.com
                </a>
              </Link>
            </p>
        </div>

      </div>
    </div>
  );
}