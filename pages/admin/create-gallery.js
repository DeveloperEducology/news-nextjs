import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSession } from "next-auth/react";
import SeoHead from '@/components/SeoHead';
import imageCompression from 'browser-image-compression';

// Helper to create slugs
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function CreateGallery() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    featuredImage: '',
  });
  const [galleryImages, setGalleryImages] = useState([]); // Array of { imageUrl, caption }
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // --- REUSABLE UPLOAD FUNCTION ---
  const uploadFileToS3 = async (file) => {
    // 1. Compress
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp', initialQuality: 0.9 };
    const compressedFile = await imageCompression(file, options);

    // 2. Get URL
    const res = await fetch("/api/s3-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, type: compressedFile.type }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, imageUrl } = await res.json();

    // 3. Upload
    await fetch(uploadUrl, {
      method: "PUT",
      body: compressedFile,
      headers: { "Content-Type": compressedFile.type },
    });

    return imageUrl;
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'title') return { ...prev, title: value, slug: slugify(value) };
      return { ...prev, [name]: value };
    });
  };

  const handleFeaturedImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setStatusMsg("Uploading cover image...");
    try {
      const url = await uploadFileToS3(file);
      setFormData(prev => ({ ...prev, featuredImage: url }));
      setStatusMsg("");
    } catch (err) { setStatusMsg(`Error: ${err.message}`); }
    setIsUploading(false);
  };

  const handleGalleryImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    setStatusMsg(`Uploading ${files.length} images... please wait.`);
    
    try {
      // Upload all in parallel
      const urls = await Promise.all(files.map(uploadFileToS3));
      // Add to our gallery state with empty captions
      const newImages = urls.map(url => ({ imageUrl: url, caption: '' }));
      setGalleryImages(prev => [...prev, ...newImages]);
      setStatusMsg("Upload complete!");
    } catch (err) { setStatusMsg(`Batch upload error: ${err.message}`); }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.featuredImage || galleryImages.length === 0) {
        setStatusMsg("Please upload a cover image AND at least one gallery image.");
        return;
    }
    setIsSubmitting(true);
    
    try {
       const res = await fetch('/api/galleries', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...formData, images: galleryImages }),
       });
       if (res.ok) {
         alert("Gallery Created!");
         router.push('/gallery');
       } else {
         throw new Error("API Error");
       }
    } catch(err) { setStatusMsg("Failed to create gallery."); }
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Photo Gallery</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        {/* Title & Slug */}
        <div className="grid md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Gallery Title</label>
                <input type="text" name="title" required className="w-full mt-1 border p-2 rounded" value={formData.title} onChange={handleChange} />
            </div>
             <div>
                <label className="block text-sm font-medium">Slug (Auto)</label>
                <input type="text" name="slug" readOnly className="w-full mt-1 border p-2 rounded bg-gray-100" value={formData.slug} />
            </div>
        </div>

        {/* Summary */}
         <div>
            <label className="block text-sm font-medium">Summary (SEO Description)</label>
            <textarea name="summary" rows="3" className="w-full mt-1 border p-2 rounded" value={formData.summary} onChange={handleChange} />
        </div>

        {/* Featured Image */}
        <div className="border-t pt-4">
             <label className="block text-sm font-medium mb-2">Cover Image (Required)</label>
             <input type="file" accept="image/*" onChange={handleFeaturedImage} disabled={isUploading} />
             {formData.featuredImage && <img src={formData.featuredImage} alt="Cover" className="mt-2 h-32 w-auto rounded" />}
        </div>

        {/* Gallery Images */}
         <div className="border-t pt-4">
             <label className="block text-sm font-medium mb-2">Gallery Images (Select Multiple)</label>
             <input type="file" accept="image/*" multiple onChange={handleGalleryImages} disabled={isUploading} />
             
             {/* Preview Grid */}
             <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                 {galleryImages.map((img, idx) => (
                     <img key={idx} src={img.imageUrl} className="h-20 w-full object-cover rounded" />
                 ))}
             </div>
        </div>

        {statusMsg && <p className="font-medium text-blue-600">{statusMsg}</p>}

        <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? "Creating..." : "Publish Gallery"}
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}