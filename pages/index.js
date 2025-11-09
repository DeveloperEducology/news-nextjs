import Head from 'next/head';
import Link from 'next/link';
import dbConnect from '../lib/mongodb';
import Article from '../models/Article'; // Assumes this model exists
import { useState } from 'react';
import ArticleCard from '../components/ArticleCard';

// ===================================================================
// 2. LOCAL COMPONENTS (for testing)
// In a real app, these would be in /components/
// ===================================================================

// --- Sample Data for Column 2 (Sticky Headlines) ---
const sampleHeadlines = [
  "Breaking: New Element 'Vibranium' Discovered",
  "World Leaders to Meet for Global AI Summit",
  "Stock Market Hits All-Time High Amidst Tech Boom",
  "Is the 4-Day Work Week the Future?",
  "Cybersecurity Alert: New 'Quantum' Virus Detected",
  "Hollywood Star Announces Surprise Retirement",
  "Sports Finals: Underdogs Win in Shocking Upset",
  "Scientists Grow 'Mini-Brains' in Lab",
  "First Commercial 'Flying Car' Service Lauches in Dubai",
  "Ancient Ruin Uncovered in Amazon Rainforest",
  "New Study Links Gut Health to Mental Clarity",
  "Self-Driving Trucks to Begin Cross-Country Routes",
  "Major Automaker Pledges to Go All-Electric by 2030",
  "Deep-Sea 'Ghost' Shark Filmed for First Time",
  "Art World Stunned by $500M Painting Sale",
];

function SeoHead({ title, description }) {
  const siteTitle = 'NewsGrid | Your Daily Feed';
  const fullTitle = `${title} | ${siteTitle}`;
  return (
    <Head>
      {/* <title>{fullTitle}</title> */}
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <h1 className="text-2xl font-bold text-blue-600">
          {/* <Link href="/">NewsGrid</Link> */}
        </h1>
      </div>
    </header>
  );
}



// ===================================================================
// 1. HOME PAGE COMPONENT
// ===================================================================
export default function Home({ initialArticles, totalPosts, headlines }) {
  
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2); 
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalPosts);

  // This function fetches from your new /api/articles route
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
    <div className="bg-gray-50 min-h-screen">
      <SeoHead 
        title="Homepage" 
        description="The very latest news on technology, science, and more."
      />

      <Header />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Two-column layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">

          {/* === COLUMN 1: MAIN CONTENT (Scrolls) === */}
          <div className="lg:col-span-2">
            {/* <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Latest News
            </h1> */}
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {articles &&
                articles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
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
          {/* <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="mt-8 lg:mt-0">
                <h2 className="text-xl font-bold text-gray-900">
                  Latest Headlines
                </h2>
                
                <div className="mt-4 max-h-[75vh] overflow-y-auto rounded-lg border bg-white p-4 shadow-sm">
                  <ul className="divide-y divide-gray-200">
                    {headlines.map((headline) => (
                      <li key={headline._id} className="py-3">
                        <Link href={`/${headline.slug || headline._id}`} className="font-medium text-gray-700 hover:text-blue-600">
                          {headline.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div> */}
          
        </div>
      </div>
    </div>
  );
}


// ===================================================================
// 3. getStaticProps (UPDATED)
// ===================================================================
// Helper function to serialize data
function serializeArticles(articleDocs) {
  return articleDocs.map((doc) => {
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
    
    // Ensure all fields are serializable (remove if not needed)
    Object.keys(article).forEach(key => {
      if (article[key] instanceof Date) {
        article[key] = article[key].toString();
      }
    });

    return article;
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

  const initialArticles = serializeArticles(result);
  const headlines = serializeArticles(headlineResult);

  return {
    props: {
      initialArticles,
      totalPosts,
      headlines, // Pass headlines to the page
    },
    revalidate: 60,
  };
}