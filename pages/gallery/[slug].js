import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import Image from 'next/image';
// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function SingleGallery({ gallery }) {
  if (!gallery) return null;

  return (
    <>
      <SeoHead 
          title={gallery.title} 
          description={gallery.summary}
          ogImage={gallery.featuredImage} 
      />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">{gallery.title}</h1>
        {gallery.summary && <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">{gallery.summary}</p>}

        {/* --- SWIPER CAROUSEL --- */}
        <div className="rounded-xl overflow-hidden shadow-2xl bg-black">
            <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            className="h-[50vh] md:h-[80vh] w-full"
            >
            {gallery.images.map((img, index) => (
                <SwiperSlide key={index} className="relative flex items-center justify-center bg-black">
                 <div className="relative h-full w-full">
                     <Image
                        src={img.imageUrl}
                        alt={img.caption || gallery.title}
                        fill
                        className="object-contain" // Keeps aspect ratio, shows whole image
                        priority={index === 0} // Load first image fast
                        unoptimized={true}
                     />
                     {/* Optional Caption Overlay */}
                     {img.caption && (
                         <div className="absolute bottom-0 w-full bg-black/50 p-4 text-white text-center">
                             {img.caption}
                         </div>
                     )}
                 </div>
                </SwiperSlide>
            ))}
            </Swiper>
        </div>
        
        <div className="mt-8 text-center">
             <a href="/gallery" className="text-blue-600 hover:underline">← Back to all galleries</a>
        </div>
      </div>
    </>
  );
}

// Standard Next.js data fetching for SEO
export async function getStaticPaths() {
    await dbConnect();
    const galleries = await Gallery.find({ status: 'published' }, 'slug');
    const paths = galleries.map((g) => ({ params: { slug: g.slug } }));
    return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
    await dbConnect();
    const result = await Gallery.findOne({ slug: params.slug, status: 'published' });
    if (!result) return { notFound: true };

    const gallery = result.toObject();
    gallery._id = gallery._id.toString();
    gallery.createdAt = gallery.createdAt.toString();
    gallery.updatedAt = gallery.updatedAt.toString();
    gallery.publishedDate = gallery.publishedDate.toString();
    gallery.images.forEach(img => img._id = img._id.toString()); // serialize subdocuments

    return { props: { gallery }, revalidate: 60 };
}