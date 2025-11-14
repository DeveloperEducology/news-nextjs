import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Gallery from "@/models/Gallery";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from 'react';
import QuickUpdateModal from '@/components/admin/QuickUpdateModal'; // <-- Your Modal Import

export default function AdminPage({ articles, galleries }) {
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  // Client-side filter logic
  const filteredArticles = useMemo(() => {
    if (filterType === 'full') {
      return articles.filter(article => article.isFullArticle);
    }
    if (filterType === 'live') {
      return articles.filter(article => !article.isFullArticle);
    }
    return articles; // 'all'
  }, [articles, filterType]);

  // --- Delete Handler for Articles ---
  const handleArticleDelete = async (slug) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push(router.asPath); // Refresh the page
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Delete failed'}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  };
  
  // --- Delete Handler for Galleries ---
  const handleGalleryDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this gallery?")) return;
    try {
      const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(router.asPath); // Refresh the page
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Delete failed'}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  };
  
  // --- Helper for Filter Button Styling ---
  const getButtonClass = (type) => {
    return filterType === type
      ? "rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white"
      : "rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200";
  };

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              + Quick Update
            </button>
            <Link href="/admin/create-gallery" legacyBehavior>
              <a className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
                + New Gallery
              </a>
            </Link>
            <Link href="/create-article" legacyBehavior>
              <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                + New Full Article
              </a>
            </Link>
          </div>
        </div>

        {/* --- Articles Table --- */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Articles</h2>
          <div className="flex gap-2">
            <button onClick={() => setFilterType('all')} className={getButtonClass('all')}>
              All
            </button>
            <button onClick={() => setFilterType('full')} className={getButtonClass('full')}>
              Full Articles
            </button>
            <button onClick={() => setFilterType('live')} className={getButtonClass('live')}>
              Live Updates
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg bg-white shadow-lg mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredArticles.map((article) => (
                <tr key={article._id}>
                  <td className="px-6 py-4">
                    <div className="w-96 overflow-hidden truncate font-medium text-gray-900" title={article.title}>{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.isFullArticle ? 'Full Article' : 'Live Update'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(article.createdAt), "dd MMM, yyyy")}
                  </td>
                  <td className="flex items-center gap-2 px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/admin/edit/${article.slug}`} legacyBehavior><a className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200">Edit</a></Link>
                    <button onClick={() => handleArticleDelete(article.slug)} className="rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* --- Galleries Table --- */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Galleries</h2>
        <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
           <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Images</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {galleries.map((gallery) => (
                <tr key={gallery._id}>
                  <td className="px-6 py-4"><div className="w-96 overflow-hidden truncate font-medium text-gray-900" title={gallery.title}>{gallery.title}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gallery.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{gallery.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gallery.images}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(gallery.publishedDate), "dd MMM, yyyy")}</td>
                  <td className="flex items-center gap-2 px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/admin/gallery/edit/${gallery._id}`} legacyBehavior><a className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200">Edit</a></Link>
                    <button onClick={() => handleGalleryDelete(gallery._id)} className="rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Render The Modal --- */}
      <QuickUpdateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// --- getServerSideProps ---
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  await dbConnect();
  
  // Fetch Articles
  const articleResult = await Article.find({}).sort({ createdAt: -1 });
  const articles = articleResult.map((doc) => {
    const article = doc.toObject();
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
    article.status = article.status || 'draft';
    article.isFullArticle = article.isFullArticle || false;
    return article;
  });
  
  // Fetch Galleries
  const galleryResult = await Gallery.find({}).sort({ publishedDate: -1 });
  const galleries = galleryResult.map((doc) => {
    const gallery = doc.toObject();
    gallery._id = gallery._id.toString();
    gallery.createdAt = gallery.createdAt.toString();
    gallery.updatedAt = gallery.updatedAt.toString();
    gallery.publishedDate = gallery.publishedDate.toString();
    gallery.images = gallery.images.length; 
    return gallery;
  });

  return {
    props: {
      articles: articles,
      galleries: galleries,
    },
  };
}