import Head from "next/head";
import Image from "next/image";
import Script from "next/script"; // ✅ use next/script
import dbConnect from "../../lib/mongodb";
import Article from "../../models/Article";
import { Fragment, useEffect } from "react";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import SeoHead from "../../components/SeoHead";
import ShareButtons from "../../components/ShareButtons";
import he from "he";


const OPTIMIZED_DOMAINS = [
  "cakeimages.s3.ap-northeast-2.amazonaws.com",
  "via.placeholder.com",
];

export default function ArticlePage({ article }) {
  if (!article) return <p>Loading...</p>;

  let isExternalDomain = true;
  if (article.featuredImage) {
    try {
      const url = new URL(article.featuredImage);
      if (OPTIMIZED_DOMAINS.includes(url.hostname)) isExternalDomain = false;
    } catch {
      isExternalDomain = true;
    }
  }

  // --- Decode HTML ---
  const decoded = he.decode(article.content || "");
  const cleaned = decoded.replace(/\r?\n|\r/g, "").trim();

  // --- Sanitize safely (keep Telugu + HTML) ---
  const safeHtml = DOMPurify.sanitize(cleaned, {
    ADD_TAGS: [
      "h2",
      "h3",
      "p",
      "strong",
      "em",
      "hr",
      "ul",
      "ol",
      "li",
      "br",
      "a",
      "blockquote", // ✅ Correct for Twitter/Instagram
      "iframe", // ✅ Correct for YouTube/Vimeo
      // ⛔️ 'script' REMOVED FOR SECURITY. IT'S NOT NEEDED.
    ],
    ADD_ATTR: [
      "href",
      "class",
      "async",
      "src",
      "cite",
      "data-width",
      "data-height",
      "style",
      "frameborder",
      "scrolling",
      "allow",
      "allowfullscreen",
    ],
  });

  // --- Reload embeds after render ---
  useEffect(() => {
    // This re-loads embeds on client-side navigation
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [article.slug]); // Re-run when the article changes

  // --- SEO Schema ---
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

        {/* ✅ ADDED: Load the Noto Sans Telugu font */}
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

      {/* ✅ Load embed scripts properly */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-lg bg-white p-6 shadow-lg md:p-10">
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

          {/* Telugu + HTML rendering */}
          <div
            className="prose prose-lg max-w-none prose-img:rounded-lg font-[Noto_Sans_Telugu]"
            dangerouslySetInnerHTML={{ __html: decoded }}
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

// --- Static Paths (No Change) ---
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

// --- Static Props (No Change) ---
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
  article.createdAt = (article.publishedDate || article.createdAt)?.toString();
  article.updatedAt = article.updatedAt?.toString();
  delete article.publishedDate;

  return { props: { article }, revalidate: 60 };
}
