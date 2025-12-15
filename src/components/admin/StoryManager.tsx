import { useEffect, useState } from "react";

type Story = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  homepage_description?: string | null;
  tagline?: string | null;
  genres?: string[] | null;
  primary_keywords?: string | null;
  longtail_keywords?: string | null;
  target_audience?: string | null;
  cover_image?: string | null;
  break_image?: string | null;
  enable_drop_cap?: boolean;
  drop_cap_font?: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  chapter_count?: number;
  external_links?: { label: string; url: string }[] | null;
  latest_chapter_number?: number | null;
  latest_chapter_title?: string | null;
  cta_text?: string | null;
  show_on_homepage?: boolean;
};

type Chapter = {
  id: number;
  story_id: number;
  title: string;
  slug: string;
  content: string;
  soundtrack_url?: string | null;
  chapter_number: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
};

export default function StoryManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Story form state
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyForm, setStoryForm] = useState({
    title: "",
    slug: "",
    description: "",
    homepage_description: "",
    tagline: "",
    genres: [] as string[],
    primary_keywords: "",
    longtail_keywords: "",
    target_audience: "",
    cover_image: "",
    break_image: "",
    enable_drop_cap: false,
    drop_cap_font: "serif",
    status: "draft" as Story['status'],
    external_links: [] as { label: string; url: string }[],
    latest_chapter_number: null as number | null,
    latest_chapter_title: "",
    cta_text: "",
    show_on_homepage: true
  });

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBreak, setUploadingBreak] = useState(false);
  
  // Page break selection states
  const [availablePageBreaks, setAvailablePageBreaks] = useState<any[]>([]);
  const [showPageBreakSelector, setShowPageBreakSelector] = useState(false);
  const [pageBreakMode, setPageBreakMode] = useState<'upload' | 'select'>('upload');

  // Helper function to generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Upload image function
  const uploadImage = async (file: File, type: 'cover' | 'break') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type === 'cover' ? 'cover' : 'pagebreak');

    const response = await fetch('/api/images/upload.php', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadImage(file, 'cover');
      setStoryForm(prev => ({ ...prev, cover_image: url }));
      setSuccess('Cover image uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleBreakUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBreak(true);
    setError(null);
    try {
      const url = await uploadImage(file, 'break');
      setStoryForm(prev => ({ ...prev, break_image: url }));
      setSuccess('Page break image uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload page break image');
    } finally {
      setUploadingBreak(false);
    }
  };

  // Load available page break images
  const loadAvailablePageBreaks = async () => {
    try {
      const response = await fetch('/api/images/list-pagebreaks.php', {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load page breaks');
      const data = await response.json();
      setAvailablePageBreaks(data.images || []);
    } catch (err: any) {
      console.error('Failed to load page breaks:', err);
      setAvailablePageBreaks([]);
    }
  };

  // Select an existing page break image
  const selectPageBreak = (imageUrl: string) => {
    setStoryForm(prev => ({ ...prev, break_image: imageUrl }));
    setShowPageBreakSelector(false);
    setSuccess('Page break image selected!');
  };

  // Chapter form state
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: "",
    slug: "",
    content: "",
    soundtrack_url: "",
    chapter_number: 1,
    status: "draft" as Chapter['status']
  });

  // Bulk upload state
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState<any>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stories/list.php', {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load stories');
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (storyId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chapters/list.php?story_id=${storyId}&limit=1000`, {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load chapters');
      const data = await response.json();
      setChapters(data.chapters || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingStory ? '/api/stories/update.php' : '/api/stories/create.php';
      const payload = editingStory 
        ? { id: editingStory.id, ...storyForm }
        : storyForm;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save story');
      }

      setSuccess(editingStory ? 'Story updated successfully!' : 'Story created successfully!');
      setShowStoryForm(false);
      setEditingStory(null);
      setStoryForm({
        title: "",
        slug: "",
        description: "",
        homepage_description: "",
        tagline: "",
        genres: [],
        primary_keywords: "",
        longtail_keywords: "",
        target_audience: "",
        cover_image: "",
        break_image: "",
        enable_drop_cap: false,
        drop_cap_font: "serif",
        status: "draft",
        external_links: [],
        latest_chapter_number: null,
        latest_chapter_title: "",
        cta_text: "",
        show_on_homepage: true
      });
      await loadStories();
    } catch (err: any) {
      setError(err.message || 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingChapter ? '/api/chapters/update.php' : '/api/chapters/create.php';
      const payload = editingChapter 
        ? { id: editingChapter.id, ...chapterForm }
        : { ...chapterForm, story_id: selectedStory.id };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save chapter');
      }

      setSuccess(editingChapter ? 'Chapter updated successfully!' : 'Chapter created successfully!');
      setShowChapterForm(false);
      setEditingChapter(null);
      setChapterForm({ title: "", slug: "", content: "", soundtrack_url: "", chapter_number: 1, status: "draft" });
      await loadChapters(selectedStory.id);
    } catch (err: any) {
      setError(err.message || 'Failed to save chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (story: Story) => {
    if (!confirm(`Are you sure you want to delete "${story.title}"? This will also delete all chapters in this story.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stories/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: story.id })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete story');
      }

      setSuccess('Story deleted successfully!');
      if (selectedStory?.id === story.id) {
        setSelectedStory(null);
        setChapters([]);
      }
      await loadStories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete story');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/chapters/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: chapterId })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete chapter');
      }

      setSuccess('Chapter deleted successfully!');
      if (selectedStory) {
        await loadChapters(selectedStory.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete chapter');
    } finally {
      setLoading(false);
    }
  };

  // Helper: count chapters not yet published
  const countNonPublishedChapters = (chs: Chapter[]) =>
    chs.filter(c => c.status !== 'published').length;

  // Publish all non-published chapters in the selected story
  const handlePublishAll = async () => {
    if (!selectedStory) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Dry run to show count
      const dryRes = await fetch('/api/chapters/bulk-publish.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ story_id: selectedStory.id, dry_run: true })
      });
      const dry = await dryRes.json().catch(() => ({} as any));
      const wouldAffect = typeof dry?.would_affect === 'number' ? dry.would_affect : 0;

      if (wouldAffect <= 0) {
        setSuccess('No drafts to publish for this story.');
        return;
      }

      const ok = confirm(`Publish ${wouldAffect} chapter(s) for "${selectedStory.title}"?`);
      if (!ok) return;

      // Commit
      const res = await fetch('/api/chapters/bulk-publish.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ story_id: selectedStory.id })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to publish chapters');
      }
      const data = await res.json().catch(() => ({} as any));
      const affected = typeof data?.affected === 'number' ? data.affected : wouldAffect;

      setSuccess(`Published ${affected} chapter(s).`);
      await loadChapters(selectedStory.id);
      await loadStories();
    } catch (err: any) {
      setError(err.message || 'Failed to publish chapters');
    } finally {
      setLoading(false);
    }
  };

  const startEditStory = (story: Story) => {
    setEditingStory(story);
    setStoryForm({
      title: story.title,
      slug: story.slug,
      description: story.description || "",
      homepage_description: story.homepage_description || "",
      tagline: story.tagline || "",
      genres: story.genres || [],
      primary_keywords: story.primary_keywords || "",
      longtail_keywords: story.longtail_keywords || "",
      target_audience: story.target_audience || "",
      cover_image: story.cover_image || "",
      break_image: story.break_image || "",
      enable_drop_cap: story.enable_drop_cap || false,
      drop_cap_font: story.drop_cap_font || "serif",
      status: story.status,
      external_links: story.external_links || [],
      latest_chapter_number: story.latest_chapter_number || null,
      latest_chapter_title: story.latest_chapter_title || "",
      cta_text: story.cta_text || "",
      show_on_homepage: story.show_on_homepage !== false
    });
    setPageBreakMode('upload');
    loadAvailablePageBreaks();
    setShowStoryForm(true);
  };

  const startEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      slug: chapter.slug,
      content: chapter.content,
      soundtrack_url: chapter.soundtrack_url || "",
      chapter_number: chapter.chapter_number,
      status: chapter.status
    });
    setShowChapterForm(true);
  };

  const getNextChapterNumber = () => {
    if (chapters.length === 0) return 1;
    return Math.max(...chapters.map(c => c.chapter_number)) + 1;
  };

  // Bulk upload handler
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedStory) return;

    setBulkUploading(true);
    setError(null);
    setBulkUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('story_id', selectedStory.id.toString());
      
      for (let i = 0; i < files.length; i++) {
        formData.append('markdown_files[]', files[i]);
      }

      const response = await fetch('/api/chapters/bulk-upload.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to upload chapters');
      }

      const result = await response.json();
      setBulkUploadResults(result);
      
      if (result.success) {
        setSuccess(`Successfully uploaded ${result.uploaded_count} chapters!`);
        await loadChapters(selectedStory.id);
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some files had errors: ${result.errors.join(', ')}`);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to upload chapters');
    } finally {
      setBulkUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Story Manager</h2>
        <button
          onClick={() => {
            setShowStoryForm(true);
            setEditingStory(null);
            setStoryForm({
              title: "",
              slug: "",
              description: "",
              homepage_description: "",
              tagline: "",
              genres: [],
              primary_keywords: "",
              longtail_keywords: "",
              target_audience: "",
              cover_image: "",
              break_image: "",
              enable_drop_cap: false,
              drop_cap_font: "serif",
              status: "draft",
              external_links: [],
              latest_chapter_number: null,
              latest_chapter_title: "",
              cta_text: "",
              show_on_homepage: true
            });
            setPageBreakMode('upload');
            loadAvailablePageBreaks();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Story
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

      {/* Story Form Modal */}
      {showStoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingStory ? 'Edit Story' : 'Create Story'}
            </h3>
            <form onSubmit={handleStorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={storyForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setStoryForm(prev => ({ 
                      ...prev, 
                      title,
                      slug: !editingStory ? generateSlug(title) : prev.slug // Auto-generate slug only for new stories
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug (auto-generated)
                </label>
                <input
                  type="text"
                  value={storyForm.slug}
                  onChange={(e) => setStoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-600"
                  required
                  placeholder="Will be auto-generated from title"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URLs: /story/{storyForm.slug || 'your-story-slug'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Full - for story pages)
                </label>
                <textarea
                  value={storyForm.description}
                  onChange={(e) => setStoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  rows={4}
                  placeholder="Full description with markdown and color tags..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports markdown with color tags. Used on story detail pages.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Homepage Description (Short - plain text)
                </label>
                <textarea
                  value={storyForm.homepage_description}
                  onChange={(e) => setStoryForm(prev => ({ ...prev, homepage_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="A simplified, plain text description for the homepage..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plain text only. This will appear on homepage cards and featured story section.
                </p>
              </div>

              {/* Homepage Display Settings */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Homepage Display</h4>

                <div className="space-y-4">
                  {/* Show on Homepage Toggle */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storyForm.show_on_homepage}
                        onChange={(e) => setStoryForm(prev => ({ ...prev, show_on_homepage: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Show on Homepage
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          When enabled, this story will appear in the "Explore the universes" grid on the homepage
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={storyForm.tagline}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="A short, catchy tagline for the story"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Short tagline shown below the title on the homepage
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Call-to-Action Text
                    </label>
                    <input
                      type="text"
                      value={storyForm.cta_text}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, cta_text: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Start Reading"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Button text (default: "Start Reading")
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latest Chapter Number
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={storyForm.latest_chapter_number ?? ""}
                        onChange={(e) => setStoryForm(prev => ({
                          ...prev,
                          latest_chapter_number: e.target.value ? parseInt(e.target.value) : null
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="42"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current chapter number on external platforms
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latest Chapter Title
                      </label>
                      <input
                        type="text"
                        value={storyForm.latest_chapter_title}
                        onChange={(e) => setStoryForm(prev => ({ ...prev, latest_chapter_title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="The Final Battle"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Title of the latest chapter
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Fields */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">SEO & Marketing</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Genres
                    </label>
                    
                    {/* Selected Genres Display */}
                    {storyForm.genres.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Selected Genres:</p>
                        <div className="flex flex-wrap gap-2">
                          {storyForm.genres.map((genre, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {genre}
                              <button
                                type="button"
                                onClick={() => {
                                  const newGenres = storyForm.genres.filter((_, i) => i !== index);
                                  setStoryForm(prev => ({ ...prev, genres: newGenres }));
                                }}
                                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Genre Selection Grid */}
                    <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      {/* Sci-Fi Genres */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Sci-Fi</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Science Fiction', 'Space Opera', 'Cyberpunk', 'Dystopian', 'Post-Apocalyptic', 'Time Travel', 'Alternate History', 'Hard Science Fiction', 'Soft Science Fiction', 'Military Sci-Fi'].map((genre) => (
                            <label key={genre} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={storyForm.genres.includes(genre)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStoryForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                  } else {
                                    setStoryForm(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Fantasy/Magic Genres */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Fantasy/Magic</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['High Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Epic Fantasy', 'Sword and Sorcery', 'Magical Realism', 'Paranormal', 'Supernatural', 'Mythology', 'Fairy Tale Retelling'].map((genre) => (
                            <label key={genre} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={storyForm.genres.includes(genre)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStoryForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                  } else {
                                    setStoryForm(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Web Fiction Genres */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Web Fiction</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['LitRPG', 'GameLit', 'Progression Fantasy', 'Cultivation', 'System Apocalypse', 'Portal Fantasy', 'Isekai', 'Virtual Reality', 'Artificial Intelligence', 'Genetic Engineering'].map((genre) => (
                            <label key={genre} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={storyForm.genres.includes(genre)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStoryForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                  } else {
                                    setStoryForm(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Erotica/Adult Genres */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Erotica/Adult</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Erotica', 'Romance', 'Erotic Romance', 'BDSM', 'Harem', 'Reverse Harem', 'Adult Fantasy', 'Adult Sci-Fi', 'Steamy Romance'].map((genre) => (
                            <label key={genre} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={storyForm.genres.includes(genre)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStoryForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                  } else {
                                    setStoryForm(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Story Elements/Themes */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Themes/Elements</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Adventure', 'Action', 'Drama', 'Comedy', 'Thriller', 'Mystery', 'Horror', 'Slice of Life', 'Coming of Age'].map((genre) => (
                            <label key={genre} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={storyForm.genres.includes(genre)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStoryForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                  } else {
                                    setStoryForm(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Select multiple genres that best describe your story
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Primary Keywords
                    </label>
                    <input
                      type="text"
                      value={storyForm.primary_keywords}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, primary_keywords: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="adventure story, online novel, web serial"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Main SEO keywords, comma-separated
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Long-tail Keywords
                    </label>
                    <textarea
                      value={storyForm.longtail_keywords}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, longtail_keywords: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={2}
                      placeholder="free sci-fi story online, destiny among the stars web novel, AI generated sci-fi artwork, space colonization fiction"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Specific search phrases your target audience might use
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={storyForm.target_audience}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, target_audience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Readers, story enthusiasts, novel fans"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Describe your ideal readers for better targeting
                    </p>
                  </div>
                </div>
              </div>
              {/* External Links (platforms) */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">External Links (RoyalRoad, Patreon, etc.)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Add links to external platforms where this story is published (e.g., RoyalRoad, Patreon, Amazon, ScribbleHub). These will appear as clickable links on the homepage featured story section and the story pages.
                </p>
                <div className="space-y-2">
                  {(storyForm.external_links || []).map((link, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) =>
                          setStoryForm(prev => {
                            const arr = [...(prev.external_links || [])];
                            arr[idx] = { ...arr[idx], label: e.target.value };
                            return { ...prev, external_links: arr };
                          })
                        }
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Platform (e.g., Amazon)"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) =>
                            setStoryForm(prev => {
                              const arr = [...(prev.external_links || [])];
                              arr[idx] = { ...arr[idx], url: e.target.value };
                              return { ...prev, external_links: arr };
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="https://example.com/your-story"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setStoryForm(prev => ({
                              ...prev,
                              external_links: (prev.external_links || []).filter((_, i) => i !== idx)
                            }))
                          }
                          className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          title="Remove link"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setStoryForm(prev => ({
                        ...prev,
                        external_links: [...(prev.external_links || []), { label: "", url: "" }]
                      }))
                    }
                    className="mt-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    + Add Link
                  </button>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image
                </label>
                {storyForm.cover_image ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={storyForm.cover_image} 
                        alt="Cover preview" 
                        className="w-32 h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setStoryForm(prev => ({ ...prev, cover_image: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <label className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                        {uploadingCover ? 'Uploading...' : 'Change Cover'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                          disabled={uploadingCover}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
                          {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                            disabled={uploadingCover}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Page Break Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page Break Image (Optional)
                  </label>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setPageBreakMode('upload')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        pageBreakMode === 'upload'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Upload New
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageBreakMode('select')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        pageBreakMode === 'select'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Choose Existing
                    </button>
                  </div>
                </div>

                {storyForm.break_image ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={storyForm.break_image} 
                        alt="Page break preview" 
                        className="w-24 h-6 object-cover rounded border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setStoryForm(prev => ({ ...prev, break_image: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {pageBreakMode === 'upload' ? (
                        <label className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                          {uploadingBreak ? 'Uploading...' : 'Change Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBreakUpload}
                            className="hidden"
                            disabled={uploadingBreak}
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPageBreakSelector(true)}
                          className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Choose Different
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    {pageBreakMode === 'upload' ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <label className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer text-sm">
                            {uploadingBreak ? 'Uploading...' : 'Upload Page Break Image'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBreakUpload}
                              className="hidden"
                              disabled={uploadingBreak}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">Replaces --- in chapter content</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowPageBreakSelector(true)}
                          className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Choose from Existing Images
                        </button>
                        <p className="text-xs text-gray-500">Select from previously uploaded page break images</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drop Cap Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storyForm.enable_drop_cap}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, enable_drop_cap: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Drop Cap (Manuscript Style)
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  When enabled, the first letter of each chapter will be larger and top-aligned (traditional manuscript style)
                </p>

                {storyForm.enable_drop_cap && (
                  <div className="ml-6 mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Drop Cap Font Style
                    </label>
                    <select
                      value={storyForm.drop_cap_font}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, drop_cap_font: e.target.value }))}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="serif">Classic Serif (Default)</option>
                      <option value="cinzel">Cinzel (Elegant Roman)</option>
                      <option value="playfair">Playfair Display (High Contrast)</option>
                      <option value="cormorant">Cormorant (Delicate Serif)</option>
                      <option value="unna">Unna (Traditional)</option>
                      <option value="crimson">Crimson Pro (Editorial)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose a decorative font that matches your story's tone
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={storyForm.status}
                  onChange={(e) => setStoryForm(prev => ({ ...prev, status: e.target.value as Story['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : editingStory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStoryForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Form Modal */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingChapter ? 'Edit Chapter' : 'Create Chapter'}
            </h3>
            <form onSubmit={handleChapterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setChapterForm(prev => ({ 
                        ...prev, 
                        title,
                        slug: !editingChapter ? generateSlug(title) : prev.slug // Auto-generate slug only for new chapters
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={chapterForm.slug}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-600"
                    required
                    placeholder="Will be auto-generated from title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chapter Number
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, chapter_number: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use 0 for prologue or special chapters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={chapterForm.status}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, status: e.target.value as Chapter['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Soundtrack Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Soundtrack (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter MP3 URL (e.g., /api/uploads/general/soundtrack.mp3)"
                  value={chapterForm.soundtrack_url}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, soundtrack_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to an MP3 file from the uploads (go to Uploads → General to upload MP3 files)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content (Markdown)
                </label>
                
                {/* File Upload Option */}
                <div className="mb-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Markdown File (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".md,.markdown,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setChapterForm(prev => ({ ...prev, content }));
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a .md file to automatically populate the content below
                  </p>
                </div>

                <textarea
                  value={chapterForm.content}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  rows={15}
                  placeholder="Write your chapter content in Markdown format or upload a .md file above..."
                  required
                />
                <div className="mt-2 text-xs text-gray-500">
                  <strong>Markdown Tips:</strong> Use # for headers, **bold**, *italic*, `code`, [links](url), and &gt; for quotes
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Create Chapter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChapterForm(false)}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stories</h3>
          {loading && !selectedStory ? (
            <div className="text-center py-4">Loading stories...</div>
          ) : stories.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No stories found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedStory?.id === story.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => {
                    setSelectedStory(story);
                    loadChapters(story.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{story.title}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditStory(story);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(story);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Slug: {story.slug}
                  </p>
                  {story.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {story.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${
                      story.status === 'published' ? 'bg-green-100 text-green-800' :
                      story.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {story.status}
                    </span>
                    <span>{story.chapter_count || 0} chapters</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chapter Management */}
      {selectedStory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chapters in "{selectedStory.title}"
              </h3>
              <div className="flex gap-3">
                <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                  {bulkUploading ? 'Uploading...' : 'Bulk Upload'}
                  <input
                    type="file"
                    multiple
                    accept=".md,.markdown,.txt"
                    onChange={handleBulkUpload}
                    className="hidden"
                    disabled={bulkUploading}
                  />
                </label>
                <button
                  onClick={handlePublishAll}
                  className={`bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors ${countNonPublishedChapters(chapters) === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading || countNonPublishedChapters(chapters) === 0}
                  title={countNonPublishedChapters(chapters) === 0 ? 'No drafts to publish' : 'Publish all non-published chapters'}
                >
                  Publish All{countNonPublishedChapters(chapters) > 0 ? ` (${countNonPublishedChapters(chapters)})` : ''}
                </button>
                <button
                  onClick={() => {
                    setShowChapterForm(true);
                    setEditingChapter(null);
                    setChapterForm({
                      title: "",
                      slug: "",
                      content: "",
                      soundtrack_url: "",
                      chapter_number: getNextChapterNumber(),
                      status: "draft"
                    });
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Chapter
                </button>
              </div>
            </div>

            {/* Bulk Upload Results */}
            {bulkUploadResults && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Bulk Upload Results
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                  Successfully uploaded {bulkUploadResults.uploaded_count} chapters
                </p>
                {bulkUploadResults.chapters && bulkUploadResults.chapters.length > 0 && (
                  <div className="space-y-1">
                    {bulkUploadResults.chapters.map((chapter: any, index: number) => (
                      <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
                        • {chapter.filename} → Chapter {chapter.chapter_number}: {chapter.title}
                      </div>
                    ))}
                  </div>
                )}
                {bulkUploadResults.errors && bulkUploadResults.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Errors:</p>
                    {bulkUploadResults.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-600 dark:text-red-400">
                        • {error}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setBulkUploadResults(null)}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading && selectedStory ? (
              <div className="text-center py-4">Loading chapters...</div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No chapters in this story</div>
            ) : (
              <div className="space-y-3">
                {chapters.sort((a, b) => a.chapter_number - b.chapter_number).map((chapter) => (
                  <div key={chapter.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Chapter {chapter.chapter_number}
                          </span>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {chapter.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            chapter.status === 'published' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {chapter.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Slug: {chapter.slug}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {chapter.content.substring(0, 200)}...
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEditChapter(chapter)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Break Selector Modal */}
      {showPageBreakSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Choose Page Break Image
              </h3>
              <button
                onClick={() => setShowPageBreakSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {availablePageBreaks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No page break images found.</p>
                <p className="text-sm mt-2">Upload some page break images first to use this feature.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availablePageBreaks.map((image, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden"
                    onClick={() => selectPageBreak(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={`Page break ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {image.filename}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPageBreakSelector(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
