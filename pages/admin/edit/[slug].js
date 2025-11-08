import { useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";

// A simple utility to create a URL-friendly slug
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// This is our main component
export default function EditArticlePage({ article }) {
  const router = useRouter();
  
  // Get the slug from the URL. We'll need this to make the API call.
  const { slug: currentSlug } = router.query;

  // Initialize the form state with the article data
  const [formData, setFormData] = useState({
    title: article.title,
    slug: article.slug,
    author: article.author,
    category: article.category,
    summary: article.summary,
    featuredImage: article.featuredImage,
    content: article.content,
    tags: article.tags.join(", "), // Convert tags array back to string
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      // If changing the title, also update the slug
      if (name === "title") {
        return {
          ...prev,
          title: value,
          slug: slugify(value),
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Prepare data to send: convert tags string back to array
    const tagsArray = formData.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const dataToSend = {
      ...formData,
      tags: tagsArray,
    };

    try {
      const res = await fetch(`/api/articles/${currentSlug}`, {
        method: 'PUT', // Use PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        alert('Article updated successfully!');
        // Redirect to the admin dashboard
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update article.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <SeoHead title={`Edit: ${article.title}`} />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Edit Article</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              required
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              value={formData.slug}
              onChange={handleChange}
            />
          </div>

          {/* Author & Category */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                Author
              </label>
              <input
                type="text"
                name="author"
                id="author"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.author}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                id="category"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.category}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {/* Featured Image URL */}
          <div>
            <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700">
              Featured Image URL
            </label>
            <input
              type="text"
              name="featuredImage"
              id="featuredImage"
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.featuredImage}
              onChange={handleChange}
            />
          </div>
          
          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              id="tags"
              placeholder="e.g., technology, google, ai"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>
          
          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            <textarea
              name="summary"
              id="summary"
              rows="3"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.summary}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Content (HTML) */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content (HTML)
            </label>
            <textarea
              name="content"
              id="content"
              rows="10"
              required
              className="mt-1 block w-full rounded-md border-gray-300 font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.content}
              onChange={handleChange}
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Updating...' : 'Update Article'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// This function runs on the server for every request
export async function getServerSideProps(context) {
  // 1. Check for admin session
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // 2. Get the slug from the URL
  const { slug } = context.params;

  // 3. Fetch the article data from the database
  await dbConnect();
  const result = await Article.findOne({ slug: slug });

  // 4. If no article, return 404
  if (!result) {
    return { notFound: true };
  }

  // 5. Serialize the article data (fix all date issues)
  const article = result.toObject();
  article._id = article._id.toString();

  // Safely handle dates
  if (article.createdAt) {
    article.createdAt = article.createdAt.toString();
  }
  if (article.updatedAt) {
    article.updatedAt = article.updatedAt.toString();
  }
  if (article.publishedDate) {
    article.publishedDate = article.publishedDate.toString();
  }
  // Convert tags array to string for the form (if it's not already)
  if (Array.isArray(article.tags)) {
    // This is fine, we'll handle it on the client
  } else {
    article.tags = []; // Ensure it's an array if it's missing
  }


  // 6. Pass the article as a prop to the page
  return {
    props: {
      article: article,
    },
  };
}