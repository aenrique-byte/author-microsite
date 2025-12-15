/**
 * YouTubeModal
 * 
 * Modal dialog for embedding YouTube videos in the blog editor.
 * Provides URL input with preview.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Youtube, Play } from 'lucide-react';
import { extractYouTubeId } from './YouTubeExtension';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoId: string) => void;
}

export default function YouTubeModal({
  isOpen,
  onClose,
  onSubmit,
}: YouTubeModalProps) {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when opening
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setVideoId(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Extract video ID when URL changes
  useEffect(() => {
    if (!url.trim()) {
      setVideoId(null);
      setError(null);
      return;
    }

    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setError(null);
    } else {
      setVideoId(null);
      setError('Invalid YouTube URL. Please paste a valid YouTube link.');
    }
  }, [url]);

  // Handle submit
  const handleSubmit = () => {
    if (!videoId) return;
    onSubmit(videoId);
    onClose();
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && videoId) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Embed YouTube Video
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* URL input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              YouTube URL
            </label>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Supported formats */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-500 dark:text-gray-400">
              Supported URL formats
            </label>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">youtube.com/watch?v=...</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">youtu.be/...</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">youtube.com/shorts/...</code>
            </div>
          </div>

          {/* Video Preview */}
          {videoId && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview
              </label>
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt="Video thumbnail"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to lower quality thumbnail
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 flex items-center justify-center bg-red-600 rounded-full">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Video ID: <code className="px-1 bg-gray-100 dark:bg-gray-700 rounded">{videoId}</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!videoId}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Youtube className="w-4 h-4" />
            Embed Video
          </button>
        </div>
      </div>
    </div>
  );
}
