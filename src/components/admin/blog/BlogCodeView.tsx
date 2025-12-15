/**
 * BlogCodeView
 * 
 * Raw HTML editor for the TipTap blog editor.
 * Allows viewing and editing the HTML source directly.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import DOMPurify from 'dompurify';

interface BlogCodeViewProps {
  editor: Editor | null;
  isVisible: boolean;
}

export default function BlogCodeView({ editor, isVisible }: BlogCodeViewProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync HTML from editor when becoming visible
  useEffect(() => {
    if (isVisible && editor) {
      const html = formatHtml(editor.getHTML());
      setHtmlContent(html);
      setHasChanges(false);
      setError(null);
    }
  }, [isVisible, editor]);

  // Format HTML for readability
  const formatHtml = useCallback((html: string): string => {
    // Simple HTML formatting - add newlines after block elements
    return html
      .replace(/></g, '>\n<')
      .replace(/(<\/?(p|div|h[1-6]|ul|ol|li|blockquote|figure|pre|hr)[^>]*>)/gi, '\n$1\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, []);

  // Handle HTML content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
    setHasChanges(true);
    setError(null);
  };

  // Apply HTML changes to editor
  const applyChanges = useCallback(() => {
    if (!editor) return;

    try {
      // Validate HTML somewhat
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Check for parse errors
      const parseErrors = doc.querySelectorAll('parsererror');
      if (parseErrors.length > 0) {
        setError('Invalid HTML structure detected');
        return;
      }

      // Sanitize HTML to prevent XSS while preserving blog-specific attributes
      const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
        ADD_TAGS: ['figure', 'figcaption', 'iframe'],
        ADD_ATTR: [
          'data-image-id', 'data-prompt', 'data-checkpoint',
          'data-original-width', 'data-original-height', 'data-alignment',
          'data-display-width', 'data-spoiler', 'data-footnote', 'data-footnote-id',
          'allowfullscreen', 'frameborder', 'allow', 'loading'
        ],
        ALLOW_DATA_ATTR: true,
        // Allow YouTube embeds specifically
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|xxx|youtube):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      // Apply to editor
      editor.commands.setContent(sanitizedHtml, { emitUpdate: true });
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Failed to apply HTML: ${String(err)}`);
    }
  }, [editor, htmlContent]);

  // Refresh from editor (discard changes)
  const refreshFromEditor = useCallback(() => {
    if (!editor) return;
    const html = formatHtml(editor.getHTML());
    setHtmlContent(html);
    setHasChanges(false);
    setError(null);
  }, [editor, formatHtml]);

  // Copy HTML to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [htmlContent]);

  if (!isVisible) return null;

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            HTML Source
          </span>
          {hasChanges && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy HTML"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {hasChanges && (
            <>
              <button
                onClick={refreshFromEditor}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Discard changes and refresh from editor"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Discard
              </button>
              <button
                onClick={applyChanges}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors"
                title="Apply HTML changes to editor"
              >
                Apply Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Edit with caution:</strong> Invalid HTML can break your content. 
          The editor will attempt to fix malformed HTML, which may result in unexpected changes.
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* HTML Editor */}
      <div className="relative">
        <textarea
          value={htmlContent}
          onChange={handleChange}
          className="w-full h-[400px] p-4 font-mono text-sm bg-gray-900 text-green-400 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          spellCheck={false}
          placeholder="<p>Your HTML content here...</p>"
        />
        {/* Line numbers could be added here for a more code-editor feel */}
      </div>

      {/* Quick reference */}
      <details className="text-xs text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
          HTML Quick Reference
        </summary>
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2">
          <code>&lt;p&gt;...&lt;/p&gt;</code>
          <span>Paragraph</span>
          <code>&lt;strong&gt;...&lt;/strong&gt;</code>
          <span>Bold</span>
          <code>&lt;em&gt;...&lt;/em&gt;</code>
          <span>Italic</span>
          <code>&lt;h2&gt;...&lt;/h2&gt;</code>
          <span>Heading 2</span>
          <code>&lt;h3&gt;...&lt;/h3&gt;</code>
          <span>Heading 3</span>
          <code>&lt;blockquote&gt;...&lt;/blockquote&gt;</code>
          <span>Quote</span>
          <code>&lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;</code>
          <span>Bullet list</span>
          <code>&lt;ol&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ol&gt;</code>
          <span>Numbered list</span>
          <code>&lt;a href="..."&gt;...&lt;/a&gt;</code>
          <span>Link</span>
          <code>&lt;figure class="blog-image"&gt;&lt;img src="..."&gt;&lt;/figure&gt;</code>
          <span>Image</span>
        </div>
      </details>
    </div>
  );
}
