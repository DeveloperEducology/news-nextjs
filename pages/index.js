// pages/index.js

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SeoHead from "../components/SeoHead";
import ArticleCard from "../components/ArticleCard";
import dbConnect from "../lib/mongodb";
import Article from "../models/Article";

// =============================================================
// 🔥 CATEGORY FILTERS (SEO-FRIENDLY)
// =============================================================
const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Politics", value: "politics" },
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Viral", value: "viral" },
  { label: "Cinema", value: "cinema" },
  { label: "Sports", value: "sports" },
];

// =============================================================
// 🔥 HOMEPAGE COMPONENT
// =============================================================
export default function Home({ initialArticles, totalPosts, headlines }) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalPosts);
  const [category, setCategory] = useState("all");

  const observerRef = useRef(null);

  // =============================================================
  // 🔥 INFINITE SCROLL
  // =============================================================
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    const el = document.getElementById("infinite-loader");
    if (el) observerRef.current.observe(el);
  }, [articles, hasMore]);

  const loadMore = async () => {
    setLoading(true);

    const res = await fetch(`/api/articles?page=${page}&category=${category}`);
    const { data: newArticles, total } = await res.json();

    setArticles((prev) => [...prev, ...newArticles]);
    setPage((p) => p + 1);

    if (articles.length + newArticles.length >= total) setHasMore(false);

    setLoading(false);
  };

  // =============================================================
  // 🔥 CATEGORY FILTER HANDLER
  // =============================================================
  const handleCategoryChange = async (cat) => {
    setCategory(cat);
    setPage(2);
    setLoading(true);

    const res = await fetch(`/api/articles?page=1&category=${cat}`);
    const { data, total } = await res.json();

    setArticles(data);
    setHasMore(data.length < total);

    setLoading(false);
  };

  return (
    <>
      <SeoHead
        title="Latest News – Fast, Accurate, Breaking"
        description="Get the latest breaking news on politics, business, technology, viral trends, cinema, and more."
      />

      {/* ============================================================= */}
      {/* 🔥 TRENDING TOP TICKER */}
      {/* ============================================================= */}
      <div className="sticky top-0 z-40 bg-black py-2 text-white shadow-md">
        <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4">
          <span className="bg-red-600 px-3 py-1 text-xs font-bold">TRENDING</span>
          <marquee className="text-sm">
            {headlines.map((h) => h.title).join(" • ")}
          </marquee>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 🔥 MAIN LAYOUT */}
      {/* ============================================================= */}
      <main className="container mx-auto max-w-7xl px-4 py-8">

        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ============================================================= */}
          {/* 🔥 LEFT SIDE (MAIN CONTENT) */}
          {/* ============================================================= */}
          <div className="lg:col-span-2">

            {/* 🔥 Category Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCategoryChange(c.value)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    category === c.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* ============================================================= */}
            {/* 🔥 1 → 2 → 3 Responsive Grid */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <div
                  key={article._id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <ArticleCard article={article} priority={index === 0} />
                </div>
              ))}
            </div>

            {/* ============================================================= */}
            {/* 🔥 Infinite Loader */}
            {/* ============================================================= */}
            {hasMore && (
              <div id="infinite-loader" className="my-10 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 🔥 RIGHT SIDE — STICKY HEADLINES SIDEBAR */}
          {/* ============================================================= */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-4 rounded-xl bg-white p-6 shadow-xl">

              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Top Headlines
              </h3>

              <ul className="space-y-4">
                {headlines.map((h) => (
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
      </main>

      {/* ============================================================= */}
      {/* 🔥 GLOBAL STYLES (FADE-IN ANIMATION) */}
      {/* ============================================================= */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </>
  );
}

// =============================================================
// 🔥 getStaticProps
// =============================================================
export async function getStaticProps() {
  await dbConnect();

  const now = new Date();
  const limit = 12;

  const query = {
    isFullArticle: true,
    status: "published",
    publishedDate: { $lte: now }
  };

  // Articles
  const result = await Article.find(query)
    .sort({ publishedDate: -1 })
    .limit(limit)
    .lean();

  const totalPosts = await Article.countDocuments(query);

  // Headlines
  const headlineResult = await Article.find(query)
    .sort({ publishedDate: -1 })
    .limit(20)
    .select("title slug createdAt updatedAt publishedDate")
    .lean();

  // --- FIXED SERIALIZATION ---
  const initialArticles = result.map((item) => ({
    ...item,
    _id: item._id.toString(),
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    publishedDate: item.publishedDate
      ? item.publishedDate.toISOString()
      : null,
  }));

  const headlines = headlineResult.map((item) => ({
    ...item,
    _id: item._id.toString(),
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    publishedDate: item.publishedDate
      ? item.publishedDate.toISOString()
      : null,
  }));

  return {
    props: {
      initialArticles,
      totalPosts,
      headlines,
    },
    revalidate: 60,
  };
}
