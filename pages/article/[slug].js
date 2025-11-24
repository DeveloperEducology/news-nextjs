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

  // Unsafe patterns that MDX breaks on
  const unsafePatterns = [
    "<span",
    "<font",
    "style=",
    "<script",
    "<iframe",
  ];

  return !unsafePatterns.some((pattern) => content.includes(pattern));
}

// ================================================================
// BREADCRUMBS
// ================================================================
const Breadcrumbs = ({ article }) => (
  <div className="text-sm text-gray-600 mb-6">
    <Link href="/" className="hover:underline">Home</Link>
    <span className="mx-2">›</span>
    <Link href="/article" className="hover:underline">Articles</Link>
    <span className="mx-2">›</span>
    <span className="text-gray-900 font-semibold">{article.title}</span>
  </div>
);

// ================================================================
// ARTICLE PAGE COMPONENT
// ================================================================
export default function ArticlePage({ article, mdxSource, useMDX, headlines }) {
  if (!article)
    return <p className="py-32 text-center text-2xl">Loading...</p>;

  useEffect(() => {
    if (window?.twttr?.widgets) window.twttr.widgets.load();
  }, [article.slug]);

  return (
    <Fragment>
      <SeoHead
        title={article.title}
        description={article.summary || article.title}
        ogImage={article.featuredImage}
      />

      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />

      <div className="container mx-auto max-w-7xl px-4 py-12 font-sans">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* LEFT — MAIN ARTICLE */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg max-w-none bg-white p-8 rounded-2xl shadow-2xl">

              <Breadcrumbs article={article} />

              <h1 className="text-4xl font-extrabold mb-6">
                {article.title}
              </h1>

              <time className="text-gray-600">
                {format(new Date(article.createdAt), "MMMM d, yyyy")}
              </time>

              <div className="my-8">
                <ShareButtons title={article.title} slug={article.slug} />
              </div>

              {/* FEATURED IMAGE */}
              {article.featuredImage && (
                <div className="relative my-10 h-80 w-full rounded-xl overflow-hidden shadow-xl">
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
              {useMDX ? (
                <MDXRemote {...mdxSource} components={mdxComponents} />
              ) : (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              )}

              {/* TAGS */}
              {article.tags?.length > 0 && (
                <div className="mt-20 border-t pt-8">
                  <h3 className="text-2xl font-bold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RELATED ARTICLES */}
              <div className="mt-20 border-t pt-10">
                <h3 className="text-2xl font-bold mb-5">Related Articles</h3>
                <ul className="space-y-3">
                  {headlines.slice(0, 6).map((h) => (
                    <li key={h._id}>
                      <Link
                        href={`/article/${h.slug}`}
                        className="text-blue-700 text-lg hover:underline"
                      >
                        {h.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </article>
          </div>

          {/* RIGHT — HEADLINES SIDEBAR */}
          <aside className="block lg:block mt-10 lg:mt-0">
            <div className="sticky top-28 bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-2xl font-bold mb-4">Headlines</h3>
              <ul className="space-y-3">
                {headlines.map((h) => (
                  <li key={h._id}>
                    <Link
                      href={`/article/${h.slug}`}
                      className="text-lg text-gray-800 hover:text-blue-600"
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
