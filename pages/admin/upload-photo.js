import { getSession } from "next-auth/react";
import { useState } from 'react';
import SeoHead from '@/components/SeoHead';
import imageCompression from 'browser-image-compression';

export default function UploadPhoto() {
  const [formData, setFormData] = useState({
    category: 'General',
  });
  const [files, setFiles] = useState(null); // Will hold an array of files
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(e.target.files); // Store the FileList object
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // This is the new parallel upload function
  const uploadFile = async (file) => {
    // 1. Compress Image
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.9,
    };
    
    let compressedFile;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (compressionError) {
      throw new Error(`Compression failed for ${file.name}: ${compressionError.message}`);
    }

    // 2. Get S3 pre-signed URL
    const s3Res = await fetch("/api/s3-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        type: compressedFile.type,
      }),
    });
    if (!s3Res.ok) throw new Error(`Failed to get URL for ${file.name}.`);
    
    const { uploadUrl, imageUrl } = await s3Res.json();

    // 3. Upload to S3
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: compressedFile,
      headers: { "Content-Type": compressedFile.type },
    });
    if (!uploadRes.ok) throw new Error(`S3 upload failed for ${file.name}.`);

    // 4. Return the data to save to MongoDB
    return {
      imageUrl: imageUrl,
      caption: formData.caption || file.name.split('.').slice(0, -1).join('.'), // Use caption or filename
      category: formData.category,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError('Please select one or more files.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    // Create an array of upload promises
    const uploadPromises = [];
    for (let i = 0; i < files.length; i++) {
      uploadPromises.push(uploadFile(files[i]));
    }

    try {
      // Run all uploads in parallel
      const uploadedPhotosData = await Promise.all(uploadPromises);

      // Now, save all of them to our MongoDB
      const dbRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the entire array of photo data
        body: JSON.stringify(uploadedPhotosData),
      });

      if (!dbRes.ok) {
         const err = await dbRes.json();
         throw new Error(err.error || "Failed to save photos to database.");
      }

      setSuccess(`${uploadedPhotosData.length} photos uploaded successfully!`);
      setFormData({ caption: '', category: 'General' });
      setFiles(null);
      e.target.reset(); // Clear the file input
      
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }
    setIsUploading(false);
  };

  return (
    <>
      <SeoHead title="Upload Photos" />
      <div className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Upload to Gallery (Batch)</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Select Images (Auto-compresses to WebP)
            </label>
            <input
              type="file"
              name="file"
              id="file"
              required
              accept="image/png, image/jpeg"
              multiple // <-- THIS IS THE KEY CHANGE
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
          </div>
          
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
              Caption (Optional)
            </label>
            <p className="text-xs text-gray-500">If blank, the filename will be used for each photo.</p>
            <input
              type="text"
              name="caption"
              id="caption"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={formData.caption}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category / Album
            </label>
            <input
              type="text"
              name="category"
              id="category"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={formData.category}
              onChange={handleChange}
            />
          </div>

          {error && <p className="text-sm font-medium text-red-800">{error}</p>}
          {success && <p className="text-sm font-medium text-green-800">{success}</p>}

          <div>
            <button
              type="submit"
              disabled={isUploading}
              className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isUploading ? `Uploading ${files?.length || 0} photos...` : 'Upload Photos'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// Protect the page
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
  return { props: { session } };
}