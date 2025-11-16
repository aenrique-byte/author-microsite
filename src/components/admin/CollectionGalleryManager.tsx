import { useEffect, useMemo, useState } from "react";

type Rating = "PG" | "X";
type Status = "draft" | "published" | "archived";

type Collection = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  themes?: string[];
  status: Status;
  cover_hero?: string | null;
  sort_order?: number;
  gallery_count: number;
};

type Gallery = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  rating?: Rating;
  status?: Status;
  collection_id?: number | null;
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

export default function CollectionGalleryManager() {
  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [selectedCollectionKey, setSelectedCollectionKey] = useState<number | 'unassigned'>('unassigned');

  // Galleries
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
    status: "draft" as Status,
    collection_id: "" as number | "" // '' means unassigned
  });

  // Collection form state (inline editing/creation to retire separate admin/collections)
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionForm, setCollectionForm] = useState({
    title: "",
    slug: "",
    description: "",
    themesText: "",
    status: "published" as Status,
    cover_hero: "",
    sort_order: 0
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    loadGalleriesForSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollectionKey]);

  const selectedCollection = useMemo(
    () => (typeof selectedCollectionKey === "number" ? collections.find(c => c.id === selectedCollectionKey) || null : null),
    [selectedCollectionKey, collections]
  );

  async function loadCollections() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collections/list.php?limit=1000", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load collections");
      const data = await res.json();
      const list: Collection[] = (data.collections || []).map((c: any) => ({
        id: Number(c.id),
        slug: String(c.slug),
        title: String(c.title || "Untitled"),
        description: c.description || null,
        themes: Array.isArray(c.themes) ? c.themes : [],
        status: (c.status === "draft" || c.status === "archived") ? c.status : "published",
        cover_hero: c.cover_hero || null,
        sort_order: typeof c.sort_order === "number" ? c.sort_order : 0,
        gallery_count: Number(c.gallery_count || 0)
      }));
      setCollections(list);

      // Compute unassigned count from all galleries (admin view)
      const gres = await fetch("/api/galleries/list.php?include_unpublished=1&limit=10000", { credentials: "same-origin" });
      if (gres.ok) {
        const gj = await gres.json();
        const all: any[] = gj.galleries || [];
        setUnassignedCount(all.filter(g => g.collection_id == null).length);
      } else {
        setUnassignedCount(0);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }

  async function loadGalleriesForSelection() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/galleries/list.php?include_unpublished=1&limit=1000";
      if (typeof selectedCollectionKey === "number") {
        url += `&collection_id=${selectedCollectionKey}`;
      }
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load galleries");
      const data = await res.json();
      let list: Gallery[] = (data.galleries || []).map((g: any) => ({
        id: Number(g.id),
        slug: String(g.slug),
        title: String(g.title || "Untitled"),
        description: g.description || null,
        rating: (g.rating === "X" ? "X" : "PG"),
        status: (g.status === "published" || g.status === "archived") ? g.status : "draft",
        collection_id: g.collection_id == null ? null : Number(g.collection_id),
        image_count: Number(g.image_count || 0)
      }));
      if (selectedCollectionKey === "unassigned") {
        list = list.filter(g => g.collection_id == null);
      }
      setGalleries(list);
    } catch (e: any) {
      setError(e.message || "Failed to load galleries");
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  const generateSlug = (title: string) => {
    return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const handleCreateGalleryClick = () => {
    setEditingGallery(null);
    setGalleryForm({
      title: "",
      slug: "",
      description: "",
      rating: "PG",
      status: "draft",
      collection_id: typeof selectedCollectionKey === "number" ? selectedCollectionKey : ""
    });
    setShowGalleryForm(true);
  };

  const startEditGallery = (g: Gallery) => {
    setEditingGallery(g);
    setGalleryForm({
      title: g.title,
      slug: g.slug,
      description: g.description || "",
      rating: g.rating || "PG",
      status: g.status || "draft",
      collection_id: g.collection_id == null ? "" : g.collection_id
    });
    setShowGalleryForm(true);
  };

  const handleTogglePublish = async (g: Gallery) => {
    setLoading(true);
    setError(null);
    try {
      const next = (g.status === "published") ? "draft" : "published";
      const res = await fetch("/api/galleries/update.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: g.id, status: next })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status");
      }
      setSuccess(next === "published" ? "Gallery published!" : "Gallery unpublished!");
      await loadGalleriesForSelection();
    } catch (e: any) {
      setError(e.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (g: Gallery) => {
    if (!confirm(`Delete gallery "${g.title}"? This will delete all images within it.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/galleries/delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: g.id })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete gallery");
      }
      setSuccess("Gallery deleted.");
      if (selectedGallery?.id === g.id) {
        setSelectedGallery(null);
        setImages([]);
      }
      await loadGalleriesForSelection();
      await loadCollections();
    } catch (e: any) {
      setError(e.message || "Failed to delete gallery");
    } finally {
      setLoading(false);
    }
  };

  // Image management (upload/edit lightweight)
  const [files, setFiles] = useState<FileList | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
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

  // Image edit modal state (restores full edit functionality like the old manager)
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

  const handleImageUpload = async () => {
    if (!selectedGallery || !files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('gallery_id', selectedGallery.id.toString());
      
      if (uploadPrompts.positive.trim()) formData.append('positive_prompt', uploadPrompts.positive.trim());
      if (uploadPrompts.negative.trim()) formData.append('negative_prompt', uploadPrompts.negative.trim());
      if (uploadPrompts.checkpoint.trim()) formData.append('checkpoint', uploadPrompts.checkpoint.trim());
      if (uploadPrompts.loras.trim()) formData.append('loras', uploadPrompts.loras.trim());
      formData.append('extract_metadata', uploadPrompts.extractMetadata ? '1' : '0');
      
      Array.from(files).forEach(file => {
        formData.append('files[]', file);
      });
      if (posterFile) {
        formData.append('poster', posterFile);
      }

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
      setUploadPrompts({ positive: "", negative: "", checkpoint: "", loras: "", extractMetadata: true });
      await loadImages(selectedGallery.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
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

  // Start image edit with prompt/metadata fields
  const startEditImage = (image: Image) => {
    setEditingImageId(image.id);
    setImageTitle(image.title || "");
    setImageAltText(image.alt_text || "");

    let positivePrompt = image.prompt || "";
    let negativePrompt = "";

    // Try to extract negative prompt from parameters if present
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

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingGallery ? "/api/galleries/update.php" : "/api/galleries/create.php";
      const payloadBase = {
        title: galleryForm.title,
        slug: galleryForm.slug,
        description: galleryForm.description,
        rating: galleryForm.rating,
        status: galleryForm.status,
        collection_id: galleryForm.collection_id === "" ? null : galleryForm.collection_id
      };
      const payload = editingGallery ? { id: editingGallery.id, ...payloadBase } : payloadBase;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save gallery");
      }
      setSuccess(editingGallery ? "Gallery updated" : "Gallery created");
      setShowGalleryForm(false);
      setEditingGallery(null);
      await loadGalleriesForSelection();
      await loadCollections();
    } catch (e: any) {
      setError(e.message || "Failed to save gallery");
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = useMemo(() => collections.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || b.id - a.id), [collections]);

  // Collection helpers
  const startCreateCollection = () => {
    setEditingCollection(null);
    setCollectionForm({
      title: "",
      slug: "",
      description: "",
      themesText: "",
      status: "published",
      cover_hero: "",
      sort_order: 0
    });
    setShowCollectionForm(true);
  };

  const startEditCollection = () => {
    if (!selectedCollection) return;
    setEditingCollection(selectedCollection);
    setCollectionForm({
      title: selectedCollection.title || "",
      slug: selectedCollection.slug || "",
      description: selectedCollection.description || "",
      themesText: (selectedCollection.themes || []).join(", "),
      status: selectedCollection.status || "published",
      cover_hero: selectedCollection.cover_hero || "",
      sort_order: selectedCollection.sort_order || 0
    });
    setShowCollectionForm(true);
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    if (!confirm(`Delete collection "${selectedCollection.title}"? All assigned galleries will be unassigned.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collections/delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: selectedCollection.id, force: true })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete collection");
      }
      setSuccess("Collection deleted.");
      setSelectedCollectionKey('unassigned');
      await loadCollections();
      await loadGalleriesForSelection();
    } catch (e: any) {
      setError(e.message || "Failed to delete collection");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const themes = collectionForm.themesText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload: any = {
        title: collectionForm.title,
        slug: collectionForm.slug,
        description: collectionForm.description || null,
        themes,
        status: collectionForm.status,
        cover_hero: collectionForm.cover_hero || null,
        sort_order: Number(collectionForm.sort_order) || 0
      };

      const url = editingCollection ? "/api/collections/update.php" : "/api/collections/create.php";
      if (editingCollection) payload.id = editingCollection.id;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to save collection");
      }

      setSuccess(editingCollection ? "Collection updated" : "Collection created");
      setShowCollectionForm(false);
      setEditingCollection(null);
      await loadCollections();

      // If we edited current selection, keep it selected; if created new, try select it by slug
      if (!editingCollection) {
        // re-fetch selected by slug
        const newly = (await (await fetch(`/api/collections/list.php?slug=${encodeURIComponent(collectionForm.slug)}`, { credentials: "same-origin" })).json()).collections?.[0];
        if (newly?.id) {
          setSelectedCollectionKey(Number(newly.id));
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collections & Galleries</h2>
        <div className="flex gap-2">
          <button
            onClick={startCreateCollection}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Collection
          </button>
          <button
            onClick={handleCreateGalleryClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Gallery
          </button>
        </div>
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

      {/* Collections Row (with Unassigned) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Collections</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Unassigned card */}
            <button
              onClick={() => setSelectedCollectionKey('unassigned')}
              className={`border rounded-lg p-4 text-left transition-colors ${
                selectedCollectionKey === 'unassigned'
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Unassigned</h4>
                <span className="text-xs text-gray-600 dark:text-gray-300">{unassignedCount} galleries</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Galleries without a collection
              </p>
            </button>

            {filteredCollections.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCollectionKey(c.id)}
                className={`border rounded-lg p-4 text-left transition-colors ${
                  selectedCollectionKey === c.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">{c.title}</h4>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{c.gallery_count} galleries</span>
                </div>
                {c.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{c.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Galleries in selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedCollectionKey === 'unassigned'
                ? "Galleries — Unassigned"
                : selectedCollection
                ? `Galleries in “${selectedCollection.title}”`
                : "Galleries"}
            </h3>
            <div className="flex items-center gap-2">
              {selectedCollection && (
                <>
                  <button
                    onClick={startEditCollection}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Edit Collection
                  </button>
                  <button
                    onClick={handleDeleteCollection}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete Collection
                  </button>
                </>
              )}
              <button
                onClick={handleCreateGalleryClick}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                New Gallery
              </button>
            </div>
          </div>

          {loading && galleries.length === 0 ? (
            <div className="text-center py-4">Loading galleries...</div>
          ) : galleries.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No galleries found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {galleries.map((g) => (
                <div
                  key={g.id}
                  className={`border rounded-lg p-4 border-gray-200 dark:border-gray-600 cursor-pointer ${selectedGallery?.id === g.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => {
                    setSelectedGallery(g);
                    loadImages(g.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{g.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Slug: {g.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePublish(g)}
                        className={`${g.status === 'published' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} text-sm`}
                        title={g.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {g.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => startEditGallery(g)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGallery(g)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Rating: {g.rating || "PG"}</span>
                    <span>{g.image_count || 0} images</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Collection:{" "}
                    {g.collection_id == null ? (
                      <span className="italic">Unassigned</span>
                    ) : (
                      <span>
                        {collections.find(c => c.id === g.collection_id)?.title || `#${g.collection_id}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Management for selected gallery */}
      {selectedGallery && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Manage Images — “{selectedGallery.title}”
            </h3>

            {/* Upload */}
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Upload Images</h4>
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.mp4,.webm"
                  onChange={(e) => setFiles(e.target.files)}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PNG, JPG, JPEG, WebP. Thumbnails generated automatically.
                </p>
              </div>

              {/* Poster image (for videos) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poster Image (for videos)
                </label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => setPosterFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If you upload a video (.mp4/.webm), adding a poster image is recommended so the gallery grid has a thumbnail.
                </p>
              </div>

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

            {/* Images grid */}
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
                        src={image.thumb || image.src}
                        alt={image.title || "Image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {image.title || (image.src?.split('/').pop() || 'Untitled')}
                        </p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Positive Prompt (Danbooru tags)
                  </label>
                  <textarea
                    value={imagePrompts.positive}
                    onChange={(e) => setImagePrompts(prev => ({ ...prev, positive: e.target.value }))}
                    placeholder="person, profile, highres, solo, ..."
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
                    placeholder="bad anatomy, extra fingers, ..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={4}
                  />
                </div>

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
                      value={imagePrompts.loras.join(", ")}
                      onChange={(e) =>
                        setImagePrompts(prev => ({
                          ...prev,
                          loras: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }))
                      }
                      placeholder="Comma-separated: lora1, lora2, lora3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={async () => {
                    if (!editingImageId) return;
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

                      // Update local list
                      setImages(prev => prev.map(img =>
                        img.id === editingImageId
                          ? {
                              ...img,
                              title: imageTitle.trim() || null,
                              alt_text: imageAltText.trim() || null,
                              prompt: imagePrompts.positive.trim() || null,
                              parameters: imagePrompts.negative.trim() ? `Negative prompt: ${imagePrompts.negative.trim()}` : null,
                              checkpoint: imagePrompts.checkpoint.trim() || null,
                              loras: imagePrompts.loras.length > 0 ? imagePrompts.loras : []
                            }
                          : img
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

      {/* Gallery Form Modal */}
      {showGalleryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingGallery ? "Edit Gallery" : "Create Gallery"}
            </h3>
            <form onSubmit={handleGallerySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={galleryForm.title}
                  onChange={(e) =>
                    setGalleryForm(prev => ({
                      ...prev,
                      title: e.target.value,
                      slug: editingGallery ? prev.slug : generateSlug(e.target.value)
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug {!editingGallery && <span className="text-xs text-gray-500">(auto-generated)</span>}
                </label>
                <input
                  type="text"
                  value={galleryForm.slug}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection
                </label>
                <select
                  value={galleryForm.collection_id as any}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGalleryForm(prev => ({ ...prev, collection_id: v === "" ? "" : Number(v) }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editingGallery ? "Update" : "Create"}
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

      {/* Collection Form Modal */}
      {showCollectionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingCollection ? "Edit Collection" : "Create Collection"}
            </h3>
            <form onSubmit={handleCollectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={collectionForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCollectionForm(prev => ({
                      ...prev,
                      title,
                      slug: editingCollection ? prev.slug : generateSlug(title)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug {!editingCollection && <span className="text-xs text-gray-500">(auto-generated)</span>}
                </label>
                <input
                  type="text"
                  value={collectionForm.slug}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Themes (comma-separated)</label>
                <input
                  type="text"
                  value={collectionForm.themesText}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, themesText: e.target.value }))}
                  placeholder="Characters, Covers, Concepts"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={collectionForm.status}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, status: e.target.value as Status }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={collectionForm.sort_order}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Hero (URL)</label>
                <input
                  type="text"
                  value={collectionForm.cover_hero}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, cover_hero: e.target.value }))}
                  placeholder="/api/uploads/your-cover.webp"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editingCollection ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCollectionForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
