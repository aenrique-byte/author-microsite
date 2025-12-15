/**
 * BlogImagePicker Component
 * 
 * Modal for selecting images from galleries for blog posts.
 * Supports filtering by dimensions, aspect ratio, and gallery.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Filter, ChevronLeft, ChevronRight, Image as ImageIcon, Check, Folder } from 'lucide-react';
import {
  listBlogImages,
  BlogPickerImage,
  BlogPickerGallery,
  BlogImagePickerParams,
} from '../../../utils/api-blog';

interface BlogImagePickerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Called when an image is selected */
  onSelect: (image: BlogPickerImage) => void;
  /** Optional filter configuration */
  filter?: {
    /** Minimum width in pixels */
    minWidth?: number;
    /** Minimum height in pixels */
    minHeight?: number;
    /** Aspect ratio filter */
    aspectRatio?: 'square' | 'landscape' | 'portrait';
    /** Only blog-assets gallery */
    blogAssetsOnly?: boolean;
  };
  /** Title for the modal */
  title?: string;
  /** Description of what the image is for */
  description?: string;
}

export default function BlogImagePicker({
  isOpen,
  onClose,
  onSelect,
  filter,
  title = 'Select Image',
  description,
}: BlogImagePickerProps) {
  // State
  const [images, setImages] = useState<BlogPickerImage[]>([]);
  const [galleries, setGalleries] = useState<BlogPickerGallery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [selectedGallery, setSelectedGallery] = useState<number | null>(null);
  const [aspectFilter, setAspectFilter] = useState<'square' | 'landscape' | 'portrait' | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Selected image preview
  const [previewImage, setPreviewImage] = useState<BlogPickerImage | null>(null);

  // Fetch images
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: BlogImagePickerParams = {
        page,
        limit: 24,
        q: search || undefined,
        gallery_id: selectedGallery || undefined,
        min_width: filter?.minWidth,
        min_height: filter?.minHeight,
        aspect_ratio: (aspectFilter || filter?.aspectRatio) || undefined,
        source: filter?.blogAssetsOnly ? 'blog-assets' : 'all',
      };
      
      const response = await listBlogImages(params);
      
      if (response.success) {
        setImages(response.images);
        setGalleries(response.galleries);
        setTotalPages(response.pages);
        setTotal(response.total);
      } else {
        setError(response.error || 'Failed to load images');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedGallery, aspectFilter, filter]);

  // Fetch on mount and when deps change
  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setPage(1);
      setSelectedGallery(null);
      setAspectFilter('');
      setPreviewImage(null);
      setShowFilters(false);
    }
  }, [isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      setPage(1);
      fetchImages();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);

  // Handle image selection
  const handleSelect = (image: BlogPickerImage) => {
    onSelect(image);
    onClose();
  };

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get aspect ratio label
  const getAspectLabel = (ratio: number | null) => {
    if (!ratio) return 'Unknown';
    if (ratio >= 0.95 && ratio <= 1.05) return 'Square';
    if (ratio > 1.05) return 'Landscape';
    return 'Portrait';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {title}
            </h2>
            {description && (
              <p className="text-sm text-neutral-400 mt-1">{description}</p>
            )}
            {(filter?.minWidth || filter?.minHeight || filter?.aspectRatio) && (
              <p className="text-xs text-emerald-400 mt-1">
                Required: 
                {filter.minWidth && ` Min ${filter.minWidth}px wide`}
                {filter.minHeight && ` Min ${filter.minHeight}px tall`}
                {filter.aspectRatio && ` ${filter.aspectRatio}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Gallery Filter */}
            <select
              value={selectedGallery ?? ''}
              onChange={(e) => {
                setSelectedGallery(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">All Galleries</option>
              {galleries.map((gallery) => (
                <option key={gallery.id} value={gallery.id}>
                  {gallery.title} ({gallery.image_count})
                </option>
              ))}
            </select>

            {/* Aspect Ratio Filter */}
            {!filter?.aspectRatio && (
              <select
                value={aspectFilter}
                onChange={(e) => {
                  setAspectFilter(e.target.value as typeof aspectFilter);
                  setPage(1);
                }}
                className="px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Any Aspect</option>
                <option value="square">Square</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            )}

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-emerald-600 text-white' : 'hover:bg-white/10 text-neutral-400'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Results count */}
          <div className="mt-2 text-sm text-neutral-500">
            {loading ? 'Loading...' : `${total} images found`}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Image Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <div className="text-center py-12 text-red-400">
                <p>{error}</p>
                <button
                  onClick={fetchImages}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-neutral-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images found</p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="mt-4 text-emerald-400 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`group relative aspect-square bg-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500 ${
                      previewImage?.id === image.id ? 'ring-2 ring-emerald-500' : ''
                    }`}
                    onClick={() => setPreviewImage(image)}
                    onDoubleClick={() => handleSelect(image)}
                  >
                    <img
                      src={image.thumbnail_path || image.original_path}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(image);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Select
                      </button>
                    </div>

                    {/* Dimensions badge */}
                    {image.width && image.height && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-xs text-white rounded">
                        {image.width}×{image.height}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Sidebar */}
          {previewImage && (
            <div className="w-80 border-l border-white/10 p-4 overflow-y-auto flex-shrink-0 bg-neutral-800/50">
              <div className="space-y-4">
                {/* Preview Image */}
                <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden">
                  <img
                    src={previewImage.original_path}
                    alt={previewImage.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Image Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-white truncate" title={previewImage.title}>
                    {previewImage.title}
                  </h3>
                  
                  <div className="text-sm text-neutral-400 space-y-1">
                    <p className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {previewImage.gallery_title}
                    </p>
                    
                    {previewImage.width && previewImage.height && (
                      <p>
                        <span className="text-neutral-500">Dimensions:</span>{' '}
                        {previewImage.width} × {previewImage.height}
                      </p>
                    )}
                    
                    {previewImage.aspect_ratio && (
                      <p>
                        <span className="text-neutral-500">Aspect:</span>{' '}
                        {getAspectLabel(previewImage.aspect_ratio)}
                      </p>
                    )}
                    
                    <p>
                      <span className="text-neutral-500">Size:</span>{' '}
                      {formatFileSize(previewImage.file_size)}
                    </p>
                  </div>

                  {/* AI Metadata */}
                  {previewImage.prompt && (
                    <details className="text-sm">
                      <summary className="text-neutral-500 cursor-pointer hover:text-neutral-300">
                        AI Generation Info
                      </summary>
                      <div className="mt-2 p-2 bg-neutral-900 rounded text-neutral-400 text-xs space-y-1">
                        {previewImage.prompt && (
                          <p>
                            <span className="text-neutral-500">Prompt:</span>{' '}
                            {previewImage.prompt.substring(0, 200)}
                            {previewImage.prompt.length > 200 && '...'}
                          </p>
                        )}
                        {previewImage.checkpoint && (
                          <p>
                            <span className="text-neutral-500">Model:</span>{' '}
                            {previewImage.checkpoint}
                          </p>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelect(previewImage)}
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Use This Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
