import { getSession } from "next-auth/react";
import { useState } from 'react';
import { useRouter } from 'next/router';
import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import imageCompression from 'browser-image-compression';
import dynamic from 'next/dynamic';

// 1. USE THE NEWER 'react-quill-new'
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css'; // Make sure this is in _app.js or here

// Helper: Formats a Date object into 'YYYY-MM-DDTHH:MM'
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper: Creates a URL-friendly slug
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// --- 2. THIS IS THE NEW "FULL" TOOLBAR ---
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
    matchVisual: false, // Helps paste clean text
  },
};
// --- END OF NEW TOOLBAR ---

export default function CreateArticle({ categories }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: '',
    category: '',
    newCategory: '',
    summary: '',
    featuredImage: '',
    featuredVideo: '',
    liveContent: '', // <-- ADD THIS
  isFullArticle: false, // <-- ADD THIS
    content: '',
    tags: '',
    publishedDate: formatDateForInput(new Date()),
    status: 'published',
  });
  
  // ... (All your other state variables are correct) ...
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [modalTarget, setModalTarget] = useState(null); 

  // This is your manual slug + slugify handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      if (value === '__NEW__') {
        setShowNewCategory(true);
        setFormData((prev) => ({ ...prev, category: '' }));
      } else {
        setShowNewCategory(false);
        setFormData((prev) => ({ ...prev, category: value, newCategory: '' }));
      }
      return;
    }
    setFormData((prev) => {
      if (name === 'title') {
        return { ...prev, title: value };
      }
      if (name === 'slug') {
        return { ...prev, slug: slugify(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  // Handler for the Rich Text Editor
  const handleContentChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }));
  };

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
  const handleParseJson = () => {
    setError('');
    if (!jsonInput) return;
    try {
      const parsedData = JSON.parse(jsonInput);
      const tagsString = (parsedData.tags && Array.isArray(parsedData.tags)) ? parsedData.tags.join(', ') : '';
      setFormData({
        title: parsedData.title || '',
        slug: parsedData.slug || slugify(parsedData.title || ''), 
        author: parsedData.author || '',
        category: parsedData.category || '',
        newCategory: '',
        summary: parsedData.summary || '',
        featuredImage: parsedData.featuredImage || '',
        featuredVideo: parsedData.featuredVideo || '',
        content: parsedData.content || '',
        tags: tagsString,
        publishedDate: formatDateForInput(parsedData.publishedDate || new Date()),
        status: parsedData.status || 'published',
      });
      setShowNewCategory(false);
      setJsonInput('');
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const finalCategory = showNewCategory ? formData.newCategory : formData.category;
    if (!finalCategory) {
      setError('Please select or add a category.');
      setIsSubmitting(false);
      return;
    }
    const tagsArray = formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    const dataToSend = {
      ...formData,
      tags: tagsArray,
      category: finalCategory,
      publishedDate: new Date(formData.publishedDate),
    };
    delete dataToSend.newCategory;
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        alert('Article created successfully!');
        // --- THIS IS THE NEW PART ---
        // Tell Google to index this new URL
        // We don't 'await' this; just send it.
        fetch('/api/request-indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPath: `/article/${dataToSend.slug}`,
            type: 'URL_UPDATED'
          })
        });
        // --- END OF NEW PART ---
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create article.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };
  // ---

  const formInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
  const formTextareaClasses = `${formInputClasses} font-mono`;

  return (
    <>
      <SeoHead title="Create New Article" />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Create a New Article</h1>

        {/* --- JSON PARSER --- */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Quick Add via JSON</h2>
          <textarea
            rows="5"
            className={formTextareaClasses}
            placeholder='{ "title": "My Title", "content": "...", "summary": "...", ... }'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            type="button"
            onClick={handleParseJson}
            className="mt-4 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Parse and Fill Form
          </button>
        </div>
        
        {/* --- MAIN FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Main Content</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" required className={formInputClasses} value={formData.title} onChange={handleChange} />
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (must be unique)</label>
              <input type="text" name="slug" id="slug" required className={formInputClasses} value={formData.slug} onChange={handleChange} />
            </div>
            <div className="rounded-md bg-blue-50 p-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isFullArticle"
          className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
          checked={formData.isFullArticle}
          onChange={(e) => setFormData(prev => ({ ...prev, isFullArticle: e.target.checked }))}
        />
        <span className="font-medium text-blue-800">
          Publish as Full Article (Show on Homepage Grid)
        </span>
      </label>
      <p className="text-sm text-blue-700 mt-2">
        Leave this unchecked to post as a "Live Update" only. Check it when the full article is ready to be featured.
      </p>
    </div>

    {/* --- NEW 'liveContent' Field --- */}
    <div>
      <label htmlFor="liveContent" className="block text-sm font-medium text-gray-700">
        Live Update Content
      </label>
      <p className="text-xs text-gray-500">
        A short, quick update. This will show on the Live Feed page. You can use basic HTML.
      </p>
      <textarea 
        name="liveContent" 
        id="liveContent" 
        rows="4" 
        className={formTextareaClasses} 
        value={formData.liveContent} 
        onChange={handleChange} 
      />
    </div>

            {/* --- RICH TEXT EDITOR --- */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
              <div className="mt-1 bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules} // Use the new "full" toolbar
                  className="[&_.ql-editor]:min-h-[300px]"
                />
              </div>
            </div>
            {/* --- END OF EDITOR --- */}
            
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
                    name="featuredImage"
                    id="featuredImage"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    onChange={handleImageChange}
                  />
                  <button type="button" onClick={() => setModalTarget('image')} className="flex-shrink-0 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">Select</button>
                </div>
                {isUploadingImage && <p className="mt-2 text-sm text-gray-500">Uploading Image...</p>}
                {formData.featuredImage && (
                  <input type="text" readOnly value={formData.featuredImage} className={`${formInputClasses} mt-2 bg-gray-100 text-sm`} />
                )}
              </div>
              {/* Featured Video */}
              <div>
                <label htmlFor="featuredVideo" className="block text-sm font-medium text-gray-700">Featured Video</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="file"
                    name="featuredVideo"
                    id="featuredVideo"
                    accept="video/mp4, video/quicktime"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                    onChange={handleVideoChange}
                  />
                  <button type="button" onClick={() => setModalTarget('video')} className="flex-shrink-0 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">Select</button>
                </div>
                {isUploadingVideo && <p className="mt-2 text-sm text-gray-500">Uploading Video...</p>}
                {formData.featuredVideo && (
                  <input type="text" readOnly value={formData.featuredVideo} className={`${formInputClasses} mt-2 bg-gray-100 text-sm`} />
                )}
              </div>
            </div>
             <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
              <input type="text" name="author" id="author" required className={formInputClasses} value={formData.author} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" id="category" className={formInputClasses} value={showNewCategory ? '__NEW__' : formData.category} onChange={handleChange}>
                <option value="" disabled>-- Select a category --</option>
                {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                <option value="__NEW__">-- Add New Category --</option>
              </select>
            </div>
            {showNewCategory && (
              <div>
                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700">New Category Name</label>
                <input type="text" name="newCategory" id="newCategory" className={formInputClasses} value={formData.newCategory} onChange={handleChange} />
              </div>
            )}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input type="text" name="tags" id="tags" placeholder="e.g., technology, google, ai" className={formInputClasses} value={formData.tags} onChange={handleChange} />
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
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage || isUploadingVideo}
              className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? "Creating..." : (isUploadingImage ? "Uploading Image..." : (isUploadingVideo ? "Uploading Video..." : "Create Article"))}
            </button>
          </div>
        </form>
      </div>
      
      <MediaLibraryModal
        isOpen={!!modalTarget}
        onClose={() => setModalTarget(null)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}

// getServerSideProps (Unchanged)
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
  const categories = await Article.distinct("category");
  const sortedCategories = categories.filter((cat) => cat).sort();

  return {
    props: {
      session,
      categories: sortedCategories,
    },
  };
}