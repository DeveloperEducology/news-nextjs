import Head from "next/head";
import Image from "next/image";
import dbConnect from "../../lib/mongodb";
import Article from "../../models/Article";
import { Fragment } from "react";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import SeoHead from "../../components/SeoHead";

export default function ArticlePage({ article }) {
  if (!article) {
    return <p>Loading...</p>;
  }

  // --- THIS IS THE FINAL FIX ---

  // 1. Clean the junk characters from the string.
  // This regex finds all newlines, spaces, or &nbsp; characters
  // that come *before* an HTML tag and removes them.
  const cleanedContent = (article.content || "")
    .replace(/(\n|\s|&nbsp;)+<g/g, '<') // Clean before <h2>
    .replace(/(\n|\s|&nbsp;)+<p/g, '<p') // Clean before <p>
    .replace(/(\n|\s|&nbsp;)+<h/g, '<h') // Clean before <h3>
    .replace(/(\n|\s|&nbsp;)+<s/g, '<s') // Clean before <strong>
    .replace(/(\n|\s|&nbsp;)+<h/g, '<h') // Clean before <hr>
    .trim();

  // 2. Now, sanitize the *clean* HTML.
  const sanitizedContent = DOMPurify.sanitize(cleanedContent, {
    ADD_TAGS: ['h2', 'h3', 'p', 'strong', 'em', 'hr', 'ul', 'ol', 'li', 'br', 'a'],
    ADD_ATTR: ['href'] // Allows links to have an 'href'
  });
  // --- END OF FIX ---


  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary, 
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author,
    },
  };

  return (
    <Fragment>
      <SeoHead
        title={article.title}
        description={article.summary}
        ogImage={article.featuredImage}
      />

      <Head>
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-lg bg-white p-6 shadow-lg md:p-10">
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">
            {article.title}
          </h1>

          <p className="mb-6 text-gray-500">
            By <span className="font-medium">{article.author}</span> on{" "}
            {format(new Date(article.createdAt), "MMMM d, yyyy")}
          </p>

          {article.featuredImage && (
            <Image
              src={article.featuredImage}
              alt={article.title}
              width={1200}
              height={600}
              className="mb-6 w-full rounded-lg object-cover"
              priority
              unoptimized={true} 
            />
          )}

          <div
            className="prose prose-lg max-w-none prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Tags:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <a
                    key={tag}
                    className="cursor-pointer rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </Fragment>
  );
}

// --- Data Fetching (No Change) ---

export async function getStaticPaths() {
  await dbConnect();
  const now = new Date();
  const articles = await Article.find({
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  }, "slug");
  
  const paths = articles.map((article) => ({
    params: { slug: article.slug },
  }));
  
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  await dbConnect();
  const { slug } = params;

  const now = new Date();
  const result = await Article.findOne({ 
    slug: slug,
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  });

  if (!result) {
    return { notFound: true };
  }

  const article = result.toObject();
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

  return {
    props: {
      article: article,
    },
    revalidate: 60,
  };
}