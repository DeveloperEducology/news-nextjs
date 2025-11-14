import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import ShortCard from '@/components/ShortCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Header from '@/components/layout/Header';
import { useState } from 'react'; // Keep useState for pagination

// --- 1. REMOVED: FullscreenIcon, useState(isFullscreen), toggleFullScreen, useEffect ---

// We still receive 'initialArticles' and 'totalArticles'
export default function ShortsPage({ initialArticles, totalArticles }) {
  
  // --- 2. Keep the pagination state ---
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2); // Start fetching from page 2
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalArticles);

  // --- 3. Keep the loadMoreShorts function ---
  const loadMoreShorts = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/articles?page=${page}`);
      const { data: newArticles, total } = await res.json();

      if (newArticles && newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setPage(prev => prev + 1);
        setHasMore(articles.length + newArticles.length < total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more shorts", error);
    }
    
    setIsLoading(false);
  };

  // --- 4. Keep the slide change handler ---
  const handleSlideChange = (swiper) => {
    const triggerIndex = articles.length - 3;
    if (swiper.activeIndex === triggerIndex) {
      loadMoreShorts();
    }
  };

  return (
    <>
      <SeoHead 
        title="Shorts" 
        description="Breaking news shorts."
      />
      {/* This renders the transparent header */}
      <Header /> 
      
      <div className="h-screen bg-gray-200">
        
        {/* --- 5. REMOVED: The Fullscreen <button> --- */}

        <Swiper
          modules={[Mousewheel, Pagination]}
          direction={'vertical'}
          slidesPerView={1}
          spaceBetween={16}
          mousewheel={true}
          pagination={{ clickable: true }}
          className="h-full w-full"
          style={{ padding: '24px 12px' }} 
          onSlideChange={handleSlideChange}
        >
          
          {articles.map((article) => (
            <SwiperSlide key={article._id}>
              {/* Pass the article to the card */}
              <ShortCard article={article} />
            </SwiperSlide>
          ))}
          
          {hasMore && (
            <SwiperSlide>
              <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg items-center justify-center">
                <p className="text-gray-500">Loading more...</p>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </>
  );
}

// ... (getServerSideProps function remains exactly the same) ...
export async function getServerSideProps(context) {
  const userAgent = context.req.headers['user-agent'];
  const isMobile = Boolean(userAgent.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  ));
  if (!isMobile) {
    return { redirect: { destination: '/', permanent: false } };
  }
  await dbConnect();
  const now = new Date();
  const limit = 10;
  const query = {
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };
  const result = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 })
    .limit(limit);
  const totalArticles = await Article.countDocuments(query);
  const articles = result.map((doc) => {
    const article = doc.toObject();
    article._id = article._id.toString();
    if (article.publishedDate) {
      article.createdAt = article.publishedDate.toString();
    } else if (article.createdAt) {
      article.createdAt = article.createdAt.toString();
    }
    if (article.updatedAt) {
      article.updatedAt = article.updatedAt.toString();
    }
    delete article.publishedDate; 
    return article;
  });
  return {
    props: {
      initialArticles: articles,
      totalArticles: totalArticles,
    },
  };
}