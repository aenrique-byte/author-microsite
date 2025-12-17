import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../lib/apiBase';
import { clearChapterCache } from '../utils/api-story';
import { ImagePickerModal } from './ImagePickerModal';

interface ChapterData {
  id: number;
  title: string;
  slug: string;
  content: string;
  chapter_number: number;
  status: string;
}

interface ChapterEditModalProps {
  storySlug: string;
  chapterNumber: number;
  onClose: () => void;
  onSaved: (updatedContent: string) => void;
}

export function ChapterEditModal({ storySlug, chapterNumber, onClose, onSaved }: ChapterEditModalProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<ChapterData>({
    id: 0,
    title: '',
    slug: '',
    content: '',
    chapter_number: chapterNumber,
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    const loadChapter = async () => {
      try {
        setError('');
        const response = await fetch(
          `${API_BASE}/chapters/list.php?story_slug=${encodeURIComponent(storySlug)}&chapter_number=${chapterNumber}`,
          { credentials: 'same-origin' }
        );
        const data = await response.json();
        
        if (data.success && data.chapters && data.chapters.length > 0) {
          const chapter = data.chapters[0];
          setForm({
            id: chapter.id,
            title: chapter.title || '',
            slug: chapter.slug || '',
            content: chapter.content || '',
            chapter_number: chapter.chapter_number,
            status: chapter.status || 'draft'
          });
        } else {
          throw new Error('Chapter not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [storySlug, chapterNumber]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/chapters/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Save failed');
      }

      // Clear cache and update parent component
      clearChapterCache(storySlug);
      onSaved(form.content);
      
      // If chapter number changed, navigate to new URL
      if (form.chapter_number !== chapterNumber) {
        navigate(`/storytime/story/${storySlug}/chapter/${form.chapter_number}`);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ChapterData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-900 p-6">
          <div className="text-center text-gray-900 dark:text-white">Loading chapter...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" 
      role="dialog" 
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Chapter</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Chapter'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Chapter title"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="chapter-slug"
            />
          </div>

          {/* Chapter Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chapter Number
            </label>
            <input
              type="number"
              value={form.chapter_number}
              onChange={(e) => handleInputChange('chapter_number', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use 0 for prologue or special chapters
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content (Markdown)
              </label>
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Insert Image
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              rows={20}
              placeholder="Write your chapter content in Markdown..."
            />
          </div>
        </div>

      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImagePickerModal
          onSelect={(imageUrl, altText) => {
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const markdown = `![${altText}](${imageUrl})`;
              const newContent = form.content.slice(0, start) + markdown + form.content.slice(end);
              handleInputChange('content', newContent);
              // Restore focus and set cursor after inserted text
              setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, start + markdown.length);
              }, 0);
            }
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
