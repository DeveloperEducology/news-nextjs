import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminPage({ articles }) {
  const router = useRouter();

  // This function is called when the "Delete" button is clicked
  const handleDelete = async (slug) => {
    // Show a confirmation dialog
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // If successful, refresh the page to update the table
        // router.reload() works, but this is a "softer" refresh
        router.push(router.asPath); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  };

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {/* "Create" button */}
          <Link href="/create-article" legacyBehavior>
            <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
              + Create New Article
            </a>
          </Link>
        </div>

        {/* --- Articles Table --- */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
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
              {articles.map((article) => (
                <tr key={article._id}>
                  <td className="px-6 py-4">
                    <div className="w-96 overflow-hidden truncate font-medium text-gray-900" title={article.title}>
                      {article.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(article.createdAt), "dd MMM, yyyy")}
                  </td>
                  <td className="flex items-center gap-2 px-6 py-4 text-right text-sm font-medium">
                    {/* "Edit" button */}
                    <Link href={`/admin/edit/${article.slug}`} legacyBehavior>
                      <a className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200">
                        Edit
                      </a>
                    </Link>
                    {/* "Delete" button */}
                    <button
                      onClick={() => handleDelete(article.slug)}
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
      </div>
    </>
  );
}

// This function runs on the server and ensures:
// 1. The user is an admin
// 2. The latest articles are fetched
export async function getServerSideProps(context) {
  const session = await getSession(context);

  // 1. Check if user is logged in and is an admin
  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // 2. If admin, fetch all articles
  await dbConnect();
  const result = await Article.find({}).sort({ createdAt: -1 });

  // 3. Serialize the data
  const articles = result.map((doc) => {
    const article = doc.toObject();
    
    // --- THIS IS THE FIX ---
    article._id = article._id.toString();

    // Safely handle 'createdAt' or 'publishedDate'
    if (article.publishedDate) {
      article.createdAt = article.publishedDate.toString();
    } else if (article.createdAt) {
      article.createdAt = article.createdAt.toString();
    } else {
      // Fallback: If no date, use today's date
      article.createdAt = new Date().toString();
    }

    // Safely handle 'updatedAt'
    if (article.updatedAt) {
      article.updatedAt = article.updatedAt.toString();
    }
    
    // Clean up original date object if it exists
    delete article.publishedDate; 
    // --- END OF FIX ---

    return article;
  });

  // 4. Pass data to the page
  return {
    props: {
      articles: articles,
    },
  };
}