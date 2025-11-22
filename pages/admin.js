import { getSession, useSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Gallery from "@/models/Gallery";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from 'react';
import QuickUpdateModal from '@/components/admin/QuickUpdateModal';

// Helper: Creates a URL-friendly slug (with Telugu support)
// Helper: Creates a URL-friendly slug
const slugify = (str) => {
  if (!str) return '';
  str = str.toLowerCase().trim();
  // This regex checks if the string contains any Telugu characters
  const teluguRegex = /[\u0C00-\u0C7F]/;

  if (teluguRegex.test(str)) {
    // --- THIS IS THE FIX ---
    // The hyphen is now escaped: \-
    return str.replace(/\s+/g, '-').replace(/[^\u0C00-\u0C7F\w\-]+/g, '');
    // --- END OF FIX ---
  } else {
    // For English, use the aggressive slugify
    return str.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  }
};

// --- THIS IS THE NEW "QUICK POST" FORM ---
function QuickPostForm({ categories, authorName }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [liveContent, setLiveContent] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(slugify(newTitle)); // Auto-generate slug
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const dataToSend = {
      title: title,
      slug: slug,
      liveContent: liveContent,
      isFullArticle: false, // This makes it a "Live Update"
      status: 'published',
      summary: liveContent.substring(0, 150).replace(/<[^>]+>/g, ''), // Auto-generate summary
      author: authorName,
      category: category,
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        // Ping Google Indexing API
        fetch('/api/request-indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPath: `/live/${slugify(category)}`,
            type: 'URL_UPDATED'
          })
        });
        
        setTitle('');
        setSlug('');
        setLiveContent('');
        alert('Live update posted!');
        router.push(router.asPath); // Refresh the dashboard
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post update.');
      }
    } catch (err) {
      setError(err.message);
    }
    setIsSubmitting(false);
  };
  
  const formInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <div className="mb-12 rounded-lg bg-white p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Post a Live Update</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quickTitle" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="quickTitle"
            value={title}
            onChange={handleTitleChange}
            className={formInputClasses}
            placeholder="Breaking: Event Happening Now"
            required
          />
        </div>
        <div>
          <label htmlFor="quickSlug" className="block text-sm font-medium text-gray-700">Slug (auto-generated)</label>
          <input
            type="text"
            id="quickSlug"
            value={slug}
            readOnly
            className={`${formInputClasses} bg-gray-100`}
          />
        </div>
        <div>
          <label htmlFor="quickCategory" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="quickCategory"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={formInputClasses}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quickContent" className="block text-sm font-medium text-gray-700">Live Content</label>
          <textarea
            id="quickContent"
            value={liveContent}
            onChange={(e) => setLiveContent(e.target.value)}
            placeholder="Type your quick update here... (Basic HTML is allowed)"
            className={`${formInputClasses} font-mono`}
            rows="4"
            required
          />
        </div>
        
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md border border-transparent bg-red-600 px-6 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Posting...' : 'Post Live'}
        </button>
      </form>
    </div>
  );
}
// --- END OF NEW FORM ---


export default function AdminPage({ articles, galleries, categories }) {
  const router = useRouter();
  const { data: session } = useSession(); // Get session to pass author name
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  const filteredArticles = useMemo(() => {
    if (filterType === 'full') {
      return articles.filter(article => article.isFullArticle);
    }
    if (filterType === 'live') {
      return articles.filter(article => !article.isFullArticle);
    }
    return articles;
  }, [articles, filterType]);

  const handleArticleDelete = async (slug) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      fetch('/api/request-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlPath: `/article/${slug}`,
          type: 'URL_DELETED'
        })
      });
      router.push(router.asPath); 
    } catch (error) { alert(error.message); }
  };
  
  const handleGalleryDelete = async (id, slug) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/galleries/${id}`, { method: "DELETE" });
      fetch('/api/request-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlPath: `/gallery/${slug}`,
          type: 'URL_DELETED'
        })
      });
      router.push(router.asPath);
    } catch (error) { alert(error.message); }
  };
  
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
            <Link href="/admin/bulk-import" legacyBehavior>
                <a className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">
                  + Bulk Import
                </a>
              </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              + Quick Update (Modal)
            </button>
            <Link href="/admin/fetch-tweets" legacyBehavior>
              <a className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700">
                + Fetch Tweets
              </a>
            </Link>
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
        
        {/* Pass categories and author to the form */}
        <QuickPostForm 
          categories={categories} 
          authorName={session?.user?.name || 'Admin'}
        />

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
                    <button onClick={() => handleGalleryDelete(gallery._id, gallery.slug)} className="rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <QuickUpdateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// --- getServerSideProps (Fetches ALL data) ---
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
    gallery.images = gallery.images.length; // Just send the count
    gallery.slug = gallery.slug; // <-- Added slug for delete function
    return gallery;
  });

  // Fetch categories
  const categoriesList = await Article.distinct("category");
  const sortedCategories = categoriesList.filter(cat => cat).sort();

  return {
    props: {
      articles: articles,
      galleries: galleries,
      categories: sortedCategories,
    },
  };
}