import Head from "next/head";
import Image from "next/image";
import Script from "next/script";
import dbConnect from "../../lib/mongodb";
import Article from "../../models/Article";
import { Fragment, useEffect } from "react";
import { format } from "date-fns";
import SeoHead from "../../components/SeoHead";
import ShareButtons from "../../components/ShareButtons";
import DOMPurify from "isomorphic-dompurify"; // <-- 1. IMPORT DOMPURIFY
import he from "he"; // <-- 2. IMPORT 'he'

// --- (Optimized domains list is unchanged) ---
const OPTIMIZED_DOMAINS = [
  "cakeimages.s3.ap-northeast-2.amazonaws.com",
  "via.placeholder.com",
];

export default function ArticlePage({ article }) {
  if (!article) return <p>Loading...</p>;

  // --- (Image domain check is unchanged) ---
  let isExternalDomain = true;
  if (article.featuredImage) {
    try {
      const url = new URL(article.featuredImage);
      if (OPTIMIZED_DOMAINS.includes(url.hostname)) isExternalDomain = false;
    } catch {
      isExternalDomain = true;
    }
  }

  // --- 3. NEW CONTENT CLEANING & SANITIZING ---
  // Decode HTML entities (like &lt;)
  const decodedContent = he.decode(article.content || "");
  
  // Clean whitespace junk (fixes invisible characters)
  const cleanedContent = decodedContent.replace(/(\n|\s|&nbsp;)+<([a-z])/g, '<$2').trim();

  // Sanitize the HTML, allowing all tags from your editor
  const sanitizedContent = DOMPurify.sanitize(cleanedContent, {
    ADD_TAGS: [
      'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 's', 
      'blockquote', 'pre', 'span', 'sub', 'sup', 'ol', 'ul', 'li', 
      'a', 'img', 'iframe', 'br', 'hr', 'div',
    ],
    ADD_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 
      'frameborder', 'allow', 'allowfullscreen', 'target'
    ],
  });
  // --- END OF NEW LOGIC ---

  // --- (useEffect for embeds is still needed) ---
  useEffect(() => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [article.slug]);

  // --- (Schema data is unchanged) ---
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* (Embed scripts are unchanged) */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-lg bg-white p-6 shadow-lg md:p-10">
          
          {/* ... (Article Header, ShareButtons, Image are unchanged) ... */}
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">
            {article.title}
          </h1>
          <p className="mb-6 text-gray-500">
            By <span className="font-medium">{article.author}</span> on{" "}
            {format(new Date(article.createdAt), "MMMM d, yyyy")}
          </p>
          <div className="mb-6">
            <ShareButtons title={article.title} slug={article.slug} />
          </div>
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

          {/* --- 4. RENDER THE SANITIZED HTML --- */}
          {/* We are back to using dangerouslySetInnerHTML */}
          <div
            className="prose prose-lg max-w-none prose-img:rounded-lg font-[Noto_Sans_Telugu]"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          {/* --- END OF CHANGE --- */}

          {/* ... (Tags section is unchanged) ... */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Tags:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {article?.tags.map((tag) => (
                  <a
                    key={tag}
                    className="cursor-pointer rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200"
                  >
                    <h2>{tag}</h2>
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

// --- 5. RESTORED 'getStaticPaths' TO USE YOUR DATABASE ---
export async function getStaticPaths() {
  await dbConnect();
  const now = new Date();
  const articles = await Article.find(
    {
      $or: [
        { status: "published", publishedDate: { $lte: now } },
        { status: { $exists: false } },
      ],
    },
    "slug"
  );
  
  const paths = articles.map((a) => ({ params: { slug: a.slug } }));
  return { paths, fallback: "blocking" };
}

// --- 6. RESTORED 'getStaticProps' TO USE YOUR DATABASE ---
export async function getStaticProps({ params }) {
  await dbConnect();
  const { slug } = params;
  const now = new Date();

  const result = await Article.findOne({
    slug,
    $or: [
      { status: "published", publishedDate: { $lte: now } },
      { status: { $exists: false } },
    ],
  });

  if (!result) return { notFound: true };

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

  return { props: { article }, revalidate: 60 };
}