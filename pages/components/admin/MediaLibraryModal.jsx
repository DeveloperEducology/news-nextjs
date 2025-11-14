import { useState, useEffect, useMemo } from 'react'; // <-- 1. Import useMemo
import Image from 'next/image';
import { X } from 'lucide-react';

export default function MediaLibraryModal({ isOpen, onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // <-- 2. Add search state

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSearchQuery(""); // Reset search when modal opens
      
      // Fetch all images from our new API
      fetch('/api/media-library')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setImages(data.data);
          }
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // --- 3. Create a filtered list of images ---
  const filteredImages = useMemo(() => {
    if (!searchQuery) {
      return images; // If search is empty, show all
    }
    return images.filter(image =>
      // Check if caption exists and includes the search query
      image.caption && image.caption.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]); // Re-filter when images or search query change
  // --- End of filter ---

  if (!isOpen) {
    return null;
  }

  const handleImageSelect = (imageUrl) => {
    onSelect(imageUrl); // Send the URL back to the form
    onClose(); // Close the modal
  };

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Select from Media Library</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-4">
          
          {/* --- 4. Add Search Bar --- */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by caption..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* --- End of Search Bar --- */}

          {/* Image Grid */}
          {isLoading ? (
            <p className="text-center text-gray-500">Loading media...</p>
          ) : (
            // --- 5. Map over 'filteredImages' instead of 'images' ---
            <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
              {filteredImages.length > 0 ? (
                filteredImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleImageSelect(img.imageUrl)}
                    className="group relative aspect-square overflow-hidden rounded-md border-2 border-transparent focus:border-blue-500 focus:outline-none"
                    title={img.caption} // Add title for hover
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.caption}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                      unoptimized={true}
                    />
                  </button>
                ))
              ) : (
                // Show a message if no images match the search
                <p className="col-span-full text-center text-gray-500">
                  No images found matching "{searchQuery}".
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}