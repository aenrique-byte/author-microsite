import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTheme } from '../contexts/ThemeContext';

interface RenderedMarkdownProps {
  markdown: string;
  className?: string;
  enableDropCap?: boolean;
  dropCapFont?: string;
}

// Color mapping for custom markdown color syntax
const COLOR_MAP: Record<string, string> = {
  yellow: '#FFD700',
  gold: '#FFD700',
  gray: '#808080',
  grey: '#808080',
  red: '#DC143C',
  crimson: '#DC143C',
  purple: '#9370DB',
  violet: '#9370DB',
  blue: '#4169E1',
  royalblue: '#4169E1',
  green: '#32CD32',
  lime: '#32CD32',
  orange: '#FF8C00',
  darkorange: '#FF8C00',
  pink: '#FF69B4',
  hotpink: '#FF69B4',
  cyan: '#00CED1',
  darkturquoise: '#00CED1',
  magenta: '#FF00FF',
  fuchsia: '#FF00FF',
  brown: '#8B4513',
  saddlebrown: '#8B4513',
  white: '#FFFFFF',
  black: '#000000',
  silver: '#C0C0C0',
  maroon: '#800000',
  olive: '#808000',
  navy: '#000080',
  teal: '#008080',
  aqua: '#00FFFF',
  indigo: '#4B0082',
  coral: '#FF7F50',
  salmon: '#FA8072',
  khaki: '#F0E68C',
  lavender: '#E6E6FA',
  mint: '#98FF98',
  peach: '#FFDAB9',
  rose: '#FFE4E1',
  sky: '#87CEEB',
  tan: '#D2B48C',
};

// Parse custom color syntax: {color}text{/color}
function parseColorSyntax(text: string): string {
  return text.replace(/\{(\w+)\}([\s\S]*?)\{\/\1\}/g, (match, color, content) => {
    const hexColor = COLOR_MAP[color.toLowerCase()];
    if (hexColor) {
      return `<span class="story-color" style="--story-color: ${hexColor};">${content}</span>`;
    }
    return match; // Return original if color not found
  });
}

// Apply drop cap to the first letter of the first paragraph and after page breaks
function applyDropCap(html: string): string {
  // First, apply drop cap to the very first <p> tag
  let result = html.replace(/(<p[^>]*>)([^<\s])/, (_match, openTag, firstChar) => {
    return `${openTag}<span class="drop-cap">${firstChar}</span>`;
  });

  // Then, apply drop cap to any <p> tag that comes immediately after a page break image
  result = result.replace(
    /(class="page-break"[^>]*>\s*)(<p[^>]*>)([^<\s])/g,
    (_match, beforeP, openTag, firstChar) => {
      return `${beforeP}${openTag}<span class="drop-cap">${firstChar}</span>`;
    }
  );

  return result;
}

export function RenderedMarkdown({ markdown, className, enableDropCap = false, dropCapFont = 'serif' }: RenderedMarkdownProps) {
  const { theme } = useTheme();

  // Get font family for drop cap
  const getDropCapFontFamily = () => {
    const fontFamilyMap: Record<string, string> = {
      serif: 'Georgia, serif',
      cinzel: '"Cinzel", serif',
      playfair: '"Playfair Display", serif',
      cormorant: '"Cormorant", serif',
      unna: '"Unna", serif',
      crimson: '"Crimson Pro", serif'
    };
    return fontFamilyMap[dropCapFont] || 'Georgia, serif';
  };

  const sanitizedHtml = useMemo(() => {
    if (!markdown) return { __html: '' };

    // First parse markdown
    let dirtyHtml = marked.parse(markdown) as string;

    // Apply drop cap if enabled
    if (enableDropCap) {
      dirtyHtml = applyDropCap(dirtyHtml);
    }

    // Then apply custom color syntax to the HTML output
    const colorParsed = parseColorSyntax(dirtyHtml);

    // Sanitize, allowing style attribute and class for colored text
    return { __html: DOMPurify.sanitize(colorParsed, {
      ADD_TAGS: ["img", "span"],
      ADD_ATTR: ['src', 'alt', 'title', 'class', 'style']
    }) };
  }, [markdown, enableDropCap]);

  return (
    <>
      <style>{`
        /* Drop cap styling */
        .drop-cap {
          float: left;
          font-size: 3.5em;
          line-height: 0.85;
          margin-right: 0.1em;
          margin-top: 0.05em;
          font-weight: 600;
          font-family: ${getDropCapFontFamily()};
          ${theme === 'light' ? 'color: #1a1a1a;' : 'color: #f0f0f0;'}
        }

        /* Base color rule */
        .story-color,
        .story-color * {
          color: var(--story-color) !important;
        }

        /* Theme-aware contrast adjustments */
        ${theme === 'light' ? `
          .story-color,
          .story-color * {
            --story-color: color-mix(in oklch, var(--story-color) 65%, black);
          }

          /* Fallback for browsers without color-mix support */
          @supports not (color: color-mix(in oklch, black 10%, white)) {
            .story-color[style*="#FFD700"],
            .story-color[style*="ffd700"] { --story-color: #b8860b; } /* darker gold */
            .story-color[style*="#808080"],
            .story-color[style*="808080"] { --story-color: #4a4a4a; } /* darker gray */
          }
        ` : `
          .story-color,
          .story-color * {
            --story-color: color-mix(in oklch, var(--story-color) 90%, white);
          }

          /* Fallback for browsers without color-mix support */
          @supports not (color: color-mix(in oklch, black 10%, white)) {
            .story-color[style*="#FFD700"],
            .story-color[style*="ffd700"] { --story-color: #ffd24d; } /* brighter gold */
          }
        `}
      `}</style>
      <div className={className} dangerouslySetInnerHTML={sanitizedHtml} />
    </>
  );
}
