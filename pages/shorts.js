import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import ShortCard from '@/components/ShortCard';
import { useState, useEffect } from 'react'; // Import React hooks

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// A simple Fullscreen icon component
const FullscreenIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="white" {...props}>
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

export default function ShortsPage({ articles }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // This function requests or exits fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for changes in fullscreen state (e.g., user pressing 'Esc')
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <>
      <SeoHead 
        title="Shorts" 
        description="Breaking news shorts."
      />
      
      <div className="h-screen bg-black">
        {/* --- ADD FULLSCREEN BUTTON --- */}
        {/* We hide the button once we are in fullscreen mode */}
        {!isFullscreen && (
          <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 z-50 p-2 bg-black/30 rounded-full"
            aria-label="Enter Fullscreen"
          >
            <FullscreenIcon />
          </button>
        )}
        {/* --- END OF BUTTON --- */}

        <Swiper
          modules={[Mousewheel, Pagination]}
          direction={'vertical'}
          slidesPerView={1}
          spaceBetween={0}
          mousewheel={true}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {articles.map((article) => (
            <SwiperSlide key={article._id}>
              <ShortCard article={article} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

// ... (Your getServerSideProps function remains exactly the same) ...
export async function getServerSideProps(context) {
  // --- 1. Device Detection ---
  const userAgent = context.req.headers['user-agent'];
  const isMobile = Boolean(userAgent.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  ));

  if (!isMobile) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // --- 2. Fetch Data (If Mobile) ---
  await dbConnect();
  const now = new Date();

  const query = {
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };

  const result = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 });

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
      articles: articles,
    },
  };
}