/**
 * BlogManager Component
 * 
 * Admin interface for managing blog posts with TipTap editor
 * and gallery image integration (Phase 2).
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Plus, Edit, Trash2, Eye, Save, X, Search,
  FileText, Calendar, Tag, Folder, Share2,
  Send, AlertCircle, Settings, Image as ImageIcon
} from 'lucide-react';
import {
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listBlogCategories,
  BlogPostSummary,
  BlogPost,
  BlogCategory,
  generateSlug,
  calculateReadingTime,
} from '../../utils/api-blog';
import { saveBlogCrosspostSettings, crosspostBlogPost, getBlogCrosspostSettings } from '../../utils/api-social';
import { BlogImage } from './blog/BlogImageExtension';
import { Spoiler } from './blog/SpoilerExtension';
import { Footnote } from './blog/FootnoteExtension';
import { YouTube } from './blog/YouTubeExtension';
import BlogImagePicker from './blog/BlogImagePicker';
import LinkModal from './blog/LinkModal';
import YouTubeModal from './blog/YouTubeModal';
import { BlogCategoryManager } from './blog/BlogCategoryManager';
import BlogEditorToolbar from './blog/BlogEditorToolbar';
import BlogCodeView from './blog/BlogCodeView';
import type { BlogPickerImage } from '../../utils/api-blog';

// Empty TipTap document
const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export default function BlogManager() {
  // List state
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Image state
  const [featuredImage, setFeaturedImage] = useState<BlogPickerImage | null>(null);
  const [instagramImage, setInstagramImage] = useState<BlogPickerImage | null>(null);
  const [twitterImage, setTwitterImage] = useState<BlogPickerImage | null>(null);
  const [facebookImage, setFacebookImage] = useState<BlogPickerImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState<'featured' | 'inline' | 'instagram' | 'twitter' | 'facebook'>('featured');

  // Crosspost staging state (Phase 4)
  const [crosspostEnabled, setCrosspostEnabled] = useState({
    instagram: false,
    twitter: false,
    facebook: false,
    discord: false,
  });
  const [crosspostMessages, setCrosspostMessages] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    discord: '',
  });
  const [crosspostHashtags, setCrosspostHashtags] = useState('');

  // Category manager toggle
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Code view state (for HTML editing)
  const [showCodeView, setShowCodeView] = useState(false);

  // Link and YouTube modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      BlogImage,
      Spoiler,
      Footnote,
      YouTube,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
      CharacterCount,
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-gray-900 dark:text-white',
      },
    },
  });

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listBlogPosts({
        page,
        limit: 20,
        status: statusFilter as 'draft' | 'published' | 'scheduled' | undefined,
        q: searchQuery || undefined,
      });
      if (response.success) {
        setPosts(response.posts);
        setTotalPages(response.pages);
      } else {
        setError(response.error || 'Failed to load posts');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const response = await listBlogCategories(true);
    if (response.success) {
      setCategories(response.categories);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingPost && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, editingPost, slug]);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setStatus('draft');
    setSelectedCategories([]);
    setTags([]);
    setTagInput('');
    setMetaDescription('');
    setFeaturedImage(null);
    setInstagramImage(null);
    setTwitterImage(null);
    setFacebookImage(null);
    setEditingPost(null);
    // Reset crosspost state
    setCrosspostEnabled({ instagram: false, twitter: false, facebook: false, discord: false });
    setCrosspostMessages({ instagram: '', twitter: '', facebook: '', discord: '' });
    setCrosspostHashtags('');
    editor?.commands.setContent(EMPTY_DOC);
  };

  // Open editor for new post
  const handleNewPost = () => {
    resetForm();
    setIsEditing(true);
  };

  // Open editor for existing post
  const handleEditPost = async (post: BlogPostSummary) => {
    setLoading(true);
    try {
      const response = await import('../../utils/api-blog').then(m => m.getBlogPostById(post.id));
      if (response.success && response.post) {
        const fullPost = response.post;
        setEditingPost(fullPost);
        setTitle(fullPost.title);
        setSlug(fullPost.slug);
        setExcerpt(fullPost.excerpt || '');
        setStatus(fullPost.status);
        setSelectedCategories(fullPost.categories || []);
        setTags(fullPost.tags || []);
        setMetaDescription(fullPost.meta_description || '');
        
        // Load content into editor
        if (fullPost.content_json) {
          try {
            const content = JSON.parse(fullPost.content_json);
            editor?.commands.setContent(content);
          } catch {
            editor?.commands.setContent(EMPTY_DOC);
          }
        }
        
        // Set featured image if exists
        if (fullPost.featured_image) {
          setFeaturedImage({
            id: fullPost.featured_image.id,
            title: fullPost.featured_image.alt_text || 'Featured Image',
            original_path: fullPost.featured_image.original_path,
            thumbnail_path: fullPost.featured_image.thumbnail_path || null,
            width: fullPost.featured_image.width || null,
            height: fullPost.featured_image.height || null,
            aspect_ratio: null,
            file_size: null,
            mime_type: null,
            prompt: fullPost.featured_image.prompt || null,
            checkpoint: fullPost.featured_image.checkpoint || null,
            gallery_id: 0,
            gallery_slug: '',
            gallery_title: '',
            created_at: '',
          });
        }

        // Load social media images if they exist (Phase 4)
        // Note: These are stored as image_id fields in the database
        // For now, we'll just store the paths if they exist
        if (fullPost.instagram_image) {
          // TODO: Fetch full image details from gallery API if we have instagram_image_id
          setInstagramImage(null); // Placeholder until we implement image loading
        }
        if (fullPost.twitter_image) {
          setTwitterImage(null); // Placeholder
        }
        if (fullPost.facebook_image) {
          setFacebookImage(null); // Placeholder
        }

        // Load crosspost settings (Phase 4)
        try {
          const crosspostData = await getBlogCrosspostSettings(post.id);
          if (crosspostData.success && crosspostData.settings) {
            const enabledState = { instagram: false, twitter: false, facebook: false, discord: false };
            const messagesState = { instagram: '', twitter: '', facebook: '', discord: '' };

            crosspostData.settings.forEach((setting) => {
              const platform = setting.platform as 'instagram' | 'twitter' | 'facebook' | 'discord';
              enabledState[platform] = setting.enabled;
              messagesState[platform] = setting.custom_message || '';
            });

            setCrosspostEnabled(enabledState);
            setCrosspostMessages(messagesState);
          }
        } catch (crosspostErr) {
          console.error('Failed to load crosspost settings:', crosspostErr);
          // Don't fail the whole edit operation if crosspost settings fail to load
        }

        setIsEditing(true);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Save post
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const contentJson = JSON.stringify(editor?.getJSON() || EMPTY_DOC);
      const contentHtml = editor?.getHTML() || '';

      const postData = {
        title,
        slug: slug || generateSlug(title),
        excerpt: excerpt || undefined,
        content_json: contentJson,
        content_html: contentHtml,
        status,
        categories: selectedCategories,
        tags,
        meta_description: metaDescription || undefined,
        featured_image_id: featuredImage?.id,
        cover_image: featuredImage?.original_path,
        // Phase 4: Social media images
        instagram_image_id: instagramImage?.id,
        instagram_image: instagramImage?.original_path,
        twitter_image_id: twitterImage?.id,
        twitter_image: twitterImage?.original_path,
        facebook_image_id: facebookImage?.id,
        facebook_image: facebookImage?.original_path,
        reading_time: calculateReadingTime(contentHtml),
      };

      let response;
      if (editingPost) {
        response = await updateBlogPost({ id: editingPost.id, ...postData });
      } else {
        response = await createBlogPost(postData);
      }

      if (response.success) {
        // Save crosspost settings (always save, even if all disabled)
        const postId = editingPost?.id || (response as { success: true; id?: number }).id;
        if (postId) {
          // Build platform settings array - include ALL platforms to track enabled/disabled state
          const platformSettings: Array<{
            platform: 'instagram' | 'twitter' | 'facebook' | 'discord';
            enabled: boolean;
            custom_message?: string;
          }> = [];

          // Add settings for each platform
          (['instagram', 'twitter', 'facebook', 'discord'] as const).forEach((platform) => {
            // Combine message with hashtags for Instagram/Twitter
            let message = crosspostMessages[platform];
            if ((platform === 'instagram' || platform === 'twitter') && crosspostHashtags) {
              message = message ? `${message}\n\n${crosspostHashtags}` : crosspostHashtags;
            }

            platformSettings.push({
              platform,
              enabled: crosspostEnabled[platform],
              custom_message: message || undefined,
            });
          });

          // Save crosspost settings (don't block on failure)
          try {
            await saveBlogCrosspostSettings(postId, platformSettings);
          } catch (crosspostErr) {
            console.error('Failed to save crosspost settings:', crosspostErr);
            // Continue anyway - the post was saved successfully
          }

          // Auto-crosspost if this is the first time publishing
          const allowCrosspost = (response as any).allow_crosspost;
          if (allowCrosspost && status === 'published') {
            try {
              const crosspostResult = await crosspostBlogPost(postId);
              if (crosspostResult.success) {
                console.log('Crossposted successfully:', crosspostResult.results);
              } else {
                console.warn('Crosspost had errors:', crosspostResult.results);
              }
            } catch (crosspostErr) {
              console.error('Failed to crosspost:', crosspostErr);
              // Don't show error to user - post was still saved
            }
          }
        }

        setIsEditing(false);
        resetForm();
        fetchPosts();
      } else {
        setError(response.error || 'Failed to save post');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  // Delete post
  const handleDelete = async (post: BlogPostSummary) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    try {
      const response = await deleteBlogPost(post.id, true);
      if (response.success) {
        fetchPosts();
      } else {
        setError(response.error || 'Failed to delete post');
      }
    } catch (err) {
      setError(String(err));
    }
  };

  // Manually trigger crosspost for a published post
  const handleCrosspost = async (post: BlogPostSummary) => {
    if (post.status !== 'published') {
      alert('Only published posts can be crossposted to social media.');
      return;
    }

    if (!confirm(`Post "${post.title}" to social media? This will post to all enabled platforms.`)) {
      return;
    }

    try {
      const result = await crosspostBlogPost(post.id);

      // Debug logging
      console.log('Crosspost result:', result);

      if (!result) {
        alert('Error: No response from crosspost API');
        return;
      }

      // Check if no platforms enabled
      if (result.success && (!result.results || Object.keys(result.results).length === 0)) {
        alert('No platforms enabled for this post.\n\nTo enable crossposting:\n1. Edit the post\n2. Scroll to "Social Media Crossposting"\n3. Check the platforms you want\n4. Save the post');
        return;
      }

      if (result.success && result.summary.success > 0) {
        alert(`Successfully posted to ${result.summary.success} platform(s)!`);
      } else {
        const successPlatforms = Object.entries(result.results || {})
          .filter(([_, r]) => r.success)
          .map(([p]) => p);
        const failedPlatforms = Object.entries(result.results || {})
          .filter(([_, r]) => !r.success)
          .map(([p, r]) => `${p}: ${r.error}`);

        if (successPlatforms.length > 0) {
          alert(
            `Partial success:\n✓ Posted to: ${successPlatforms.join(', ')}\n✗ Failed: ${failedPlatforms.join(', ')}`
          );
        } else {
          alert(`Failed to post:\n${failedPlatforms.join('\n')}`);
        }
      }
    } catch (err) {
      console.error('Crosspost error:', err);
      alert(`Error: ${String(err)}`);
    }
  };

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  // Image picker handlers
  const handleOpenImagePicker = (mode: 'featured' | 'inline' | 'instagram' | 'twitter' | 'facebook') => {
    setImagePickerMode(mode);
    setShowImagePicker(true);
  };

  const handleSelectImage = (image: BlogPickerImage) => {
    if (imagePickerMode === 'featured') {
      setFeaturedImage(image);
    } else if (imagePickerMode === 'instagram') {
      setInstagramImage(image);
    } else if (imagePickerMode === 'twitter') {
      setTwitterImage(image);
    } else if (imagePickerMode === 'facebook') {
      setFacebookImage(image);
    } else {
      // Insert inline image
      editor?.chain().focus().setImageFromGallery({
        src: image.original_path,
        alt: image.title,
        imageId: image.id,
        prompt: image.prompt,
        checkpoint: image.checkpoint,
        width: image.width,
        height: image.height,
      }).run();
    }
  };

  // Render post list
  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Posts</h2>
          <button
            onClick={handleNewPost}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Post List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No posts found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{post.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        post.status === 'published' ? 'bg-green-100 dark:bg-emerald-900/50 text-green-800 dark:text-emerald-400' :
                        post.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400' :
                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}
                      <span>{post.view_count} views</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {post.status === 'published' && (
                      <button
                        onClick={() => handleCrosspost(post)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Post to Social Media"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded transition-colors ${
                  page === i + 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render editor
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingPost ? 'Edit Post' : 'New Post'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setIsEditing(false); resetForm(); }}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-xl focus:ring-2 focus:ring-emerald-500"
          />

          {/* Toolbar with image tools and code view toggle */}
          <BlogEditorToolbar
            editor={editor}
            onInsertImage={() => handleOpenImagePicker('inline')}
            onInsertLink={() => setShowLinkModal(true)}
            onInsertYouTube={() => setShowYouTubeModal(true)}
            showCodeView={showCodeView}
            onToggleCodeView={() => setShowCodeView(!showCodeView)}
          />

          {/* Editor or Code View */}
          {showCodeView ? (
            <BlogCodeView editor={editor} isVisible={showCodeView} />
          ) : (
            <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden blog-editor-content">
              <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
            </div>
          )}

          {/* Word count */}
          <div className="text-sm text-gray-500">
            {editor?.storage.characterCount.words() || 0} words · 
            {' '}{calculateReadingTime(editor?.getHTML() || '')} min read
          </div>

          {/* Crosspost Staging (Phase 4) - Moved to main column for more space */}
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5" />
                Social Media Crossposting
              </h3>
              <p className="text-sm text-gray-500">
                <span className="font-medium">
                  {Object.values(crosspostEnabled).filter(Boolean).length} platform(s) enabled
                </span>
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize your message for each platform. These will be used when crossposting after publishing.
            </p>

            {/* Shared Hashtags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hashtags (shared across platforms)
              </label>
              <input
                type="text"
                value={crosspostHashtags}
                onChange={(e) => setCrosspostHashtags(e.target.value)}
                placeholder="#writing #fantasy #books"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500">
                Separate with spaces. Will be added to Instagram and Twitter posts.
              </p>
            </div>

            {/* Platform Grid - 2 columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-pink-500/5 to-purple-600/5 border border-pink-200 dark:border-pink-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-xl">📸</span> Instagram
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crosspostEnabled.instagram}
                      onChange={(e) => setCrosspostEnabled({ ...crosspostEnabled, instagram: e.target.checked })}
                      disabled={!instagramImage}
                      className="rounded border-gray-300 dark:border-gray-600 text-pink-600 focus:ring-pink-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-500">Enable</span>
                  </label>
                </div>
                {!instagramImage && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Upload an Instagram image in sidebar to enable
                  </p>
                )}
                <textarea
                  value={crosspostMessages.instagram}
                  onChange={(e) => setCrosspostMessages({ ...crosspostMessages, instagram: e.target.value })}
                  placeholder={`${title || 'Your post title'}\n\n${excerpt || 'Your excerpt...'}\n\n🔗 Link in bio`}
                  rows={5}
                  maxLength={2200}
                  disabled={!crosspostEnabled.instagram}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Caption + hashtags</span>
                  <span className={crosspostMessages.instagram.length > 2000 ? 'text-red-500' : ''}>
                    {crosspostMessages.instagram.length}/2,200
                  </span>
                </div>
              </div>

              {/* Twitter/X */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-blue-400/5 to-blue-600/5 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-xl">𝕏</span> Twitter/X
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crosspostEnabled.twitter}
                      onChange={(e) => setCrosspostEnabled({ ...crosspostEnabled, twitter: e.target.checked })}
                      disabled={!twitterImage}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-500">Enable</span>
                  </label>
                </div>
                {!twitterImage && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Upload a Twitter image in sidebar to enable
                  </p>
                )}
                <textarea
                  value={crosspostMessages.twitter}
                  onChange={(e) => setCrosspostMessages({ ...crosspostMessages, twitter: e.target.value })}
                  placeholder={`${title || 'Your post title'}\n\nhttps://yourdomain.com/blog/${slug || 'your-post-slug'}`}
                  rows={5}
                  maxLength={280}
                  disabled={!crosspostEnabled.twitter}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tweet text (URL = 23 chars)</span>
                  <span className={crosspostMessages.twitter.length > 257 ? 'text-red-500' : ''}>
                    {crosspostMessages.twitter.length}/280
                  </span>
                </div>
              </div>

              {/* Facebook */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-blue-600/5 to-blue-800/5 border border-blue-300 dark:border-blue-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-xl">📘</span> Facebook
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crosspostEnabled.facebook}
                      onChange={(e) => setCrosspostEnabled({ ...crosspostEnabled, facebook: e.target.checked })}
                      disabled={!facebookImage && !featuredImage}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-500">Enable</span>
                  </label>
                </div>
                {!facebookImage && !featuredImage && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Upload a Facebook or Featured image to enable
                  </p>
                )}
                <textarea
                  value={crosspostMessages.facebook}
                  onChange={(e) => setCrosspostMessages({ ...crosspostMessages, facebook: e.target.value })}
                  placeholder={`${title || 'Your post title'}\n\n${excerpt || 'Your excerpt...'}\n\nRead more: https://yourdomain.com/blog/${slug || 'your-post-slug'}`}
                  rows={5}
                  disabled={!crosspostEnabled.facebook}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none disabled:opacity-50"
                />
                <div className="text-xs text-gray-500">
                  Facebook post with auto link preview
                </div>
              </div>

              {/* Discord */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-indigo-500/5 to-purple-600/5 border border-indigo-200 dark:border-indigo-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-xl">💬</span> Discord
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crosspostEnabled.discord}
                      onChange={(e) => setCrosspostEnabled({ ...crosspostEnabled, discord: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-500">Enable</span>
                  </label>
                </div>
                <textarea
                  value={crosspostMessages.discord}
                  onChange={(e) => setCrosspostMessages({ ...crosspostMessages, discord: e.target.value })}
                  placeholder={`📝 New blog post!\n\n**${title || 'Your post title'}**\n\n${excerpt || 'Your excerpt...'}`}
                  rows={5}
                  maxLength={2000}
                  disabled={!crosspostEnabled.discord}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Discord embed message</span>
                  <span className={crosspostMessages.discord.length > 1800 ? 'text-amber-500' : ''}>
                    {crosspostMessages.discord.length}/2,000
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
              Posts will be crossposted to enabled platforms when the blog post is published.
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Publishing</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Slug */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">URL Slug</h3>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-url-slug"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          {/* Featured Image */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Featured Image</h3>
            {featuredImage ? (
              <div className="relative">
                <img
                  src={featuredImage.thumbnail_path || featuredImage.original_path}
                  alt="Featured"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenImagePicker('featured')}
                className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 transition-colors"
              >
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">Select image</span>
              </button>
            )}
          </div>

          {/* Social Media Images (Phase 4) */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social Media Images
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Upload platform-specific images for crossposting. These are required for automated social media posting.
            </p>

            {/* Instagram Image - 1080x1080 or 1080x1350 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Instagram (1080x1080 or 1080x1350)
              </label>
              {instagramImage ? (
                <div className="relative">
                  <img
                    src={instagramImage.thumbnail_path || instagramImage.original_path}
                    alt="Instagram"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setInstagramImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {instagramImage.width}x{instagramImage.height}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenImagePicker('instagram')}
                  className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-pink-500 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <span className="text-xs text-gray-500">Select Instagram image</span>
                </button>
              )}
            </div>

            {/* Twitter Image - 1200x675 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Twitter/X (1200x675)
              </label>
              {twitterImage ? (
                <div className="relative">
                  <img
                    src={twitterImage.thumbnail_path || twitterImage.original_path}
                    alt="Twitter"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setTwitterImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {twitterImage.width}x{twitterImage.height}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenImagePicker('twitter')}
                  className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <span className="text-xs text-gray-500">Select Twitter image</span>
                </button>
              )}
            </div>

            {/* Facebook Image - 1200x630 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Facebook (1200x630)
              </label>
              {facebookImage ? (
                <div className="relative">
                  <img
                    src={facebookImage.thumbnail_path || facebookImage.original_path}
                    alt="Facebook"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFacebookImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {facebookImage.width}x{facebookImage.height}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenImagePicker('facebook')}
                  className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-600 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <span className="text-xs text-gray-500">Select Facebook image</span>
                </button>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Excerpt</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Categories */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Categories
              </h3>
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                title="Manage Categories"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            {/* Category Selection */}
            {!showCategoryManager && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No categories yet. Click ⚙️ to add some.
                  </p>
                ) : (
                  categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.slug]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.slug));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* Category Manager (collapsible) */}
            {showCategoryManager && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <BlogCategoryManager onCategoriesChange={fetchCategories} />
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="mt-3 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ← Back to selection
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SEO */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Meta description..."
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none"
            />
            <div className="text-xs text-gray-500">
              {metaDescription.length}/160 characters
            </div>
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      <BlogImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleSelectImage}
        title={
          imagePickerMode === 'featured' ? 'Select Featured Image' :
          imagePickerMode === 'instagram' ? 'Select Instagram Image (1080x1080 or 1080x1350)' :
          imagePickerMode === 'twitter' ? 'Select Twitter Image (1200x675)' :
          imagePickerMode === 'facebook' ? 'Select Facebook Image (1200x630)' :
          'Insert Image'
        }
        description={
          imagePickerMode === 'featured' ? 'Choose an image for the post header' :
          imagePickerMode === 'instagram' ? 'Select a square or portrait image for Instagram crossposting' :
          imagePickerMode === 'twitter' ? 'Select a landscape image for Twitter/X crossposting' :
          imagePickerMode === 'facebook' ? 'Select a landscape image for Facebook crossposting' :
          'Select an image to insert into your content'
        }
      />

      {/* Link Modal */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSubmit={(url, text) => {
          if (editor) {
            if (text && !editor.state.selection.empty === false) {
              // If text provided and no selection, insert text with link
              editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${text}</a>`).run();
            } else {
              // Apply link to selection or cursor position
              editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
            }
          }
        }}
        hasSelection={editor ? !editor.state.selection.empty : false}
        initialText={editor?.state.selection.empty ? '' : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) || ''}
      />

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onSubmit={(videoId) => {
          if (editor) {
            editor.chain().focus().setYouTubeVideo(videoId).run();
          }
        }}
      />
    </div>
  );
}
