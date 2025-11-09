import Link from 'next/link';
import Image from 'next/image';
import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Gallery from '@/models/Gallery';

export default function GalleryList({ galleries }) {
  return (
    <>
      <SeoHead title="Photo Galleries" description="Browse our latest photo collections." />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Photo Galleries</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <Link href={`/gallery/${gallery.slug}`} key={gallery._id} className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                <div className="relative h-64 w-full">
                   <Image 
                     src={gallery.featuredImage} 
                     alt={gallery.title}
                     fill
                     className="object-cover transition duration-300 group-hover:scale-105"
                     unoptimized={true} // IMPORTANT for external S3 images
                   />
                </div>
                <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-800">{gallery.title}</h2>
                    {gallery.summary && <p className="text-gray-600 mt-2 text-sm">{gallery.summary}</p>}
                </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ... (in pages/gallery/index.js)

export async function getStaticProps() {
  await dbConnect();
  
  // --- THIS IS THE FIX ---
  // We will .select() only the fields we need for the list.
  // This avoids fetching the complex 'images' array.
  const results = await Gallery.find({ status: 'published' })
    .sort({ publishedDate: -1 })
    .select('title slug featuredImage summary publishedDate createdAt updatedAt'); // <-- 1. Optimized query
  // --- END OF FIX ---

  const galleries = results.map(doc => {
    const g = doc.toObject();
    g._id = g._id.toString();
    
    // 2. Safely serialize all date fields
    if (g.createdAt) g.createdAt = g.createdAt.toString();
    if (g.updatedAt) g.updatedAt = g.updatedAt.toString();
    if (g.publishedDate) g.publishedDate = g.publishedDate.toString();
    
    return g;
  });

  return { 
    props: { galleries: galleries }, 
    revalidate: 60 
  };
}