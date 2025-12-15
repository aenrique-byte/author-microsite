/**
 * YouTubeExtension
 * 
 * Custom TipTap node extension for embedding YouTube videos.
 * Renders as a proper node that persists through save/load cycles.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface YouTubeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * Insert a YouTube video embed
       */
      setYouTubeVideo: (videoId: string) => ReturnType;
    };
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&\s]+)/);
  if (watchMatch) return watchMatch[1];

  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?\s]+)/);
  if (shortMatch) return shortMatch[1];

  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?\s]+)/);
  if (embedMatch) return embedMatch[1];

  // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?\s]+)/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

export const YouTube = Node.create<YouTubeOptions>({
  name: 'youtube',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          // Try to get from data attribute
          const dataId = element.getAttribute('data-youtube-id');
          if (dataId) return dataId;
          
          // Try to extract from iframe src
          const iframe = element.querySelector('iframe');
          if (iframe) {
            const src = iframe.getAttribute('src') || '';
            const match = src.match(/youtube\.com\/embed\/([^?\s]+)/);
            if (match) return match[1];
          }
          
          return null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.videoId) return {};
          return { 'data-youtube-id': String(attributes.videoId) };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
      {
        tag: 'figure.youtube-embed',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes['data-youtube-id'] || '';
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-youtube-video': 'true',
        'data-youtube-id': videoId,
        class: 'youtube-embed',
      }),
      [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${videoId}`,
          width: '560',
          height: '315',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYouTubeVideo:
        (videoId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { videoId },
          });
        },
    };
  },
});

export default YouTube;
