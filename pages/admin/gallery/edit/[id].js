import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSession } from "next-auth/react";
import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

// Helper: Slugify
const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function EditGalleryPage({ gallery }) {
  const router = useRouter();
  
  // 1. ADD 'content' TO THE INITIAL STATE
  const [formData, setFormData] = useState({
    title: gallery.title,
    slug: gallery.slug,
    summary: gallery.summary,
    content: gallery.content || '', // <-- ADDED
    featuredImage: gallery.featuredImage,
    status: gallery.status,
  });
  
  const [galleryImages, setGalleryImages] = useState(gallery.images);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // --- REUSABLE UPLOAD FUNCTION ---
  const uploadFileToS3 = async (file) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp', initialQuality: 0.9 };
    const compressedFile = await imageCompression(file, options);
    const res = await fetch("/api/s3-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, type: compressedFile.type }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, imageUrl } = await res.json();
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeaturedImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setStatusMsg("Uploading cover image...");
    try {
      const url = await uploadFileToS3(file);
      setFormData(prev => ({ ...prev, featuredImage: url }));
      setStatusMsg("Cover image updated!");
    } catch (err) { setStatusMsg(`Error: ${err.message}`); }
    setIsUploading(false);
  };

  const handleGalleryImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    setStatusMsg(`Uploading ${files.length} images...`);
    
    try {
      const uploadPromises = files.map(uploadFileToS3);
      const urls = await Promise.all(uploadPromises);
      // Create new image objects (caption is blank by default)
      const newImages = urls.map(url => ({ imageUrl: url, caption: '' }));
      // This appends the new images to the existing ones
      setGalleryImages(prev => [...prev, ...newImages]);
      setStatusMsg("Upload complete!");
    } catch (err) { setStatusMsg(`Batch upload error: ${err.message}`); }
    setIsUploading(false);
  };

  const removeImage = (indexToRemove) => {
    if (confirm('Are you sure you want to remove this image? This is permanent.')) {
      setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
       const res = await fetch(`/api/galleries/${gallery._id}`, {
         method: 'PUT', // Use PUT for update
         headers: { 'Content-Type': 'application/json' },
         // The ...formData spread will now automatically include 'content'
         body: JSON.stringify({ ...formData, images: galleryImages }),
       });
       if (res.ok) {
         alert("Gallery Updated!");
         router.push('/admin');
       } else {
         throw new Error("API Error: Failed to update gallery");
       }
    } catch(err) { setStatusMsg(err.message); }
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Photo Gallery</h1>
        <a href={`/gallery/${gallery.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          View Live Gallery →
        </a>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        <div className="grid md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Gallery Title</label>
                <input type="text" name="title" required className="w-full mt-1 border p-2 rounded" value={formData.title} onChange={handleChange} />
            </div>
             <div>
                <label className="block text-sm font-medium">Slug</label>
                <input type="text" name="slug" required className="w-full mt-1 border p-2 rounded" value={formData.slug} onChange={handleChange} />
            </div>
        </div>

         <div>
            <label className="block text-sm font-medium">Summary (SEO Description)</label>
            <textarea name="summary" rows="3" className="w-full mt-1 border p-2 rounded" value={formData.summary} onChange={handleChange} />
        </div>
        
        {/* --- 2. ADD THE CONTENT TEXTAREA --- */}
        <div>
            <label className="block text-sm font-medium">Content (HTML)</label>
            <textarea name="content" rows="10" className="w-full mt-1 border p-2 rounded font-mono" value={formData.content} onChange={handleChange} />
        </div>
        {/* --- END --- */}
        
         <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" id="status" className="mt-1 block w-full" value={formData.status} onChange={handleChange}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

        <div className="border-t pt-4">
             <label className="block text-sm font-medium mb-2">Cover Image</label>
             <input type="file" accept="image/*" onChange={handleFeaturedImage} disabled={isUploading} />
             {formData.featuredImage && (
                <Image src={formData.featuredImage} alt="Cover" width={200} height={100} className="mt-2 h-32 w-auto rounded object-cover" />
             )}
        </div>

         <div className="border-t pt-4">
             <label className="block text-sm font-medium mb-2">Gallery Images (Add More)</label>
             <input type="file" accept="image/*" multiple onChange={handleGalleryImages} disabled={isUploading} />
             
             <h3 className="text-lg font-medium mt-6 mb-2">Current Images ({galleryImages.length})</h3>
             <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                 {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                        <Image src={img.imageUrl} alt={img.caption || 'Gallery image'} width={150} height={150} className="h-24 w-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0 right-0 m-1 h-6 w-6 rounded-full bg-red-600 text-white text-lg font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                    </div>
                 ))}
             </div>
        </div>

        {statusMsg && <p className="font-medium text-blue-600">{statusMsg}</p>}

        <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? "Saving..." : "Update Gallery"}
        </button>
      </form>
    </div>
  );
}

// Fetch the specific gallery data for editing
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return { redirect: { destination: "/login", permanent: false } };
  }
  
  const { id } = context.params;
  
  await dbConnect();
  const result = await Gallery.findById(id);
  
  if (!result) {
    return { notFound: true };
  }

  // Serialize the main gallery doc
  const gallery = result.toObject();
  gallery._id = gallery._id.toString();
  gallery.createdAt = gallery.createdAt.toString();
  gallery.updatedAt = gallery.updatedAt.toString();
  gallery.publishedDate = gallery.publishedDate.toString();
  
  // Serialize the sub-documents in the 'images' array
  gallery.images = gallery.images.map(img => ({
      _id: img._id.toString(),
      imageUrl: img.imageUrl,
      caption: img.caption || null, // Ensure caption is not undefined
  }));
  
  // The 'content' field is just a string, so it serializes fine
  // We don't need to do anything special for it here.

  return { props: { gallery } };
}