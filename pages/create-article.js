import { getSession } from "next-auth/react";
import { useState } from 'react';
import { useRouter } from 'next/router';
import SeoHead from '../components/SeoHead';
import dbConnect from '../lib/mongodb';
import Article from '../models/Article';

// Helper: Formats a Date object into 'YYYY-MM-DDTHH:MM' for the input
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

// The component now receives 'categories' as a prop
export default function CreateArticle({ categories }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: '',
    category: '', // This will be the selected category
    newCategory: '', // For the 'Add New' text input
    summary: '',
    featuredImage: '',
    content: '',
    tags: '',
    publishedDate: formatDateForInput(new Date()), // Default to now
    status: 'published',
  });
  
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false); // State to toggle new category input
  const [isUploading, setIsUploading] = useState(false); // State for image upload

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special logic for category dropdown
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

// ... (inside your CreateArticle component) ...

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return; // No file selected
    }

    setIsUploading(true);
    setError("");

    try {
      // 1. Ask our API for a pre-signed URL
      const res = await fetch("/api/s3-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          type: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get pre-signed URL.");

      const { uploadUrl, imageUrl } = await res.json();

      // 2. Upload the file *directly* to S3
      // --- THIS IS THE FIX ---
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          // Now that the URL isn't signed with Content-Type,
          // we MUST provide it in the headers.
          "Content-Type": file.type 
        },
      });
      // --- END OF FIX ---

      if (!uploadRes.ok) throw new Error("Upload to S3 failed.");

      // 3. Success! Set the image URL in our form data
      setFormData((prev) => ({
        ...prev,
        featuredImage: imageUrl,
      }));
      
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }

    setIsUploading(false);
  };
  const handleParseJson = () => {
    setError('');
    if (!jsonInput) return;

    try {
      const parsedData = JSON.parse(jsonInput);
      const tagsString = (parsedData.tags && Array.isArray(parsedData.tags))
        ? parsedData.tags.join(', ')
        : '';

      setFormData({
        title: parsedData.title || '',
        slug: parsedData.slug || slugify(parsedData.title || ''),
        author: parsedData.author || '',
        category: parsedData.category || '',
        newCategory: '',
        summary: parsedData.summary || '',
        featuredImage: parsedData.featuredImage || '',
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

    const tagsArray = formData.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const dataToSend = {
      ...formData,
      tags: tagsArray,
      category: finalCategory,
      publishedDate: new Date(formData.publishedDate), // Convert string back to Date
    };
    
    // Remove temporary fields
    delete dataToSend.newCategory;

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        alert('Article created successfully!');
        router.push('/admin'); // Redirect to dashboard
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create article.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <SeoHead title="Create New Article" />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Create a New Article</h1>

        {/* --- JSON PARSER SECTION --- */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Quick Add via JSON</h2>
          <textarea
            rows="5"
            className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          
          {/* --- Main Content --- */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Main Content</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" required className="mt-1 block w-full" value={formData.title} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (auto-generated)</label>
              <input type="text" name="slug" id="slug" readOnly className="mt-1 block w-full bg-gray-100" value={formData.slug} />
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

          {/* --- Metadata --- */}
          <section className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Metadata</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
                <input type="text" name="author" id="author" required className="mt-1 block w-full" value={formData.author} onChange={handleChange} />
              </div>
              {/* --- Updated Featured Image Upload --- */}
              <div>
                <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700">
                  Featured Image
                </label>
                <input
                  type="file"
                  name="featuredImage"
                  id="featuredImage"
                  accept="image/png, image/jpeg, image/webp"
                  className="mt-1 block w-full text-sm text-gray-500
                             file:mr-4 file:rounded-md file:border-0
                             file:bg-blue-50 file:px-4
                             file:py-2 file:text-sm
                             file:font-semibold file:text-blue-700
                             hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
                
                {/* Show a loading spinner */}
                {isUploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}

                {/* Show the URL field once the upload is complete, or if parsed from JSON */}
                {formData.featuredImage && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500">Image URL</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.featuredImage}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                id="category"
                className="mt-1 block w-full"
                value={showNewCategory ? '__NEW__' : formData.category}
                onChange={handleChange}
              >
                <option value="" disabled>-- Select a category --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__NEW__">-- Add New Category --</option>
              </select>
            </div>
            {showNewCategory && (
              <div>
                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700">New Category Name</label>
                <input
                  type="text"
                  name="newCategory"
                  id="newCategory"
                  className="mt-1 block w-full"
                  value={formData.newCategory}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input type="text" name="tags" id="tags" placeholder="e.g., technology, google, ai" className="mt-1 block w-full" value={formData.tags} onChange={handleChange} />
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
                <input
                  type="datetime-local"
                  name="publishedDate"
                  id="publishedDate"
                  className="mt-1 block w-full"
                  value={formData.publishedDate}
                  onChange={handleChange}
                />
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
              disabled={isSubmitting || isUploading} // Disable if uploading image
              className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : (isUploading ? 'Uploading Image...' : 'Create Article')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// We now fetch the categories from the DB
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
  
  // Fetch unique categories from the database
  await dbConnect();
  const categories = await Article.distinct("category");
  // Filter out any null/empty categories
  const sortedCategories = categories.filter(cat => cat).sort();

  return {
    props: {
      session, // Pass session to the page
      categories: sortedCategories, // Pass the categories
    },
  };
}