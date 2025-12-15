/**
 * LinkModal
 * 
 * Modal dialog for adding/editing hyperlinks in the blog editor.
 * Provides text and URL input fields.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Link, ExternalLink } from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
  hasSelection?: boolean;
}

export default function LinkModal({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = '',
  initialText = '',
  hasSelection = false,
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when opening
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
      // Focus URL input after a short delay
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialUrl, initialText]);

  // Handle submit
  const handleSubmit = () => {
    if (!url.trim()) return;
    
    // Add https:// if no protocol specified
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    
    onSubmit(finalUrl, text.trim() || undefined);
    onClose();
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Link
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
          {/* Text input (only show if no text is selected) */}
          {!hasSelection && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Link Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Click here to buy my book..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {/* URL input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://amazon.com/your-book"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-500 dark:text-gray-400">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setUrl('https://www.amazon.com/dp/')}
                className="px-2.5 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                Amazon
              </button>
              <button
                onClick={() => setUrl('https://www.royalroad.com/fiction/')}
                className="px-2.5 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                RoyalRoad
              </button>
              <button
                onClick={() => setUrl('https://www.scribblehub.com/series/')}
                className="px-2.5 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                ScribbleHub
              </button>
              <button
                onClick={() => setUrl('https://www.patreon.com/')}
                className="px-2.5 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Patreon
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Links will open in a new tab for readers. External links show a ↗ indicator.
            </p>
          </div>
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
            disabled={!url.trim()}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
}
