import Head from 'next/head';
import dbConnect from '../lib/mongodb';
import Article from '../models/Article';
import ArticleCard from '../components/ArticleCard';
import SeoHead from '../components/SeoHead';
import { useState } from 'react'; // <-- 1. Import useState

// 2. We rename the prop from `getStaticProps`
export default function Home({ initialArticles, totalPosts }) {
  
  // 3. Set up React state
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2); // Start on page 2 (page 1 is initial)
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalPosts);

  // 4. This function fetches more posts from our API
  const loadMorePosts = async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/articles?page=${page}`);
      const { data: newArticles, total } = await res.json();

      // Add new articles to the existing list
      setArticles(prevArticles => [...prevArticles, ...newArticles]);
      
      // Increment the page number for the next fetch
      setPage(prevPage => prevPage + 1);

      // Check if we've reached the end
      if (articles.length + newArticles.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more articles", error);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <SeoHead 
        title="Homepage" 
        description="The very latest news on technology, science, and more."
      />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Latest News</h1>
        
        <div className="article-list">
          {/* 5. Map over the 'articles' state variable */}
          {articles &&
            articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
        </div>

        {/* 6. Add the "Load More" button */}
        <div className="mt-8 text-center">
          {hasMore && (
            <button
              onClick={loadMorePosts}
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// 7. Update getStaticProps to send 'totalPosts'
export async function getStaticProps() {
  await dbConnect();
  
  const now = new Date();
  const limit = 10; // This is page 1

  const query = {
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };

  // Get the first 10 articles
  const result = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 }) 
    .limit(limit);

  // Get the total count
  const totalPosts = await Article.countDocuments(query);

  const initialArticles = result.map((doc) => {
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
      initialArticles: initialArticles, // Pass as 'initialArticles'
      totalPosts: totalPosts,         // Pass the total count
    },
    revalidate: 60,
  };
}