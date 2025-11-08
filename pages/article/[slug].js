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

  // Sanitize the HTML content
  const sanitizedContent = DOMPurify.sanitize(article.content || "");

  // Structured Data for SEO (Rich Snippets)
  // --- FIX: Use summary, not excerpt ---
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary, // <-- FIXED
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author,
    },
  };

  return (
    <Fragment>
      {/* --- 1. USE SeoHead FOR ALL PRIMARY TAGS --- */}
      <SeoHead
        title={article.title}
        description={article.summary} // <-- FIXED
        ogImage={article.featuredImage}
      />

      {/* --- 2. USE A SMALL Head FOR PAGE-SPECIFIC TAGS ONLY --- */}
      <Head>
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      {/* This is the centered, styled article layout */}
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
              unoptimized={true} // Keep this to allow all domains
            />
          )}

          {/* This 'prose' class will now use "Noto Sans Telugu"
              from your tailwind.config.js file
          */}
          <div
            className="prose prose-lg max-w-none prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* --- 3. RE-ADDED THE TAGS SECTION --- */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Tags:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <a
                    key={tag}
                    // href={`/tag/${tag}`} // Link for your tag page
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

// --- Your Data Fetching Functions (No Change Needed) ---

export async function getStaticPaths() {
  await dbConnect();
  const articles = await Article.find({}, "slug");
  const paths = articles.map((article) => ({
    params: { slug: article.slug },
  }));
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  await dbConnect();
  const { slug } = params;
  const result = await Article.findOne({ slug: slug });

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
