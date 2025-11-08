import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function ArticleCard({ article }) {
  const imageUrl = article.featuredImage || 'https://via.placeholder.com/600x400?text=News+Image';
  const authorName = article.author || 'Team News';
  const category = article.category || 'CATEGORY';

  const formattedDate = article.createdAt 
    ? format(new Date(article.createdAt), 'MMMM d, yyyy') 
    : 'Unknown Date';

  return (
    <div className="group w-full overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      <Link href={`/article/${article.slug}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 w-full"> {/* Slightly reduced height from 56 to 48 to look better in a 3-grid */}
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false} // Only use true for the very first image on the page (Hero)
            // UPDATED SIZES: 1 column on mobile, 2 on tablet, 3 on desktop
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={true} // Keep only if you MUST, otherwise remove for better performance
          />
        </div>

        {/* Text Content Section */}
        <div className="flex flex-col justify-between p-4">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {category}
          </span>
          
          {/* Added line-clamp-2 to prevent titles from making cards uneven heights */}
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