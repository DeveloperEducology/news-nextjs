import { useState } from 'react';
import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Image from 'next/image';

export default function GalleryPage({ photos }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <SeoHead 
        title="Photo Gallery" 
        description="A gallery of photos from our news events."
      />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Photo Gallery</h1>
        
        {/* --- Photo Grid --- */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <div 
              key={photo._id} 
              className="group relative cursor-pointer"
              onClick={() => setSelectedImage(photo)}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.caption}
                width={500}
                height={500}
                className="aspect-square w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized={true} // Use this if you have many S3 domains
              />
              <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-40">
                <p className="absolute bottom-2 left-2 text-sm font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Lightbox Modal --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setSelectedImage(null)} // Close on background click
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.caption}
              width={1600}
              height={1200}
              className="h-auto w-auto max-w-full max-h-[90vh] rounded-lg"
              unoptimized={true}
            />
            <p className="mt-2 text-center text-white">{selectedImage.caption}</p>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-white text-black text-2xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ... (in pages/gallery.js)

export async function getStaticProps() {
  await dbConnect();
  
  const result = await Photo.find({}).sort({ createdAt: -1 });
  
  // Serialize the data
  const photos = result.map((doc) => {
    const photo = doc.toObject();
    photo._id = photo._id.toString();
    photo.createdAt = photo.createdAt.toString();
    
    // --- THIS IS THE FIX ---
    // You must also convert updatedAt to a string
    if (photo.updatedAt) {
      photo.updatedAt = photo.updatedAt.toString();
    }
    // --- END OF FIX ---

    return photo;
  });

  return {
    props: {
      photos: photos,
    },
    revalidate: 60, // Re-build the gallery every 60 seconds
  };
}