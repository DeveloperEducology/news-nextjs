import { useState } from 'react';
import { useRouter } from 'next/router';
import SeoHead from '../components/SeoHead';

// A simple utility to create a URL-friendly slug
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function CreateArticle() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: '',
    category: '',
    summary: '',
    featuredImage: '',
    content: '',
    tags: '', // Form expects a comma-separated string
  });
  
  // --- NEW STATE FOR THE JSON INPUT ---
  const [jsonInput, setJsonInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      // If changing the title, also update the slug
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

  // --- NEW HANDLER FOR PARSING THE JSON ---
  const handleParseJson = () => {
    setError('');
    if (!jsonInput) {
      setError('Please paste a JSON object first.');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonInput);
      
      // Auto-generate slug as a fallback
      const generatedSlug = slugify(parsedData.title || '');
      
      // Convert tags array (if it exists) to a comma-separated string
      const tagsString = (parsedData.tags && Array.isArray(parsedData.tags))
        ? parsedData.tags.join(', ')
        : '';

      // Set the form data from the parsed object
      setFormData({
        title: parsedData.title || '',
        slug: parsedData.slug || generatedSlug, // Use parsed slug, or fallback
        author: parsedData.author || '',
        category: parsedData.category || '',
        summary: parsedData.summary || '',
        featuredImage: parsedData.featuredImage || '',
        content: parsedData.content || '',
        tags: tagsString, // Use the converted tags string
      });
      
      // Clear the text area after success
      setJsonInput('');

    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Prepare data to send: convert tags string back to array
    const tagsArray = formData.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const dataToSend = {
      ...formData,
      tags: tagsArray,
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        alert('Article created successfully!');
        router.push('/');
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

        {/* --- NEW JSON PARSER SECTION --- */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Quick Add via JSON</h2>
          <p className="text-sm text-gray-600 mb-4">
            Paste a full article JSON object here to auto-fill the fields below.
            Fields like `_id` and `publishedDate` will be ignored.
          </p>
          <textarea
            rows="10"
            className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder='{ "title": "My Title", "content": "...", "summary": "...", ... }'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            type="button" // Important: not "submit"
            onClick={handleParseJson}
            className="mt-4 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Parse and Fill Form
          </button>
        </div>
        {/* --- END OF JSON PARSER SECTION --- */}

        
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

          {/* Slug (Read-only, auto-generated) */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug (auto-generated)
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              value={formData.slug}
            />
          </div>

          {/* Author & Category (in a grid) */}
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
            <p className="text-xs text-gray-500">
              Use HTML tags for formatting. (e.g., `&lt;p&gt;`, `&lt;h2&gt;`, `&lt;ul&gt;`)
            </p>
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
          
          {/* Error Message */}
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
              {isSubmitting ? 'Submitting...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}