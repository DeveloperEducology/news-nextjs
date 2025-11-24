// pages/article/[slug].js

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

// ================================================================
// MDX-SAFE COMPONENTS
// ================================================================
const mdxComponents = {
  img: (props) => (
    <span className="block my-12 overflow-hidden rounded-xl bg-gray-100 shadow-lg">
      <Image
        {...props}
        width={1200}
        height={630}
        alt={props.alt || "Article image"}
        className="w-full object-cover"
        unoptimized={true}
      />
    </span>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-indigo-600">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-12 border-l-4 border-indigo-500 bg-indigo-50 py-6 pl-8 italic text-gray-700">
      {children}
    </blockquote>
  ),
};

// ================================================================
// AUTO-LINK SEO TERMS
// ================================================================
function autoLinkSEO(content) {
  if (!content) return content;

  const terms = [
    { word: "తెలంగాణ", link: "/category/telangana" },
    { word: "ఆంధ్రప్రదేశ్", link: "/category/andhra-pradesh" },
    { word: "ఫైనాన్స్", link: "/category/finance" },
    { word: "సినిమా", link: "/category/cinema" },
    { word: "వైరల్", link: "/category/viral" },
  ];

  terms.forEach(({ word, link }) => {
    const regex = new RegExp(word, "g");
    content = content.replace(
      regex,
      `<a href="${link}" class="text-blue-700 underline">${word}</a>`
    );
  });

  return content;
}

// ================================================================
// TWITTER EMBED DETECTION
// ================================================================
function convertTwitterLinksToEmbeds(content) {
  if (!content) return content;
  content = content.replace(/[\n\r]+/g, " ").trim();

  const regex =
    /(https?:\/\/(?:www\.)?(twitter|x)\.com\/[A-Za-z0-9_]+\/status\/\d+)/gi;

  return content.replace(
    regex,
    (url) => `
      <blockquote class="twitter-tweet" data-dnt="true">
        <a href="${url}"></a>
      </blockquote>
    `
  );
}

// ================================================================
// SMART MDX SAFE CHECK
// ================================================================
function isContentSafeForMDX(content) {
  if (!content) return false;

  const unsafePatterns = ["<span", "<font", "style=", "<script", "<iframe"];

  return !unsafePatterns.some((pattern) => content.includes(pattern));
}

// ================================================================
// BREADCRUMBS
// ================================================================
const Breadcrumbs = ({ article }) => (
  <div className="mb-6 text-sm text-gray-600">
    <Link href="/" className="hover:underline">
      Home
    </Link>
    <span className="mx-2">›</span>
    <Link href="/article" className="hover:underline">
      Articles
    </Link>
    <span className="mx-2">›</span>
    <span className="font-semibold text-gray-900 line-clamp-1">
      {article.title}
    </span>
  </div>
);

// ================================================================
// ARTICLE PAGE COMPONENT
// ================================================================
export default function ArticlePage({ article, mdxSource, useMDX, headlines }) {
  if (!article)
    return <p className="py-32 text-center text-2xl">Loading...</p>;

  // For Twitter embeds
  useEffect(() => {
    if (window?.twttr?.widgets) window.twttr.widgets.load();
  }, [article.slug]);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://telugushorts.com";
  const articleUrl = `${siteUrl}/article/${article.slug}`;

  // --- WHATSAPP STATUS SHARE HANDLER ---
  const handleWhatsAppStatusShare = async () => {
    if (typeof window === "undefined") return;

    const statusText = `${article.title} - ${articleUrl}`;

    try {
      // Progressive enhancement: Web Share API with image file
      if (
        navigator.share &&
        navigator.canShare &&
        article.featuredImage
      ) {
        const res = await fetch(article.featuredImage);
        const blob = await res.blob();
        const file = new File([blob], "status.jpg", {
          type: blob.type || "image/jpeg",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: statusText,
          });
          return;
        }
      }
    } catch (err) {
      console.error("Web Share failed, falling back to link:", err);
    }

    // Fallback: normal WhatsApp share (chat / groups)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(statusText)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <Fragment>
      <SeoHead
        title={article.title}
        description={article.summary || article.title}
        ogImage={article.featuredImage}
      />

      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />

      <div className="container mx-auto max-w-7xl px-4 py-6 font-sans md:py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* LEFT — MAIN ARTICLE */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg max-w-none rounded-2xl bg-white p-4 shadow-2xl md:p-8">
              <Breadcrumbs article={article} />

              <h1 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                {article.title}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>
                  By{" "}
                  <strong className="text-gray-900">
                    {article.author || "TeluguShorts Team"}
                  </strong>
                </span>
                <span>•</span>
                <time>
                  {article.createdAt
                    ? format(new Date(article.createdAt), "MMMM d, yyyy")
                    : ""}
                </time>
              </div>

              {/* SHARE ROW */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <ShareButtons title={article.title} slug={article.slug} />

                {/* NEW: WhatsApp Status Card button */}
                <button
                  type="button"
                  onClick={handleWhatsAppStatusShare}
                  className="inline-flex items-center rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  <span className="mr-2 text-lg">🟢</span>
                  <span>Share as WhatsApp Status</span>
                </button>
              </div>

              {/* FEATURED IMAGE */}
              {article.featuredImage && (
                <div className="relative my-6 h-64 w-full overflow-hidden rounded-xl shadow-xl md:my-8 md:h-80">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              )}

              {/* CONTENT RENDERING */}
              <div className="prose max-w-none text-gray-900">
                {useMDX ? (
                  <MDXRemote {...mdxSource} components={mdxComponents} />
                ) : (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                )}
              </div>

              {/* TAGS */}
              {article.tags?.length > 0 && (
                <div className="mt-12 border-t pt-6">
                  <h3 className="mb-3 text-xl font-bold">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* MOBILE HEADLINES (below article) */}
              <div className="mt-12 border-t pt-8 lg:hidden">
                <h3 className="mb-4 text-xl font-bold">Headlines</h3>
                <ul className="space-y-3">
                  {headlines.map((h) => (
                    <li key={h._id}>
                      <Link
                        href={`/article/${h.slug}`}
                        className="text-base text-gray-800 hover:text-blue-600"
                      >
                        {h.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          {/* RIGHT — HEADLINES SIDEBAR (DESKTOP) */}
          <aside className="mt-8 hidden lg:mt-0 lg:block">
            <div className="sticky top-24 rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Headlines
              </h3>
              <ul className="space-y-3">
                {headlines.map((h) => (
                  <li key={h._id}>
                    <Link
                      href={`/article/${h.slug}`}
                      className="text-base text-gray-800 hover:text-blue-600"
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

// ================================================================
// getStaticPaths
// ================================================================
export async function getStaticPaths() {
  await dbConnect();

  const articles = await Article.find({ status: "published" }, "slug").lean();

  return {
    paths: articles.map((a) => ({ params: { slug: a.slug } })),
    fallback: "blocking",
  };
}

// ================================================================
// getStaticProps
// ================================================================
export async function getStaticProps({ params }) {
  await dbConnect();

  const result = await Article.findOne({ slug: params.slug }).lean();
  if (!result) return { notFound: true };

  const article = {
    ...result,
    _id: result._id.toString(),
    createdAt: result.createdAt?.toISOString() ?? null,
    updatedAt: result.updatedAt?.toISOString() ?? null,
    publishedDate: result.publishedDate?.toISOString() ?? null,
  };

  // Fetch Headlines
  const headlinesResult = await Article.find(
    { status: "published" },
    "title slug"
  )
    .sort({ publishedDate: -1 })
    .limit(20)
    .lean();

  const headlines = headlinesResult.map((h) => ({
    ...h,
    _id: h._id.toString(),
  }));

  // MDX or HTML? (Smart Detection)
  const raw = he.decode(article.content || "");
  const contentWithSEO = autoLinkSEO(convertTwitterLinksToEmbeds(raw));

  let useMDX = isContentSafeForMDX(contentWithSEO);
  let mdxSource = null;

  if (useMDX) {
    try {
      const cleaned = contentWithSEO
        .replace(/<br\s*\/?>/gi, "<br />")
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "<br />");

      mdxSource = await serialize(cleaned, {
        mdxOptions: { development: false },
      });
    } catch (err) {
      console.error("MDX failed. Falling back to HTML:", err);
      useMDX = false;
    }
  }

  // Pass final validated content
  article.content = contentWithSEO;

  return {
    props: {
      article,
      mdxSource,
      useMDX,
      headlines,
    },
    revalidate: 60,
  };
}
