import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ShortCard({ article }) {
  return (
    // Full-screen, relative container
    <div className="relative h-screen w-full">
      {/* 1. Background Image */}
      {article.featuredImage && (
        <Image
          src={article.featuredImage}
          alt={article.title}
          fill
          className="object-cover"
          unoptimized={true}
          priority
        />
      )}
      
      {/* 2. Dark Gradient Overlay (from bottom to 60% up) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* 3. Content Area (at the bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Time */}
        <p className="mb-2 text-sm text-gray-300">
          {format(new Date(article.createdAt), "MMMM d, yyyy")}
        </p>
        
        {/* Title */}
        <h2 className="mb-4 text-2xl font-bold leading-tight">
          {article.title}
        </h2>
        
        {/* Summary */}
        <p className="mb-6 text-base font-light text-gray-200 line-clamp-3">
          {article.summary}
        </p>
        
        {/* Read More Link */}
        <Link href={`/article/${article.slug}`} legacyBehavior>
          <a 
            className="inline-block rounded-full bg-white px-6 py-2 text-center font-semibold text-black"
            target="_blank" // Optional: open in new tab
            rel="noopener noreferrer"
          >
            Read More
          </a>
        </Link>
      </div>
    </div>
  );
}