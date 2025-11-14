import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import imageCompression from 'browser-image-compression';
import { X } from 'lucide-react';

// --- DYNAMICALLY IMPORT THE EDITOR ---
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Helper: Creates a URL-friendly slug
const slugify = (str) => {
  if (!str) return '';
  str = str.toLowerCase().trim();
  const teluguRegex = /[\u0C00-\u0C7F]/;
  if (teluguRegex.test(str)) {
    return str.replace(/\s+/g, '-').replace(/[^\u0C00-\u0C7F\w-]+/g, '');
  } else {
    return str.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  }
};

// Configure the editor's toolbar
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image', 'video', 'blockquote'],
    ['clean']
  ],
};

export default function QuickUpdateModal({ isOpen, onClose }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    featuredImage: '',
    liveContent: '',
  });
  
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const formInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
  const formTextareaClasses = `${formInputClasses} font-mono`;

  const resetForm = () => {
    setFormData({ title: '', slug: '', summary: '', featuredImage: '', liveContent: '' });
    setJsonInput('');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'title') {
        return { ...prev, title: value, slug: slugify(value) };
      }
      return { ...prev, [name]: value };
    });
  };
  
  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, liveContent: value }));
  };

  const handleParseJson = () => {
    setError('');
    if (!jsonInput) return;
    try {
      const parsedData = JSON.parse(jsonInput);
      setFormData(prev => ({
        ...prev,
        title: parsedData.title || prev.title,
        slug: parsedData.slug || slugify(parsedData.title || prev.title),
        liveContent: parsedData.liveContent || prev.liveContent,
        featuredImage: parsedData.featuredImage || prev.featuredImage,
        summary: parsedData.summary || prev.summary,
      }));
      setJsonInput('');
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1080, useWebWorker: true, fileType: "image/webp", initialQuality: 0.9 };
    try {
      const compressedFile = await imageCompression(file, options);
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
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const dataToSend = {
      ...formData,
      isFullArticle: false, // This makes it a "Live Update"
      status: 'published',
      category: 'Live', // Default category for live posts
      // Auto-generate summary if empty
      summary: formData.summary || formData.liveContent.substring(0, 150).replace(/<[^>]+>/g, ''),
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        alert('Live update posted!');
        
        // Ping Google Indexing API
        fetch('/api/request-indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlPath: '/live', type: 'URL_UPDATED' })
        });
        
        resetForm();
        onClose(); // Close the modal
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
  
  if (!isOpen) return null;

  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Post a Quick Update</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-2">
            
            {/* --- COLUMN 1: JSON PARSER --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Quick Parse</h3>
              <p className="text-sm text-gray-500">
                Paste a JSON object with `title`, `slug`, `liveContent`, or `featuredImage` to fill the form.
              </p>
              <div>
                <label htmlFor="jsonInput" className="block text-sm font-medium text-gray-700">
                  Paste JSON
                </label>
                <textarea
                  id="jsonInput"
                  rows="10"
                  className={formTextareaClasses}
                  placeholder='{ "title": "My Title", "liveContent": "...", "slug": "my-slug" }'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleParseJson}
                className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Parse and Fill Form
              </button>
            </div>

            {/* --- COLUMN 2: THE FORM --- */}
            <div className="space-y-4">
              <div>
                <label htmlFor="quickTitle" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" id="quickTitle" name="title" value={formData.title} onChange={handleChange} className={formInputClasses} required />
              </div>
              <div>
                <label htmlFor="quickSlug" className="block text-sm font-medium text-gray-700">Slug (auto-generated)</label>
                <input type="text" id="quickSlug" name="slug" value={formData.slug} readOnly className={`${formInputClasses} bg-gray-100`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Featured Image</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleImageChange}
                />
                {isUploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
                {formData.featuredImage && (
                  <input type="text" readOnly value={formData.featuredImage} className={`${formInputClasses} mt-2 bg-gray-100 text-sm`} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Live Content (You can paste Twitter/YouTube embeds)
                </label>
                <div className="mt-1 bg-white">
                  <ReactQuill
                    theme="snow"
                    value={formData.liveContent}
                    onChange={handleContentChange}
                    modules={quillModules}
                    className="[&_.ql-editor]:min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quickPostForm" // This ID would be on your <form> tag, but we can just use the handleSubmit
            onClick={handleSubmit} // Easiest way
            disabled={isSubmitting || isUploading}
            className="rounded-md border border-transparent bg-red-600 px-6 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Posting...' : 'Post Live'}
          </button>
        </div>
      </div>
    </div>
  );
}