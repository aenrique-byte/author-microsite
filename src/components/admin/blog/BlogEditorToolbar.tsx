/**
 * BlogEditorToolbar
 * 
 * Enhanced toolbar for the TipTap blog editor with:
 * - Standard formatting (bold, italic, headings, lists)
 * - Image tools (insert, alignment, resize)
 * - Code view toggle for raw HTML editing
 */

import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Quote,
  Image as ImageIcon, Heading2, Heading3, Code,
  AlignLeft, AlignCenter, AlignRight,
  Minus, Plus, RotateCcw, EyeOff, Footprints,
  Link, Link2Off, Youtube
} from 'lucide-react';
import { countFootnotes } from './FootnoteExtension';
import type { ImageAlignment } from './BlogImageExtension';

interface BlogEditorToolbarProps {
  editor: Editor | null;
  onInsertImage: () => void;
  onInsertLink: () => void;
  onInsertYouTube: () => void;
  showCodeView: boolean;
  onToggleCodeView: () => void;
}

// Preset width values for quick resize
const PRESET_WIDTHS = ['25%', '50%', '75%', '100%'];

export default function BlogEditorToolbar({
  editor,
  onInsertImage,
  onInsertLink,
  onInsertYouTube,
  showCodeView,
  onToggleCodeView,
}: BlogEditorToolbarProps) {
  const [showImageTools, setShowImageTools] = useState(false);
  const [currentImageWidth, setCurrentImageWidth] = useState<string>('100%');
  const [currentImageAlignment, setCurrentImageAlignment] = useState<ImageAlignment>('center');

  // Detect when an image is selected
  useEffect(() => {
    if (!editor) return;

    const updateImageState = () => {
      const { selection } = editor.state;
      const node = editor.state.doc.nodeAt(selection.from);
      
      if (node?.type.name === 'image') {
        setShowImageTools(true);
        setCurrentImageWidth(node.attrs.displayWidth || '100%');
        setCurrentImageAlignment(node.attrs.alignment || 'center');
      } else {
        setShowImageTools(false);
      }
    };

    editor.on('selectionUpdate', updateImageState);
    editor.on('transaction', updateImageState);

    return () => {
      editor.off('selectionUpdate', updateImageState);
      editor.off('transaction', updateImageState);
    };
  }, [editor]);

  // Set image alignment
  const handleAlignment = useCallback((alignment: ImageAlignment) => {
    if (!editor) return;
    editor.chain().focus().setImageAlignment(alignment).run();
    setCurrentImageAlignment(alignment);
  }, [editor]);

  // Set image width
  const handleWidthChange = useCallback((width: string) => {
    if (!editor) return;
    editor.chain().focus().setImageDisplayWidth(width).run();
    setCurrentImageWidth(width);
  }, [editor]);

  // Adjust width by percentage increment
  const adjustWidth = useCallback((delta: number) => {
    const current = parseInt(currentImageWidth) || 100;
    const newWidth = Math.min(100, Math.max(10, current + delta));
    handleWidthChange(`${newWidth}%`);
  }, [currentImageWidth, handleWidthChange]);

  // Reset to original size
  const resetWidth = useCallback(() => {
    handleWidthChange('100%');
  }, [handleWidthChange]);

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {/* Main Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('blockquote') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Spoiler */}
        <button
          onClick={() => editor.chain().focus().toggleSpoiler().run()}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('spoiler') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Spoiler (Ctrl+Shift+S)"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Footnote */}
        <button
          onClick={() => {
            // Get next footnote number
            const nextId = String(countFootnotes(editor.getJSON()) + 1);
            editor.chain().focus().setFootnote(nextId).run();
          }}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('footnote') ? 'bg-gray-300 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Add Footnote"
        >
          <Footprints className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Image Insert */}
        <button
          onClick={onInsertImage}
          className="p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Insert image from gallery"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Link */}
        <button
          onClick={() => {
            if (editor.isActive('link')) {
              // Remove link
              editor.chain().focus().unsetLink().run();
            } else {
              // Open link modal
              onInsertLink();
            }
          }}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 ${
            editor.isActive('link') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          {editor.isActive('link') ? <Link2Off className="w-4 h-4" /> : <Link className="w-4 h-4" />}
        </button>

        {/* YouTube Embed */}
        <button
          onClick={onInsertYouTube}
          className="p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Embed YouTube Video"
        >
          <Youtube className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Code View Toggle */}
        <button
          onClick={onToggleCodeView}
          className={`p-2 rounded flex items-center gap-1.5 ${
            showCodeView 
              ? 'bg-amber-500 text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Toggle HTML Code View"
        >
          <Code className="w-4 h-4" />
          <span className="text-xs font-medium">HTML</span>
        </button>
      </div>

      {/* Image Tools (shown when image is selected) */}
      {showImageTools && !showCodeView && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mr-2">
            📷 Image Tools:
          </span>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleAlignment('left')}
              className={`p-1.5 rounded ${
                currentImageAlignment === 'left' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlignment('center')}
              className={`p-1.5 rounded ${
                currentImageAlignment === 'center' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlignment('right')}
              className={`p-1.5 rounded ${
                currentImageAlignment === 'right' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Width Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => adjustWidth(-10)}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Decrease width"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[48px] text-center">
              {currentImageWidth}
            </span>
            <button
              onClick={() => adjustWidth(10)}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Increase width"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Widths */}
          <div className="flex items-center gap-1">
            {PRESET_WIDTHS.map((width) => (
              <button
                key={width}
                onClick={() => handleWidthChange(width)}
                className={`px-2 py-1 text-xs rounded ${
                  currentImageWidth === width
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {width}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={resetWidth}
            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            title="Reset to original size"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
