import { useEffect, useState } from "react";

type Rating = "PG" | "X";
type Status = "draft" | "published" | "archived";

type Gallery = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  rating?: Rating;
  status?: Status;
  image_count?: number;
};

type Image = {
  id: number;
  title?: string | null;
  alt_text?: string | null;
  src: string;
  thumb?: string | null;
  prompt?: string | null;
  parameters?: string | null;
  checkpoint?: string | null;
  loras?: string[];
};

function withBase(p?: string | null) {
  if (!p) return p || undefined;
  if (/^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith("data:")) return p;
  // Don't modify paths that start with /api/ - they should be absolute from domain root
  if (p.startsWith("/api/")) return p;
  const base = import.meta.env.BASE_URL || "/";
  const clean = p.replace(/^\/+/, "");
  const encoded = clean.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  return base.replace(/\/+$/, "") + "/" + encoded;
}

export default function GalleryManager() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Gallery form state
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    slug: "",
    description: "",
    rating: "PG" as Rating,
    status: "draft" as Status
  });

  // Image upload state
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPrompts, setUploadPrompts] = useState<{
    positive: string;
    negative: string;
    checkpoint: string;
    loras: string;
    extractMetadata: boolean;
  }>({
    positive: "",
    negative: "",
    checkpoint: "",
    loras: "",
    extractMetadata: true
  });

  // Image editing state
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [imagePrompts, setImagePrompts] = useState<{
    positive: string;
    negative: string;
    checkpoint: string;
    loras: string[];
  }>({
    positive: "",
    negative: "",
    checkpoint: "",
    loras: []
  });

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/galleries/list.php?include_unpublished=1', {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load galleries');
      const data = await response.json();
      setGalleries(data.galleries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (galleryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/images/gallery-list.php?gallery_id=${galleryId}&limit=100`, {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load images');
      const data = await response.json();
      setImages(data.images || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingGallery ? '/api/galleries/update.php' : '/api/galleries/create.php';
      const payload = editingGallery 
        ? { id: editingGallery.id, ...galleryForm }
        : galleryForm;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save gallery';
        try {
          const text = await response.text();
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || text || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch {
          // If we can't read the response at all
        }
        throw new Error(`${response.status}: ${errorMessage}`);
      }

      setSuccess(editingGallery ? 'Gallery updated successfully!' : 'Gallery created successfully!');
      setShowGalleryForm(false);
      setEditingGallery(null);
      setGalleryForm({ title: "", slug: "", description: "", rating: "PG", status: "draft" as Status });
      await loadGalleries();
    } catch (err: any) {
      setError(err.message || 'Failed to save gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (gallery: Gallery) => {
    if (!confirm(`Are you sure you want to delete "${gallery.title}"? This will also delete all images in this gallery.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/galleries/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: gallery.id })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete gallery');
      }

      setSuccess('Gallery deleted successfully!');
      if (selectedGallery?.id === gallery.id) {
        setSelectedGallery(null);
        setImages([]);
      }
      await loadGalleries();
    } catch (err: any) {
      setError(err.message || 'Failed to delete gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (gallery: Gallery) => {
    setLoading(true);
    setError(null);
    try {
      const next = ((gallery as any).status === 'published') ? 'draft' : 'published';
      const response = await fetch('/api/galleries/update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: gallery.id, status: next })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update status');
      }
      setSuccess(next === 'published' ? 'Gallery published!' : 'Gallery unpublished!');
      await loadGalleries();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedGallery || !files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('gallery_id', selectedGallery.id.toString());
      
      // Add manual prompt data
      if (uploadPrompts.positive.trim()) {
        formData.append('positive_prompt', uploadPrompts.positive.trim());
      }
      if (uploadPrompts.negative.trim()) {
        formData.append('negative_prompt', uploadPrompts.negative.trim());
      }
      if (uploadPrompts.checkpoint.trim()) {
        formData.append('checkpoint', uploadPrompts.checkpoint.trim());
      }
      if (uploadPrompts.loras.trim()) {
        formData.append('loras', uploadPrompts.loras.trim());
      }
      
      // Add metadata extraction preference
      formData.append('extract_metadata', uploadPrompts.extractMetadata ? '1' : '0');
      
      Array.from(files).forEach(file => {
        formData.append('files[]', file);
      });

      const response = await fetch('/api/images/gallery-upload.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to upload images');
      }

      setSuccess('Images uploaded successfully!');
      setFiles(null);
      // Clear the upload prompts after successful upload
      setUploadPrompts({ positive: "", negative: "", checkpoint: "", loras: "", extractMetadata: true });
      await loadImages(selectedGallery.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };


  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/images/gallery-delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: imageId })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess('Image deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const startEditGallery = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setGalleryForm({
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description || "",
      rating: gallery.rating || "PG",
      status: (gallery as any).status || "draft"
    });
    setShowGalleryForm(true);
  };

  const startEditImage = (image: Image) => {
    setEditingImageId(image.id);
    setImageTitle(image.title || "");
    setImageAltText(image.alt_text || "");
    
    // Parse existing prompts - handle both separate prompt field and parameters field
    let positivePrompt = image.prompt || "";
    let negativePrompt = "";
    
    // Try to extract negative prompt from parameters if it exists
    if (image.parameters) {
      const negMatch = image.parameters.match(/Negative prompt:\s*(.+?)(?:\n|$)/i);
      if (negMatch) {
        negativePrompt = negMatch[1].trim();
      }
    }
    
    setImagePrompts({
      positive: positivePrompt,
      negative: negativePrompt,
      checkpoint: image.checkpoint || "",
      loras: image.loras || []
    });
  };


  // Extract filename from image src for display purposes
  const getImageDisplayName = (image: Image) => {
    if (image.title) return image.title;
    
    // Extract filename from src path
    const src = image.src || '';
    const filename = src.split('/').pop() || '';
    // Remove file extension for cleaner display
    return filename.replace(/\.[^/.]+$/, '') || 'Untitled';
  };

  // Generate URL-friendly slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Handle title change and auto-generate slug for new galleries
  const handleTitleChange = (title: string) => {
    setGalleryForm(prev => ({
      ...prev,
      title,
      // Only auto-generate slug for new galleries (not when editing)
      slug: !editingGallery ? generateSlug(title) : prev.slug
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gallery Manager</h2>
        <button
          onClick={() => {
            setShowGalleryForm(true);
            setEditingGallery(null);
            setGalleryForm({ title: "", slug: "", description: "", rating: "PG", status: "draft" as Status });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Gallery
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Gallery Form Modal */}
      {showGalleryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingGallery ? 'Edit Gallery' : 'Create Gallery'}
            </h3>
            <form onSubmit={handleGallerySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={galleryForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug {!editingGallery && <span className="text-xs text-gray-500">(auto-generated from title)</span>}
                </label>
                <input
                  type="text"
                  value={galleryForm.slug}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  placeholder={!editingGallery ? "Will be generated from title..." : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={galleryForm.description}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating
                </label>
                <select
                  value={galleryForm.rating}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, rating: e.target.value as Rating }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PG">PG</option>
                  <option value="X">X</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={galleryForm.status}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, status: e.target.value as Status }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (visible)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  New galleries default to Draft. Publish to make it visible on the site.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : editingGallery ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGalleryForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Edit Modal */}
      {editingImageId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Edit Image
              </h3>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      placeholder="Image title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alt Text (SEO)
                    </label>
                    <input
                      type="text"
                      value={imageAltText}
                      onChange={(e) => setImageAltText(e.target.value)}
                      placeholder="Alt text for accessibility"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Prompts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Positive Prompt
                  </label>
                  <textarea
                    value={imagePrompts.positive}
                    onChange={(e) => setImagePrompts(prev => ({ ...prev, positive: e.target.value }))}
                    placeholder="Enter positive prompt..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Negative Prompt
                  </label>
                  <textarea
                    value={imagePrompts.negative}
                    onChange={(e) => setImagePrompts(prev => ({ ...prev, negative: e.target.value }))}
                    placeholder="Enter negative prompt..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={4}
                  />
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Checkpoint
                    </label>
                    <input
                      type="text"
                      value={imagePrompts.checkpoint}
                      onChange={(e) => setImagePrompts(prev => ({ ...prev, checkpoint: e.target.value }))}
                      placeholder="e.g., sd_xl_base_1.0.safetensors"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LoRAs
                    </label>
                    <input
                      type="text"
                      value={imagePrompts.loras.join(', ')}
                      onChange={(e) => setImagePrompts(prev => ({ 
                        ...prev, 
                        loras: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                      }))}
                      placeholder="Comma-separated: lora1, lora2, lora3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const response = await fetch('/api/images/gallery-update.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ 
                          id: editingImageId, 
                          title: imageTitle.trim() || null,
                          alt_text: imageAltText.trim() || null,
                          prompt: imagePrompts.positive.trim() || null,
                          parameters: imagePrompts.negative.trim() ? `Negative prompt: ${imagePrompts.negative.trim()}` : null,
                          checkpoint: imagePrompts.checkpoint.trim() || null,
                          loras: imagePrompts.loras.length > 0 ? imagePrompts.loras : null
                        })
                      });

                      if (!response.ok) {
                        const text = await response.text();
                        throw new Error(text || 'Failed to update image');
                      }

                      // Update local state
                      setImages(prev => prev.map(img => 
                        img.id === editingImageId ? { 
                          ...img, 
                          title: imageTitle.trim() || null,
                          alt_text: imageAltText.trim() || null,
                          prompt: imagePrompts.positive.trim() || null,
                          parameters: imagePrompts.negative.trim() ? `Negative prompt: ${imagePrompts.negative.trim()}` : null,
                          checkpoint: imagePrompts.checkpoint.trim() || null,
                          loras: imagePrompts.loras.length > 0 ? imagePrompts.loras : []
                        } : img
                      ));
                      
                      setEditingImageId(null);
                      setSuccess('Image updated successfully!');
                    } catch (err: any) {
                      setError(err.message || 'Failed to update image');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingImageId(null)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Galleries List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Galleries</h3>
          {loading && !selectedGallery ? (
            <div className="text-center py-4">Loading galleries...</div>
          ) : galleries.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No galleries found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery) => (
                <div
                  key={gallery.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedGallery?.id === gallery.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => {
                    setSelectedGallery(gallery);
                    loadImages(gallery.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {gallery.title}
                      {(gallery as any).status && (gallery as any).status !== 'published' && (
                        <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs ${((gallery as any).status === 'draft') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>
                          {(gallery as any).status}
                        </span>
                      )}
                    </h4>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(gallery);
                        }}
                        className={`${(gallery as any).status === 'published' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} text-sm`}
                        title={(gallery as any).status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {(gallery as any).status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditGallery(gallery);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGallery(gallery);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Slug: {gallery.slug}
                  </p>
                  {gallery.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {gallery.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Rating: {gallery.rating || 'PG'}</span>
                    <span>{gallery.image_count || 0} images</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Management */}
      {selectedGallery && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Images in "{selectedGallery.title}"
            </h3>

            {/* Image Upload */}
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Upload Images</h4>
              
              {/* File Selection */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFiles(e.target.files)}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PNG, JPG, JPEG, WebP. Thumbnails generated automatically.
                </p>
              </div>

              {/* Manual Prompt Fields */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Positive Prompt (Optional)
                  </label>
                  <textarea
                    value={uploadPrompts.positive}
                    onChange={(e) => setUploadPrompts(prev => ({ ...prev, positive: e.target.value }))}
                    placeholder="Enter positive prompt for all uploaded images..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Negative Prompt (Optional)
                  </label>
                  <textarea
                    value={uploadPrompts.negative}
                    onChange={(e) => setUploadPrompts(prev => ({ ...prev, negative: e.target.value }))}
                    placeholder="Enter negative prompt for all uploaded images..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Checkpoint (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadPrompts.checkpoint}
                      onChange={(e) => setUploadPrompts(prev => ({ ...prev, checkpoint: e.target.value }))}
                      placeholder="e.g., sd_xl_base_1.0.safetensors"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LoRAs (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadPrompts.loras}
                      onChange={(e) => setUploadPrompts(prev => ({ ...prev, loras: e.target.value }))}
                      placeholder="Comma-separated: lora1, lora2, lora3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Metadata Extraction Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="extractMetadata"
                    checked={uploadPrompts.extractMetadata}
                    onChange={(e) => setUploadPrompts(prev => ({ ...prev, extractMetadata: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="extractMetadata" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Auto-extract metadata from images (when manual fields are empty)
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleImageUpload}
                  disabled={uploading || !files || files.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                
                {(uploadPrompts.positive || uploadPrompts.negative || uploadPrompts.checkpoint || uploadPrompts.loras) && (
                  <button
                    onClick={() => setUploadPrompts({ positive: "", negative: "", checkpoint: "", loras: "", extractMetadata: true })}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clear All Fields
                  </button>
                )}
              </div>
            </div>

            {/* Images Grid */}
            {loading && selectedGallery ? (
              <div className="text-center py-4">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No images in this gallery</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image) => (
                  <div key={image.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700">
                      <img
                        src={withBase(image.thumb) || withBase(image.src)}
                        alt={image.title || "Image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getImageDisplayName(image)}
                        </p>
                        {image.alt_text && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Alt:</span> {image.alt_text}
                          </p>
                        )}
                        {image.prompt && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Prompt:</span> {image.prompt.length > 50 ? image.prompt.substring(0, 50) + '...' : image.prompt}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditImage(image)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Metadata */}
                      {image.checkpoint && (
                        <p className="text-xs text-gray-500 mt-2">
                          <span className="font-medium">Checkpoint:</span> {image.checkpoint}
                        </p>
                      )}
                      {image.loras && image.loras.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-medium">LoRAs:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {image.loras.map((lora, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                              >
                                {lora}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
