/**
 * BlogImageExtension
 * 
 * Custom TipTap Image extension that tracks gallery image IDs,
 * AI generation metadata, alignment, and resizing for blog posts.
 */

import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export type ImageAlignment = 'left' | 'center' | 'right';

export interface BlogImageAttributes {
  src: string;
  alt?: string;
  title?: string;
  /** Gallery image ID for tracking */
  imageId?: number | null;
  /** AI generation prompt */
  prompt?: string | null;
  /** AI model checkpoint */
  checkpoint?: string | null;
  /** Image width */
  width?: number | null;
  /** Image height */
  height?: number | null;
  /** Image alignment */
  alignment?: ImageAlignment;
  /** Display width (for resizing, can be percentage or pixels) */
  displayWidth?: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blogImage: {
      setImageFromGallery: (options: {
        src: string;
        alt?: string;
        imageId: number;
        prompt?: string | null;
        checkpoint?: string | null;
        width?: number | null;
        height?: number | null;
        alignment?: ImageAlignment;
      }) => ReturnType;
      setImageAlignment: (alignment: ImageAlignment) => ReturnType;
      setImageDisplayWidth: (width: string) => ReturnType;
    };
  }
}

/**
 * Extended Image node for blog posts
 * 
 * Adds custom attributes for:
 * - imageId: References images table for gallery integration
 * - prompt: AI generation prompt (for display)
 * - checkpoint: AI model used
 * - width/height: Original dimensions
 * - alignment: left, center, right
 * - displayWidth: resized display width
 */
export const BlogImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      
      // Gallery image ID - links to images table
      imageId: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const id = element.getAttribute('data-image-id');
          return id ? parseInt(id, 10) : null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.imageId) return {};
          return { 'data-image-id': String(attributes.imageId) };
        },
      },
      
      // AI prompt
      prompt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-prompt'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.prompt) return {};
          return { 'data-prompt': String(attributes.prompt) };
        },
      },
      
      // AI checkpoint/model
      checkpoint: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-checkpoint'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.checkpoint) return {};
          return { 'data-checkpoint': String(attributes.checkpoint) };
        },
      },
      
      // Original image width
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const w = element.getAttribute('data-original-width');
          return w ? parseInt(w, 10) : null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.width) return {};
          return { 'data-original-width': String(attributes.width) };
        },
      },
      
      // Original image height
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const h = element.getAttribute('data-original-height');
          return h ? parseInt(h, 10) : null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.height) return {};
          return { 'data-original-height': String(attributes.height) };
        },
      },

      // Image alignment: left | center | right
      alignment: {
        default: 'center',
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-alignment') || 'center';
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const alignment = attributes.alignment || 'center';
          return { 'data-alignment': String(alignment) };
        },
      },

      // Display width for resizing (e.g., "50%", "400px")
      displayWidth: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.style.width || element.getAttribute('data-display-width') || null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.displayWidth) return {};
          return { 
            'data-display-width': String(attributes.displayWidth),
            style: `width: ${attributes.displayWidth}`,
          };
        },
      },
    };
  },

  // Custom HTML rendering with alignment wrapper
  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes['data-alignment'] || 'center';
    const displayWidth = HTMLAttributes['data-display-width'];
    
    // Build image style
    const imgStyle: string[] = [];
    if (displayWidth) {
      imgStyle.push(`width: ${displayWidth}`);
    }
    
    // Alignment styles using flexbox wrapper
    const alignmentClass = {
      left: 'blog-image--left',
      center: 'blog-image--center',
      right: 'blog-image--right',
    }[alignment as string] || 'blog-image--center';

    return [
      'figure',
      { class: `blog-image ${alignmentClass}` },
      [
        'img',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          style: imgStyle.length > 0 ? imgStyle.join('; ') : undefined,
        }),
      ],
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      
      /**
       * Insert image from gallery with metadata
       */
      setImageFromGallery:
        (options: {
          src: string;
          alt?: string;
          imageId: number;
          prompt?: string | null;
          checkpoint?: string | null;
          width?: number | null;
          height?: number | null;
          alignment?: ImageAlignment;
        }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.insertContent({
            type: 'image',
            attrs: {
              src: options.src,
              alt: options.alt || '',
              imageId: options.imageId,
              prompt: options.prompt,
              checkpoint: options.checkpoint,
              width: options.width,
              height: options.height,
              alignment: options.alignment || 'center',
            },
          });
        },

      /**
       * Set alignment for selected image
       */
      setImageAlignment:
        (alignment: ImageAlignment) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands, state }: any) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          
          if (node?.type.name === 'image') {
            return commands.updateAttributes('image', { alignment });
          }
          return false;
        },

      /**
       * Set display width for selected image
       */
      setImageDisplayWidth:
        (width: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands, state }: any) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          
          if (node?.type.name === 'image') {
            return commands.updateAttributes('image', { displayWidth: width });
          }
          return false;
        },
    };
  },
});

/**
 * Extract all image IDs from TipTap JSON content
 * Used for tracking image usage in blog posts
 */
export function extractImageIdsFromContent(content: unknown): number[] {
  const imageIds: number[] = [];
  
  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    
    const obj = node as Record<string, unknown>;
    
    if (obj.type === 'image' && obj.attrs) {
      const attrs = obj.attrs as Record<string, unknown>;
      if (attrs.imageId && typeof attrs.imageId === 'number') {
        imageIds.push(attrs.imageId);
      }
    }
    
    if (Array.isArray(obj.content)) {
      for (const child of obj.content) {
        traverse(child);
      }
    }
  }
  
  traverse(content);
  return imageIds;
}

/**
 * Parse TipTap JSON string and extract image IDs
 */
export function extractImageIdsFromJson(jsonString: string): number[] {
  try {
    const content = JSON.parse(jsonString);
    return extractImageIdsFromContent(content);
  } catch {
    return [];
  }
}

export default BlogImage;
