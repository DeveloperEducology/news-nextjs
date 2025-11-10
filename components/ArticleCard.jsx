import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

// --- 1. DEFINE YOUR TRUSTED DOMAINS ---
// These MUST match the hostnames in your next.config.js
const OPTIMIZED_DOMAINS = [
  'cakeimages.s3.ap-northeast-2.amazonaws.com',
  'via.placeholder.com',
];

// --- 2. ACCEPT THE 'priority' PROP ---
// This lets your homepage set the first image to high priority
export default function ArticleCard({ article, priority = false }) {
  const imageUrl = article.featuredImage || 'https://via.placeholder.com/600x400?text=News+Image';
  const authorName = article.author || 'Team News';
  const category = article.category || 'CATEGORY';

  const formattedDate = article.createdAt 
    ? format(new Date(article.createdAt), 'MMMM d, yyyy') 
    : 'Unknown Date';

  // --- 3. CHECK IF THE IMAGE IS FROM AN EXTERNAL RSS FEED ---
  let isExternalDomain = true;
  try {
    // We check if the image's hostname is in our trusted list
    const url = new URL(imageUrl);
    if (OPTIMIZED_DOMAINS.includes(url.hostname)) {
      isExternalDomain = false;
    }
  } catch (e) {
    // Invalid URL, let next/image handle it
    console.error("Invalid image URL in ArticleCard:", imageUrl);
    isExternalDomain = true; 
  }

  return (
    <div className="group w-full overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      {/* 4. UPDATED <Link> (no <a> tag) */}
      <Link href={`/article/${article.slug}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            // 5. SET 'priority' AND 'unoptimized' DYNAMICALLY
            priority={priority}
            unoptimized={isExternalDomain}
            //
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Text Content Section */}
        <div className="flex flex-col justify-between p-4">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {category}
          </span>
          
          <h2 className="line-clamp-2 text-xl font-bold leading-tight text-gray-800 group-hover:text-blue-600 md:text-xl">
            {article.title}
          </h2>
          
          <div className="mt-3 text-sm text-gray-500">
            <span className="font-medium">By {authorName}</span>
            <span className="mx-1">•</span>
            <span>{formattedDate}</span>
          </div>

          <div className="mt-4 text-sm font-semibold text-blue-600 group-hover:underline">
            READ MORE →
          </div>
        </div>
      </Link>
    </div>
  );
}