/**
 * FootnoteExtension
 * 
 * Custom TipTap extension for footnotes.
 * Creates superscript footnote references that link to footnote definitions.
 */

import { Mark, mergeAttributes } from '@tiptap/core';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      /**
       * Set a footnote mark with an ID
       */
      setFootnote: (id: string) => ReturnType;
      /**
       * Unset a footnote mark
       */
      unsetFootnote: () => ReturnType;
    };
  }
}

export const Footnote = Mark.create<FootnoteOptions>({
  name: 'footnote',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-footnote-id'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.id) return {};
          return { 'data-footnote-id': String(attributes.id) };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote]',
      },
      {
        tag: 'sup.footnote-ref',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const id = HTMLAttributes['data-footnote-id'] || '1';
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-footnote': 'true',
        'data-footnote-id': id,
        class: 'footnote-ref',
        id: `fnref-${id}`,
      }),
      [
        'a',
        {
          href: `#fn-${id}`,
          class: 'footnote-link',
        },
        `[${id}]`,
      ],
    ];
  },

  addCommands() {
    return {
      setFootnote:
        (id: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { id });
        },
      unsetFootnote:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

/**
 * Count existing footnotes in the document
 */
export function countFootnotes(content: unknown): number {
  let count = 0;
  
  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    
    const obj = node as Record<string, unknown>;
    
    // Check for footnote marks
    if (Array.isArray(obj.marks)) {
      for (const mark of obj.marks) {
        if (mark && typeof mark === 'object' && (mark as Record<string, unknown>).type === 'footnote') {
          count++;
        }
      }
    }
    
    if (Array.isArray(obj.content)) {
      for (const child of obj.content) {
        traverse(child);
      }
    }
  }
  
  traverse(content);
  return count;
}

/**
 * Extract all footnotes from document for rendering footnote list
 */
export function extractFootnotes(content: unknown): Array<{ id: string; text: string }> {
  const footnotes: Array<{ id: string; text: string }> = [];
  
  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    
    const obj = node as Record<string, unknown>;
    
    // Check for footnote marks
    if (Array.isArray(obj.marks) && obj.text) {
      for (const mark of obj.marks) {
        if (mark && typeof mark === 'object') {
          const markObj = mark as Record<string, unknown>;
          if (markObj.type === 'footnote' && markObj.attrs) {
            const attrs = markObj.attrs as Record<string, unknown>;
            footnotes.push({
              id: String(attrs.id || ''),
              text: String(obj.text || ''),
            });
          }
        }
      }
    }
    
    if (Array.isArray(obj.content)) {
      for (const child of obj.content) {
        traverse(child);
      }
    }
  }
  
  traverse(content);
  return footnotes;
}

export default Footnote;
