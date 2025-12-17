/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./admin/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'nexus-dark': '#0f172a',
        'nexus-panel': '#1e293b',
        'nexus-accent': '#06b6d4',
        'nexus-warn': '#f59e0b',
        'nexus-success': '#10b981',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              margin: '1.5rem 0',
              paddingLeft: '1rem',
              borderLeft: '3px solid rgba(128,128,128,0.4)',
              fontStyle: 'normal',
              fontWeight: 'inherit',
            },
            'blockquote p': {
              margin: '0',
              fontStyle: 'normal',
              whiteSpace: 'pre-line',
            },
            'blockquote p + p': {
              marginTop: '0.75rem',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
        // Light theme: darker text for better readability
        gray: {
          css: {
            '--tw-prose-body': '#1a1a1a',
            '--tw-prose-headings': '#000000',
            '--tw-prose-bold': '#000000',
            '--tw-prose-links': '#1d4ed8',
            '--tw-prose-counters': '#4b5563',
            '--tw-prose-bullets': '#4b5563',
            '--tw-prose-quotes': '#1f2937',
            '--tw-prose-quote-borders': '#d1d5db',
            '--tw-prose-code': '#1f2937',
            blockquote: {
              margin: '1.5rem 0',
              paddingLeft: '1rem',
              borderLeft: '3px solid rgba(0,0,0,0.25)',
              fontStyle: 'normal',
              fontWeight: 'inherit',
            },
            'blockquote p': {
              margin: '0',
              fontStyle: 'normal',
              whiteSpace: 'pre-line',
            },
            'blockquote p + p': {
              marginTop: '0.75rem',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
        invert: {
          css: {
            blockquote: {
              margin: '1.5rem 0',
              paddingLeft: '1rem',
              borderLeft: '3px solid rgba(255,255,255,0.25)',
              fontStyle: 'normal',
              fontWeight: 'inherit',
            },
            'blockquote p': {
              margin: '0',
              fontStyle: 'normal',
              whiteSpace: 'pre-line',
            },
            'blockquote p + p': {
              marginTop: '0.75rem',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
