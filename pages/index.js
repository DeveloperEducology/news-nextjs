import Head from 'next/head';
import Link from 'next/link';
import dbConnect from '../lib/mongodb';
import Article from '../models/Article';
import { useState } from 'react';

// --- 1. Import your REAL components ---
// We no longer define Header or SeoHead in this file
import ArticleCard from '../components/ArticleCard';
import SeoHead from '../components/SeoHead';
import Header from '../components/layout/Header';

// ===================================================================
// 1. HOME PAGE COMPONENT
// ===================================================================
export default function Home({ initialArticles, totalPosts, headlines }) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2); // Start on page 2 (page 1 is initial)
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalPosts);

  // This function fetches from your /api/articles route
  const loadMorePosts = async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/articles?page=${page}`);
      const { data: newArticles, total } = await res.json();

      setArticles(prevArticles => [...prevArticles, ...newArticles]);
      setPage(prevPage => prevPage + 1);
      if (articles.length + newArticles.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more articles", error);
    }
    
    setIsLoading(false);
  };

  return (
    // We remove the bg-gray-50, as the Layout component handles it
    <> 
      <SeoHead 
        title="Homepage" 
        description="The very latest news on technology, science, and more."
      />

      {/* This is your real, full-featured Header component */}
      {/* <Header /> */}

      <main className="container mx-auto max-w-7xl px-4 py-8">
        
        {/* --- 2. THIS IS THE GRID FIX ---
          We use a 3-column grid. Main content takes 2, sidebar takes 1.
        */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">

          {/* === COLUMN 1: MAIN CONTENT (Scrolls) === */}
          <div className="lg:col-span-2">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Latest News
            </h1>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {articles &&
                articles.map((article, index) => (
                  <ArticleCard 
                    key={article._id} 
                    article={article} 
                    // 3. Add 'priority' to the first image for better LCP
                    priority={index === 0}
                  />
                ))}
            </div>

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

          {/* === COLUMN 2: SIDEBAR (Sticky) === */}
          <div className="lg:col-span-1">
            {/* 4. This 'sticky' class will now work correctly */}
            <div className="lg:sticky lg:top-24">
              <div className="mt-8 lg:mt-0">
                <h2 className="text-xl font-bold text-gray-900">
                  Latest Headlines
                </h2>
                
                {/* 5. We give this a max-height so only the list scrolls, not the whole sidebar */}
                <div className="mt-4 max-h-[75vh] overflow-y-auto rounded-lg border bg-white p-4 shadow-sm">
                  <ul className="divide-y divide-gray-200">
                    {/* 6. We map over the 'headlines' prop, not sample data */}
                    {headlines.map((headline) => (
                      <li key={headline._id} className="py-3">
                        <Link href={`/article/${headline.slug}`} className="font-medium text-gray-700 hover:text-blue-600">
                          {headline.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}


// ===================================================================
// 3. getStaticProps (UPDATED)
// ===================================================================

// Helper function to serialize data
function serializeData(data) {
  return data.map((doc) => {
    const item = doc.toObject();
    item._id = item._id.toString();
    
    // Use publishedDate as the primary date
    if (item.publishedDate) {
      item.createdAt = item.publishedDate.toString();
    } else if (item.createdAt) {
      item.createdAt = item.createdAt.toString();
    }
    
    if (item.updatedAt) {
      item.updatedAt = item.updatedAt.toString();
    }
    
    // Clean up original date object
    delete item.publishedDate; 
    return item;
  });
}

export async function getStaticProps() {
  await dbConnect();
  
  const now = new Date();
  const limit = 10; // This is page 1
  const headlineLimit = 15; // How many headlines for the sidebar

  const query = {
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };

  // 1. Get the first 10 articles for the main list
  const result = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 }) 
    .limit(limit);

  // 2. Get the total count for pagination
  const totalPosts = await Article.countDocuments(query);

  // 3. Get the top 15 headlines for the sidebar (only title and slug)
  const headlineResult = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 })
    .limit(headlineLimit)
    .select('title slug'); // Only fetch what you need

  const initialArticles = serializeData(result);
  const headlines = serializeData(headlineResult); // Use the same serializer

  return {
    props: {
      initialArticles,
      totalPosts,
      headlines, // Pass real headlines to the page
    },
    revalidate: 60,
  };
}