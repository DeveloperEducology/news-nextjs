import Head from "next/head";
import Image from "next/image";
import dbConnect from "../../lib/mongodb";
import Article from "../../models/Article";
import { Fragment } from "react";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import SeoHead from "../../components/SeoHead";
import ShareButtons from "../../components/ShareButtons"; // <-- 1. IMPORT SHARE BUTTONS

// --- Define Your Trusted Domains ---
const OPTIMIZED_DOMAINS = [
  'cakeimages.s3.ap-northeast-2.amazonaws.com',
  'via.placeholder.com',
];

export default function ArticlePage({ article }) {
  if (!article) {
    return <p>Loading...</p>;
  }

  // --- Check if image is external ---
  let isExternalDomain = true;
  if (article.featuredImage) {
    try {
      const url = new URL(article.featuredImage);
      if (OPTIMIZED_DOMAINS.includes(url.hostname)) {
        isExternalDomain = false;
      }
    } catch (e) {
      isExternalDomain = true;
    }
  }

  // --- Content Cleaning Logic ---
  const cleanedContent = (article.content || "")
    .replace(/(\n|\s|&nbsp;)+<g/g, '<')
    .replace(/(\n|\s|&nbsp;)+<p/g, '<p')
    .replace(/(\n|\s|&nbsp;)+<h/g, '<h')
    .replace(/(\n|\s|&nbsp;)+<s/g, '<s')
    .replace(/(\n|\s|&nbsp;)+<h/g, '<h')
    .trim();

  // --- 2. UPDATE DOMPURIFY TO ALLOW EMBEDS ---
  const sanitizedContent = DOMPurify.sanitize(cleanedContent, {
    ADD_TAGS: [
      'h2', 'h3', 'p', 'strong', 'em', 'hr', 'ul', 'ol', 'li', 'br', 'a',
      'blockquote', // For Twitter/Instagram
      'script',     // For Twitter/Instagram
      'iframe'      // For YouTube/Vimeo
    ],
    ADD_ATTR: [
      'href', 'class', 'async', 'src', 'cite', 'data-width', 
      'data-height', 'style', 'frameborder', 'scrolling'
    ],
  });
  // --- End of Update ---

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
        {/* Instagram/Twitter embed script. This is needed ONCE per page. */}
        <script async src="//www.instagram.com/embed.js"></script>
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
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

          {/* --- 3. ADD SHARE BUTTONS --- */}
          <div className="mb-6">
            <ShareButtons title={article.title} slug={article.slug} />
          </div>
          {/* --- END SHARE BUTTONS --- */}

          {article.featuredImage && (
            <Image
              src={article.featuredImage}
              alt={article.title}
              width={1200}
              height={600}
              className="mb-6 w-full rounded-lg object-cover"
              priority
              unoptimized={isExternalDomain} 
            />
          )}

          {/* This will now render your HTML content AND embeds */}
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