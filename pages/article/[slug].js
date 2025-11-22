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
};

// ⭐ Auto SEO Keyword Linking
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

// ⭐ Twitter Embed Fix
function convertTwitterLinksToEmbeds(content) {
  if (!content) return content;
  content = content.replace(/[\n\r]+/g, " ").trim();

  const twitterRegex =
    /(https?:\/\/(?:www\.)?(twitter|x)\.com\/[A-Za-z0-9_]+\/status\/\d+)/gi;

  return content.replace(twitterRegex, (url) => {
    return `
      <blockquote class="twitter-tweet" data-dnt="true">
        <a href="${url}"></a>
      </blockquote>
    `;
  });
}

// ⭐ Breadcrumbs Component
const Breadcrumbs = ({ article }) => (
  <nav className="text-sm text-gray-600 mb-6">
    <Link href="/" className="hover:underline">Home</Link>
    <span className="mx-2">›</span>
    <Link href="/articles" className="hover:underline">Articles</Link>
    <span className="mx-2">›</span>
    <span className="text-gray-900 font-semibold">{article.title}</span>
  </nav>
);

export default function ArticlePage({ article, mdxSource, headlines }) {
  if (!article)
    return <p className="py-32 text-center text-2xl">Loading...</p>;

  useEffect(() => {
    if (window.twttr?.widgets) window.twttr.widgets.load();
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

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg mx-auto max-w-none rounded-2xl bg-white p-8 shadow-2xl md:p-16">

              <Breadcrumbs article={article} />

              <h1 className="mb-8 text-4xl font-extrabold">{article.title}</h1>

              <time className="text-gray-600 text-lg">
                {format(new Date(article.createdAt), "MMMM d, yyyy")}
              </time>

              {mdxSource && (
                <div className="prose max-w-none mt-10">
                  <MDXRemote {...mdxSource} components={components} />
                </div>
              )}

              {/* Tags */}
              {article.tags?.length > 0 && (
                <div className="mt-20 border-t pt-10">
                  <h3 className="text-2xl font-bold mb-5">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.tags.map((t) => (
                      <span key={t} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles */}
              <div className="mt-20 border-t pt-10">
                <h3 className="text-2xl font-bold mb-5">Related Articles</h3>
                <ul className="space-y-4">
                  {headlines.slice(0, 6).map((h) => (
                    <li key={h._id}>
                      <Link
                        href={`/articles/${h.slug}`}
                        className="text-blue-700 hover:underline text-lg"
                      >
                        {h.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          {/* HEADLINES Sidebar (Mobile + Desktop) */}
          <aside className="block lg:block mt-10 lg:mt-0">
            <div className="sticky top-28 p-6 bg-white shadow-xl rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Headlines</h3>

              <ul className="space-y-3">
                {headlines.map((h) => (
                  <li key={h._id}>
                    <Link
                      href={`/articles/${h.slug}`}
                      className="text-gray-800 hover:text-blue-600 text-lg"
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

// NEXT.JS STATIC FUNCTIONS
export async function getStaticPaths() {
  await dbConnect();

  const articles = await Article.find(
    { status: "published" },
    "slug"
  ).lean();

  return {
    paths: articles.map((a) => ({ params: { slug: a.slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  await dbConnect();
  const now = new Date();

  const result = await Article.findOne({ slug: params.slug }).lean();
  if (!result) return { notFound: true };

  const article = {
    ...result,
    _id: result._id.toString(),
    createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : null,
    updatedAt: result.updatedAt ? new Date(result.updatedAt).toISOString() : null,
    publishedDate: result.publishedDate ? new Date(result.publishedDate).toISOString() : null,
  };

  // Headlines
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

  // Build MDX Source
  let mdxSource = null;

  if (article.content) {
    let content = he.decode(article.content);

    // ⭐ Fix <br> crash (THE IMPORTANT FIX)
    content = content.replace(/<br\s*\/?>/gi, "<br />");
    content = content.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "<br />");

    // Optional: Remove NBSPs
    content = content.replace(/\u00A0/g, " ");

    content = autoLinkSEO(content);
    content = convertTwitterLinksToEmbeds(content);

    mdxSource = await serialize(content, {
      mdxOptions: { development: false },
    });
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
