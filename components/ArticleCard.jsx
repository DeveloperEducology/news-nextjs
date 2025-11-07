import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function ArticleCard({ article }) {
  // Define a placeholder image if article.featuredImage is empty or null
  const imageUrl = article.featuredImage || 'https://media.istockphoto.com/id/1369150014/vector/breaking-news-with-world-map-background-vector.jpg?s=612x612&w=0&k=20&c=9pR2-nDBhb7cOvvZU_VdgkMmPJXrBQ4rB1AkTXxRIKM='; // Use a default placeholder

  return (
    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-lg">
      <Link href={`/article/${article.slug}`} legacyBehavior>
        <a className="flex flex-col md:flex-row"> {/* Use flexbox for horizontal layout on medium screens and up */}
          
          {/* Image Section - Fixed width on desktop, full width on mobile */}
          <div className="relative h-48 w-full flex-shrink-0 md:h-auto md:w-60"> {/* Adjust w-60 (240px) as needed */}
            <Image
              src={imageUrl}
              alt={article.title}
              fill // Use 'fill' to make image cover its parent div
              className="object-cover" // Ensure the image covers the div without distortion
              priority // Prioritize loading images in the viewport
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 240px, 240px" // Improve image optimization
              unoptimized={true} // <-- ADD THIS PROP
            />
          </div>

          {/* Text Content Section */}
          <div className="p-4 md:p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 hover:text-blue-600 md:text-2xl">
                {article.title}
              </h2>
              <p className="mt-2 text-base text-gray-600">{article.excerpt}</p>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium">short by {article.author}</span>
              {' / '}
              <span>{format(new Date(article.createdAt), 'hh:mm a')} on {format(new Date(article.createdAt), 'EEEE d MMMM, yyyy')}</span>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
}