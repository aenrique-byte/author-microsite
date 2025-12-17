import { useState, useEffect } from 'react';
import { API_BASE } from '../../../lib/apiBase';

interface Gallery {
  id: number;
  title: string;
  slug: string;
}

interface GalleryImage {
  id: number;
  src: string;      // API returns 'src' for original path
  thumb: string;    // API returns 'thumb' for thumbnail
  title: string;
  prompt: string;   // description/prompt field
}

interface ImagePickerModalProps {
  onSelect: (imageUrl: string, altText: string) => void;
  onClose: () => void;
}

export function ImagePickerModal({ onSelect, onClose }: ImagePickerModalProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);

  // Load galleries on mount
  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        // include_unpublished=1 and credentials for admin access to all galleries
        const response = await fetch(`${API_BASE}/galleries/list.php?include_unpublished=1&limit=100`, {
          credentials: 'same-origin'
        });
        const data = await response.json();
        // API returns { galleries: [...] }
        const galleriesList = data.galleries || [];
        if (galleriesList.length > 0) {
          setGalleries(galleriesList);
          setSelectedGalleryId(galleriesList[0].id);
        }
      } catch (error) {
        console.error('Failed to load galleries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGalleries();
  }, []);

  // Load images when gallery changes
  useEffect(() => {
    if (!selectedGalleryId) {
      setImages([]);
      return;
    }

    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        // API requires gallery_id, not gallery_slug
        const response = await fetch(`${API_BASE}/images/gallery-list.php?gallery_id=${selectedGalleryId}`, {
          credentials: 'same-origin'
        });
        const data = await response.json();
        // API returns { images: [...] } directly
        setImages(data.images || []);
      } catch (error) {
        console.error('Failed to load images:', error);
        setImages([]);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [selectedGalleryId]);

  const handleImageSelect = (image: GalleryImage) => {
    // Use 'src' field which contains the original path
    const imagePath = image.src || image.thumb;
    // Path is already absolute from API (e.g., /api/uploads/filename.jpg)
    const imageUrl = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const altText = image.title || image.prompt || 'Image';
    onSelect(imageUrl, altText);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" 
      role="dialog" 
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-900 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading galleries...
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No galleries found. Create a gallery first in the admin panel.
          </div>
        ) : (
          <>
            {/* Gallery selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gallery
              </label>
              <select
                value={selectedGalleryId || ''}
                onChange={(e) => setSelectedGalleryId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {galleries.map((gallery) => (
                  <option key={gallery.id} value={gallery.id}>
                    {gallery.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Images grid */}
            {loadingImages ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading images...
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No images in this gallery.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={image.thumb?.startsWith('/') ? image.thumb : `/${image.thumb}`}
                      alt={image.title || 'Gallery image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                        Select
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
