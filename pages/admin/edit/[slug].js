import { useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import imageCompression from "browser-image-compression";

// Helper: Formats a Date object into 'YYYY-MM-DDTHH:MM' for the input
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function EditArticlePage({ article, categories }) {
  const router = useRouter();
  const { slug: currentSlug } = router.query;

  // Initialize state with existing article data
  const [formData, setFormData] = useState({
    title: article.title || "",
    slug: article.slug || "",
    author: article.author || "",
    category: article.category || "",
    newCategory: "",
    summary: article.summary || "",
    featuredImage: article.featuredImage || "",
    featuredVideo: article.featuredVideo || "", // Added video
    content: article.content || "",
    tags: article.tags ? article.tags.join(", ") : "",
    publishedDate: formatDateForInput(article.publishedDate || new Date()),
    status: article.status || "published",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  // Separate upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      if (value === "__NEW__") {
        setShowNewCategory(true);
        setFormData((prev) => ({ ...prev, category: "" }));
      } else {
        setShowNewCategory(false);
        setFormData((prev) => ({ ...prev, category: value, newCategory: "" }));
      }
      return;
    }
    // Note: We usually DON'T auto-update slug on edit to prevent breaking old links,
    // but you can enable it if you want by uncommenting the lines below.
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- IMAGE HANDLER (With Compression) ---
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError("");

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.9,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      const res = await fetch("/api/s3-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          type: compressedFile.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL.");
      const { uploadUrl, imageUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: compressedFile,
        headers: { "Content-Type": compressedFile.type },
      });

      if (!uploadRes.ok) throw new Error("Upload to S3 failed.");

      setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    }
    setIsUploadingImage(false);
  };

  // --- VIDEO HANDLER (No Compression) ---
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setError("");

    try {
      const res = await fetch("/api/s3-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          type: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL.");
      const { uploadUrl, imageUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload to S3 failed.");

      setFormData((prev) => ({ ...prev, featuredVideo: imageUrl }));
    } catch (err) {
      setError(`Video upload failed: ${err.message}`);
    }
    setIsUploadingVideo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const finalCategory = showNewCategory ? formData.newCategory : formData.category;
    if (!finalCategory) {
      setError("Please select or add a category.");
      setIsSubmitting(false);
      return;
    }

    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const dataToSend = {
      ...formData,
      tags: tagsArray,
      category: finalCategory,
      publishedDate: new Date(formData.publishedDate),
    };
    delete dataToSend.newCategory;

    try {
      // Use PUT for update
      const res = await fetch(`/api/articles/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        alert("Article updated successfully!");
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update article.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <SeoHead title={`Edit: ${article.title}`} />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold">Edit Article</h1>
           {/* Optional: View Article Link */}
           <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
             View Live Article →
           </a>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
          {/* --- Main Content --- */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Main Content</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" required className="mt-1 block w-full" value={formData.title} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
              <input type="text" name="slug" id="slug" required className="mt-1 block w-full bg-gray-100" value={formData.slug} onChange={handleChange} />
              <p className="text-xs text-red-500 mt-1">Warning: Changing the slug will break existing links to this article.</p>
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content (HTML)</label>
              <textarea name="content" id="content" rows="10" required className="mt-1 block w-full font-mono" value={formData.content} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Summary (Excerpt)</label>
              <textarea name="summary" id="summary" rows="3" required className="mt-1 block w-full" value={formData.summary} onChange={handleChange} />
            </div>
          </section>

          {/* --- Media & Metadata --- */}
          <section className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Media & Metadata</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Featured Image */}
              <div>
                <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700">Featured Image</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleImageChange}
                />
                {isUploadingImage && <p className="mt-2 text-sm text-gray-500">Uploading Image...</p>}
                <input type="text" name="featuredImage" readOnly className="mt-2 block w-full bg-gray-50 text-sm" value={formData.featuredImage} />
              </div>

              {/* Featured Video */}
              <div>
                <label htmlFor="featuredVideo" className="block text-sm font-medium text-gray-700">Featured Video</label>
                <input
                  type="file"
                  accept="video/mp4, video/quicktime"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                  onChange={handleVideoChange}
                />
                {isUploadingVideo && <p className="mt-2 text-sm text-gray-500">Uploading Video...</p>}
                <input type="text" name="featuredVideo" readOnly className="mt-2 block w-full bg-gray-50 text-sm" value={formData.featuredVideo} />
              </div>
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
              <input type="text" name="author" id="author" required className="mt-1 block w-full" value={formData.author} onChange={handleChange} />
            </div>
            
            {/* Categories Dropdown */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" id="category" className="mt-1 block w-full" value={showNewCategory ? "__NEW__" : formData.category} onChange={handleChange}>
                {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                <option value="__NEW__">-- Add New Category --</option>
              </select>
            </div>
            {showNewCategory && (
              <input type="text" name="newCategory" placeholder="Enter new category name" className="mt-2 block w-full" value={formData.newCategory} onChange={handleChange} />
            )}

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input type="text" name="tags" id="tags" className="mt-1 block w-full" value={formData.tags} onChange={handleChange} />
            </div>
          </section>

          {/* --- Publishing --- */}
          <section className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Publishing</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" className="mt-1 block w-full" value={formData.status} onChange={handleChange}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label htmlFor="publishedDate" className="block text-sm font-medium text-gray-700">Published Date & Time</label>
                <input type="datetime-local" name="publishedDate" id="publishedDate" className="mt-1 block w-full" value={formData.publishedDate} onChange={handleChange} />
              </div>
            </div>
          </section>
          
          {error && <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage || isUploadingVideo}
              className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Updating...' : (isUploadingImage || isUploadingVideo ? 'Uploading Media...' : 'Update Article')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// Server-side: Fetch article AND categories
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const { slug } = context.params;
  await dbConnect();

  // 1. Fetch Article
  const result = await Article.findOne({ slug: slug });
  if (!result) return { notFound: true };

  // 2. Fetch Categories
  const categoriesList = await Article.distinct("category");
  const sortedCategories = categoriesList.filter(c => c).sort();

  // 3. Serialize Article
  const article = result.toObject();
  article._id = article._id.toString();
  if (article.createdAt) article.createdAt = article.createdAt.toString();
  if (article.updatedAt) article.updatedAt = article.updatedAt.toString();
  if (article.publishedDate) article.publishedDate = article.publishedDate.toString();

  return {
    props: {
      article,
      categories: sortedCategories,
    },
  };
}