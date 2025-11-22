// pages/articles/[slug].js

import Head from "next/head";
import Image from "next/image";
import Script from "next/script";
import { Fragment, useEffect } from "react";
import { format } from "date-fns";
import SeoHead from "../../components/SeoHead";
import ShareButtons from "../../components/ShareButtons";
import he from "he";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import dbConnect from "../../lib/mongodb";
import Article from "../../models/Article";
import Link from "next/link";


// ──────────────────────────────────────────────────────────────
// Safe MDX Components
// ──────────────────────────────────────────────────────────────
const components = {
  img: (props) => (
    <span className="block my-12 overflow-hidden rounded-xl bg-gray-100 shadow-lg">
      <Image
        {...props}
        width={1200}
        height={630}
        className="w-full object-cover"
        alt={props.alt || "Article image"}
        unoptimized={true}
      />
    </span>
  ),
  table: ({ children }) => (
    <div className="my-10 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 bg-white">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  th: ({ children }) => (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-6 py-4 text-sm text-gray-800">{children}</td>,
  strong: ({ children }) => <strong className="font-bold text-indigo-600">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-12 border-l-4 border-indigo-500 bg-indigo-50 py-6 pl-8 italic text-gray-700">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-10 overflow-x-auto rounded-xl bg-gray-900 p-6 text-sm text-gray-100">{children}</pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-gray-800 px-2 py-1 text-sm font-medium text-pink-300">{children}</code>
  ),
};

const OPTIMIZED_DOMAINS = ["cakeimages.s3.ap-northeast-2.amazonaws.com"];

// ──────────────────────────────────────────────────────────────
// ARTICLE PAGE
// ──────────────────────────────────────────────────────────────
export default function ArticlePage({ article, mdxSource, headlines }) {
  if (!article) return <p className="py-32 text-center text-2xl">Loading...</p>;

  const isExternalImage = article.featuredImage
    ? !OPTIMIZED_DOMAINS.some((d) => article.featuredImage.includes(d))
    : true;

  useEffect(() => {
    if (window.twttr?.widgets) window.twttr.widgets.load();
    if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
  }, []);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary || article.title,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: { "@type": "Person", name: article.author || "TaxPro Dev" },
    image: article.featuredImage || null,
  };

  return (
    <Fragment>
      <SeoHead
        title={article.title}
        description={article.summary || "Ultimate 2026 tax deduction guide for freelance developers"}
        ogImage={article.featuredImage}
      />

      <Head>
        <meta property="og:type" content="article" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />

      {/* ─────────────────────────────── */}
      {/* PAGE LAYOUT WITH SIDEBAR       */}
      {/* ─────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-12 font-sans">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ─────────── LEFT SIDE ARTICLE ─────────── */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg mx-auto max-w-none rounded-2xl bg-white p-8 shadow-2xl md:p-16">

              <h1 className="mb-8 text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
                {he.decode(article.title)}
              </h1>

              <div className="mb-10 flex flex-wrap items-center gap-4 text-lg text-gray-600">
                <span>
                  By <strong className="text-gray-900">{article.author || "TaxPro Dev"}</strong>
                </span>
                <span>•</span>
                <time>{format(new Date(article.createdAt), "MMMM d, yyyy")}</time>
              </div>

              <ShareButtons title={article.title} slug={article.slug} />

              {article.featuredImage && (
                <div className="relative my-16 h-96 w-full overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    priority
                    unoptimized={isExternalImage}
                    className="object-cover"
                  />
                </div>
              )}

              <div className="prose prose-indigo max-w-none text-gray-800">
                {mdxSource ? (
                  <MDXRemote {...mdxSource} components={components} />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: article.content || article.liveContent || "",
                    }}
                  />
                )}
              </div>

              {article.tags?.length > 0 && (
                <div className="mt-20 border-t pt-10">
                  <h3 className="mb-5 text-2xl font-bold text-gray-900">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* ─────────── RIGHT SIDE STICKY HEADLINES ─────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Headlines</h3>

              <ul className="space-y-4">
                {headlines?.map((h) => (
                  <li key={h._id}>
                    <Link
                      href={`/article/${h.slug}`}
                      className="text-lg font-medium leading-snug text-gray-800 hover:text-blue-600"
                    >
                      {h.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </Fragment>
  );
}

// ──────────────────────────────────────────────────────────────
// getStaticPaths
// ──────────────────────────────────────────────────────────────
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
  ).lean();

  const paths = articles.map((a) => ({ params: { slug: a.slug } }));
  return { paths, fallback: "blocking" };
}

// ──────────────────────────────────────────────────────────────
// getStaticProps (UPDATED WITH HEADLINES)
// ──────────────────────────────────────────────────────────────
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
  }).lean();

  if (!result) return { notFound: true };

  const article = { ...result };
  article._id = article._id.toString();

  article.createdAt = article.publishedDate
    ? new Date(article.publishedDate).toISOString()
    : article.createdAt
    ? new Date(article.createdAt).toISOString()
    : new Date().toISOString();

  if (article.updatedAt) article.updatedAt = new Date(article.updatedAt).toISOString();
  if (article.publishedDate) article.publishedDate = new Date(article.publishedDate).toISOString();

  article.tags = article.tags || [];
  article.isFullArticle = !!article.isFullArticle;

  // ─── HEADLINES QUERY (same as homepage) ───
  const headlineLimit = 20;

  const headlinesResult = await Article.find(
    {
      isFullArticle: true,
      status: "published",
      publishedDate: { $lte: now },
    },
    "title slug"
  )
    .sort({ publishedDate: -1, createdAt: -1 })
    .limit(headlineLimit)
    .lean();

  const headlines = headlinesResult.map((h) => ({
    ...h,
    _id: h._id.toString(),
  }));
console.log("HEADLINES:", headlinesResult);

  // ──────────────────────────────────────────────
  // MDX SERIALIZATION
  // ──────────────────────────────────────────────
  let mdxSource = null;

  if (article.isFullArticle && article.content) {
    let content = he.decode(article.content);

    content = content
      .replace(/<br>/gi, "<br />")
      .replace(/<hr>/gi, "<hr />")
      .replace(/<img([^>]+)>/gi, (_, p) => `<img${p} />`);

    content = content.replace(/ class=/g, " className=");

    content = content.replace(
      /style=("([^"]*)"|'([^']*)')/g,
      (_, __, double, single) => {
        const css = double || single || "";
        if (!css.trim()) return "style={{}}";

        const rules = css
          .split(";")
          .filter(Boolean)
          .map((rule) => {
            const [prop, val] = rule.split(":").map((s) => s.trim());
            if (!prop || !val) return null;
            const camel = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            return `${camel}: "${val}"`;
          })
          .filter(Boolean)
          .join(", ");

        return `style={{ ${rules} }}`;
      }
    );

    try {
      mdxSource = await serialize(content, { mdxOptions: { development: false } });
    } catch (err) {
      console.error(`MDX serialization failed for ${slug}:`, err.message);
    }
  }

  return {
    props: {
      article,
      mdxSource,
      headlines,
    },
    revalidate: 60,
  };
}
