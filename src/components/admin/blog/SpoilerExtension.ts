/**
 * SpoilerExtension
 * 
 * Custom TipTap extension that creates a spoiler/hidden text block.
 * Text is covered by a gray block until clicked by the reader.
 */

import { Mark, mergeAttributes } from '@tiptap/core';

export interface SpoilerOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoiler: {
      /**
       * Set a spoiler mark
       */
      setSpoiler: () => ReturnType;
      /**
       * Toggle a spoiler mark
       */
      toggleSpoiler: () => ReturnType;
      /**
       * Unset a spoiler mark
       */
      unsetSpoiler: () => ReturnType;
    };
  }
}

export const Spoiler = Mark.create<SpoilerOptions>({
  name: 'spoiler',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-spoiler]',
      },
      {
        tag: 'span.spoiler',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-spoiler': 'true',
        class: 'spoiler',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setSpoiler:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleSpoiler:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSpoiler:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.toggleSpoiler(),
    };
  },
});

export default Spoiler;
