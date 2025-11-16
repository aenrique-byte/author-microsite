import { useEffect, useState } from "react";

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

export default function CollectionManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({
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

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collections/list.php?limit=1000", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load collections");
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (e: any) {
      setError(e.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      themesText: "",
      status: "published",
      cover_hero: "",
      sort_order: 0
    });
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (c: Collection) => {
    setEditing(c);
    setForm({
      title: c.title || "",
      slug: c.slug || "",
      description: c.description || "",
      themesText: (c.themes || []).join(", "),
      status: (c.status as Status) || "published",
      cover_hero: c.cover_hero || "",
      sort_order: c.sort_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (c: Collection) => {
    if (!confirm(`Delete collection "${c.title}"?${c.gallery_count > 0 ? `\n\nNote: ${c.gallery_count} galleries are assigned and will be unassigned.` : ""}`)) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/collections/delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: c.id, force: true })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete collection");
      }
      setSuccess("Collection deleted.");
      await loadCollections();
    } catch (e: any) {
      setError(e.message || "Failed to delete collection");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitle = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editing ? prev.slug : generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const themes = form.themesText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload: any = {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        themes,
        status: form.status,
        cover_hero: form.cover_hero || null,
        sort_order: Number(form.sort_order) || 0
      };

      const url = editing ? "/api/collections/update.php" : "/api/collections/create.php";
      if (editing) payload.id = editing.id;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save collection");
      }
      setSuccess(editing ? "Collection updated" : "Collection created");
      setShowForm(false);
      setEditing(null);
      resetForm();
      await loadCollections();
    } catch (e: any) {
      setError(e.message || "Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collection Manager</h2>
        <button
          onClick={startCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Collection
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editing ? "Edit Collection" : "Create Collection"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug {!editing && (<span className="text-xs text-gray-500">(auto-generated)</span>)}
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Themes (comma-separated)</label>
                <input
                  type="text"
                  value={form.themesText}
                  onChange={(e) => setForm(prev => ({ ...prev, themesText: e.target.value }))}
                  placeholder="Characters, Covers, Concepts"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as Status }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    value={form.sort_order}
                    onChange={(e) => setForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Hero (URL)</label>
                <input
                  type="text"
                  value={form.cover_hero}
                  onChange={(e) => setForm(prev => ({ ...prev, cover_hero: e.target.value }))}
                  placeholder="/api/uploads/your-cover.webp"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Collections</h3>
          {loading && collections.length === 0 ? (
            <div className="text-center py-4">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No collections found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <div key={c.id} className="border rounded-lg p-4 border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {c.title}
                      {c.status !== "published" && (
                        <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs ${c.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-800"}`}>
                          {c.status}
                        </span>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={() => startEdit(c)}>Edit</button>
                      <button className="text-red-600 hover:text-red-800 text-sm" onClick={() => handleDelete(c)}>Delete</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Slug: {c.slug}</p>
                  {c.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{c.gallery_count} galleries</span>
                    {Array.isArray(c.themes) && c.themes.length > 0 && (
                      <span title={c.themes.join(", ")} className="truncate max-w-[60%]">
                        {c.themes.slice(0, 3).join(", ")}{c.themes.length > 3 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
