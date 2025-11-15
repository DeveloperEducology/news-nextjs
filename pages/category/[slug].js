import Head from 'next/head';
import dbConnect from '../../lib/mongodb';
import Article from '../../models/Article';
import ArticleCard from '../../components/ArticleCard';
import SeoHead from '../../components/SeoHead';

export default function CategoryPage({ articles, categoryName }) {
  
  // If no articles are found, show a message
  if (!articles || articles.length === 0) {
    return (
      <>
        <SeoHead title={`No articles found in ${categoryName}`} />
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-center text-3xl font-bold">
            {categoryName}
          </h1>
          <p className="text-center text-gray-600">
            No articles have been published in this category yet.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead 
        title={`${categoryName} News`}
        description={`The latest news and articles in the ${categoryName} category.`}
      />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Category: {categoryName}
        </h1>
        
        <div className="article-list">
          {articles.map((article, index) => (
            <ArticleCard 
              key={article._id} 
              article={article} 
              priority={index < 2} // Prioritize loading the first two images
            />
          ))}
        </div>
      </div>
    </>
  );
}

// This function runs on the server for every request
export async function getServerSideProps(context) {
  const { slug } = context.params;

  // 1. Convert the URL slug back into a "Category Name"
  // e.g., "andhra-pradesh" -> "Andhra Pradesh"
  const categoryName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // 2. Create a case-insensitive regex to match the category
  // This will match "Tech" or "tech"
  const categoryRegex = new RegExp(`^${categoryName}$`, 'i');

  await dbConnect();
  const now = new Date();

  // 3. Find all published articles that match the category
  const query = {
    category: categoryRegex, // Use the case-insensitive regex
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };

  const result = await Article.find(query).sort({ publishedDate: -1, createdAt: -1 });

  // 4. Serialize the data (convert dates and IDs)
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
      categoryName: categoryName, // Pass the name to the page
    },
  };
}