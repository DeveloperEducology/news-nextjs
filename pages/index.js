import Head from 'next/head';
import dbConnect from '../lib/mongodb';
import Article from '../models/Article';
import ArticleCard from '../components/ArticleCard'; // We should use this
import SeoHead from '../components/SeoHead';

export default function Home({ articles }) {
  return (
    <>
      <SeoHead 
        title="Homepage" 
        description="The very latest news on technology, science, and more."
      />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Latest News</h1>
        
        <div className="article-list">
          {articles &&
            articles.map((article) => (
              // Use the ArticleCard component we built
              <ArticleCard key={article._id} article={article} />
            ))}
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  await dbConnect();

  const result = await Article.find({}).sort({ createdAt: -1 }).limit(10);

  const articles = result.map((doc) => {
    const article = doc.toObject();
    
    article._id = article._id.toString();

    // Use 'publishedDate' if 'createdAt' is missing
    if (article.publishedDate) {
      article.createdAt = article.publishedDate.toString();
    } else if (article.createdAt) {
      article.createdAt = article.createdAt.toString();
    }

    // Safely check for 'updatedAt'
    if (article.updatedAt) {
      article.updatedAt = article.updatedAt.toString();
    }

    // Clean up original date object if it exists
    delete article.publishedDate; 
    
    return article;
  });

  return {
    props: {
      articles: articles,
    },
    revalidate: 60,
  };
}