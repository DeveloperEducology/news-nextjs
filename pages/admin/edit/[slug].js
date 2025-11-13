import { useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import imageCompression from "browser-image-compression";
import dynamic from 'next/dynamic'; // <-- 1. IMPORT DYNAMIC
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";


// --- 2. DYNAMICALLY IMPORT THE EDITOR ---
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
// --- END ---

// Helper: Formats a Date object into 'YYYY-MM-DDTHH:MM'
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

// --- 3. CONFIGURE THE EDITOR'S TOOLBAR ---
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }, { 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  },
};
// --- END ---

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
    featuredVideo: article.featuredVideo || "",
    content: article.content || "", // This will be passed to ReactQuill
    tags: article?.tags || "",
    publishedDate: formatDateForInput(article.publishedDate || new Date()),
    status: article.status || "published",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [modalTarget, setModalTarget] = useState(null); // Added modal state

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
    // Handle manual slug input
    if (name === 'slug') {
      setFormData((prev) => ({ ...prev, slug: slugify(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // --- 4. ADD A NEW HANDLER FOR THE EDITOR ---
  const handleContentChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }));
  };
  // --- END ---

  // ... (All other handlers: handleImageChange, handleVideoChange, etc. are correct) ...
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError("");
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1080, useWebWorker: true, fileType: "image/webp", initialQuality: 0.9 };
    let compressedFile;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (compressionError) {
      setError(`Image compression failed: ${compressionError.message}`);
      setIsUploadingImage(false);
      return;
    }
    try {
      const res = await fetch("/api/s3-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, type: compressedFile.type }),
      });
      if (!res.ok) throw new Error("Failed to get pre-signed URL.");
      const { uploadUrl, imageUrl } = await res.json();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: compressedFile,
        headers: { "Content-Type": compressedFile.type },
      });
      if (!uploadRes.ok) throw new Error("Upload to S3 failed.");
      setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }
    setIsUploadingImage(false);
  };
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setError("");
    try {
      const res = await fetch("/api/s3-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, type: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get pre-signed URL.");
      const { uploadUrl, imageUrl } = await res.json();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Upload to S3 failed.");
      setFormData((prev) => ({ ...prev, featuredVideo: imageUrl }));
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }
    setIsUploadingVideo(false);
  };
  const handleMediaSelect = (imageUrl) => {
    if (modalTarget === 'image') {
      setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
    }
    if (modalTarget === 'video') {
      setFormData(prev => ({ ...prev, featuredVideo: imageUrl }));
    }
    setModalTarget(null);
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
  
  // --- 5. ADD STYLING CLASSES ---
  const formInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
  const formTextareaClasses = `${formInputClasses} font-mono`;

  return (
    <>
      <SeoHead title={`Edit: ${article.title}`} />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold">Edit Article</h1>
           <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
             View Live Article →
           </a>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Main Content</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" required className={formInputClasses} value={formData.title} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
              <input type="text" name="slug" id="slug" required className={formInputClasses} value={formData.slug} onChange={handleChange} />
              <p className="text-xs text-red-500 mt-1">Warning: Changing the slug will break existing links to this article.</p>
            </div>
            
            {/* --- 6. REPLACE TEXTAREA WITH EDITOR --- */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
              <div className="mt-1 bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  className="[&_.ql-editor]:min-h-[300px]"
                />
              </div>
            </div>
            {/* --- END OF REPLACEMENT --- */}

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Summary (Excerpt)</label>
              <textarea name="summary" id="summary" rows="3" required className={formInputClasses} value={formData.summary} onChange={handleChange} />
            </div>
          </section>

          {/* ... (Rest of the form is unchanged) ... */}
          <section className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Media & Metadata</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Featured Image */}
              <div>
                <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700">Featured Image</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    onChange={handleImageChange}
                  />
                  <button type="button" onClick={() => setModalTarget('image')} className="flex-shrink-0 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">Select</button>
                </div>
                {isUploadingImage && <p className="mt-2 text-sm text-gray-500">Uploading Image...</p>}
                <input type="text" name="featuredImage" readOnly className={`${formInputClasses} mt-2 bg-gray-50 text-sm`} value={formData.featuredImage} />
              </div>

              {/* Featured Video */}
              <div>
                <label htmlFor="featuredVideo" className="block text-sm font-medium text-gray-700">Featured Video</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="file"
                    accept="video/mp4, video/quicktime"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                    onChange={handleVideoChange}
                  />
                  <button type="button" onClick={() => setModalTarget('video')} className="flex-shrink-0 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">Select</button>
                </div>
                {isUploadingVideo && <p className="mt-2 text-sm text-gray-500">Uploading Video...</p>}
                <input type="text" name="featuredVideo" readOnly className={`${formInputClasses} mt-2 bg-gray-50 text-sm`} value={formData.featuredVideo} />
              </div>
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
              <input type="text" name="author" id="author" required className={formInputClasses} value={formData.author} onChange={handleChange} />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" id="category" className={formInputClasses} value={showNewCategory ? "__NEW__" : formData.category} onChange={handleChange}>
                <option value="" disabled>-- Select a category --</option>
                {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                <option value="__NEW__">-- Add New Category --</option>
              </select>
            </div>
            {showNewCategory && (
              <input type="text" name="newCategory" placeholder="Enter new category name" className={formInputClasses} value={formData.newCategory} onChange={handleChange} />
            )}

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input type="text" name="tags" id="tags" className={formInputClasses} value={formData.tags} onChange={handleChange} />
            </div>
          </section>

          <section className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Publishing</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" className={formInputClasses} value={formData.status} onChange={handleChange}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label htmlFor="publishedDate" className="block text-sm font-medium text-gray-700">Published Date & Time</label>
                <input type="datetime-local" name="publishedDate" id="publishedDate" className={formInputClasses} value={formData.publishedDate} onChange={handleChange} />
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
      
      {/* Add the Modal component */}
      <MediaLibraryModal
        isOpen={!!modalTarget}
        onClose={() => setModalTarget(null)}
        onSelect={handleMediaSelect}
      />
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
  
  // Make sure 'tags' is a string
  if (Array.isArray(article.tags)) {
      article.tags = article.tags.join(', ');
  }

  return {
    props: {
      article,
      categories: sortedCategories,
    },
  };
}