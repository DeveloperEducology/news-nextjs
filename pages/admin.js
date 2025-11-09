import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Gallery from "@/models/Gallery"; // <-- 1. IMPORT GALLERY MODEL
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";

// 2. ACCEPT 'galleries' AS A PROP
export default function AdminPage({ articles, galleries }) {
  const router = useRouter();

  // This function is for deleting ARTICLES
  const handleArticleDelete = async (slug) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push(router.asPath); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  };
  
  // --- 3. ADD NEW DELETE HANDLER FOR GALLERIES ---
  const handleGalleryDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this gallery?")) {
      return;
    }
    try {
      // Use the new API route with the gallery's ID
      const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(router.asPath); // Refresh the page
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  };
  // --- END OF NEW HANDLER ---

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          
          {/* --- 4. UPDATED LINKS --- */}
          <div className="flex gap-4">
            <Link href="/admin/create-gallery" legacyBehavior>
              <a className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
                + New Gallery
              </a>
            </Link>
            <Link href="/create-article" legacyBehavior>
              <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                + New Article
              </a>
            </Link>
          </div>
          {/* --- END OF UPDATE --- */}
        </div>

        {/* --- Articles Table --- */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Articles</h2>
        <div className="overflow-x-auto rounded-lg bg-white shadow-lg mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            {/* ... (Article table head) ... */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {articles.map((article) => (
                <tr key={article._id}>
                  <td className="px-6 py-4">
                    <div className="w-96 overflow-hidden truncate font-medium text-gray-900" title={article.title}>
                      {article.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(article.createdAt), "dd MMM, yyyy")}
                  </td>
                  <td className="flex items-center gap-2 px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/admin/edit/${article.slug}`} legacyBehavior>
                      <a className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200">Edit</a>
                    </Link>
                    <button
                      onClick={() => handleArticleDelete(article.slug)}
                      className="rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- 5. NEW GALLERIES TABLE --- */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Galleries</h2>
        <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {galleries.map((gallery) => (
                <tr key={gallery._id}>
                  <td className="px-6 py-4">
                    <div className="w-96 overflow-hidden truncate font-medium text-gray-900" title={gallery.title}>
                      {gallery.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gallery.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {gallery.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gallery.images.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(gallery.publishedDate), "dd MMM, yyyy")}
                  </td>
                  <td className="flex items-center gap-2 px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/admin/gallery/edit/${gallery._id}`} legacyBehavior>
                      <a className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200">
                        Edit
                      </a>
                    </Link>
                    <button
                      onClick={() => handleGalleryDelete(gallery._id)}
                      className="rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* --- END OF NEW TABLE --- */}
        
      </div>
    </>
  );
}

// --- 6. UPDATE getServerSideProps ---
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

  // --- Fetch Articles ---
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
    return article;
  });

  // --- Fetch Galleries ---
  const galleryResult = await Gallery.find({}).sort({ publishedDate: -1 });
  const galleries = galleryResult.map((doc) => {
    const gallery = doc.toObject();
    gallery._id = gallery._id.toString();
    gallery.createdAt = gallery.createdAt.toString();
    gallery.updatedAt = gallery.updatedAt.toString();
    gallery.publishedDate = gallery.publishedDate.toString();
    // We only need the image count, not the full array
    gallery.images = gallery.images.length; 
    return gallery;
  });

  // 4. Pass data to the page
  return {
    props: {
      articles: articles,
      galleries: galleries, // Add galleries to props
    },
  };
}