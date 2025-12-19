/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand-color, #10b981)',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'inherit',
            a: {
              color: 'var(--brand-color, #10b981)',
              '&:hover': {
                color: 'var(--brand-color, #10b981)',
                opacity: 0.8,
              },
            },
            strong: {
              color: 'inherit',
            },
            h1: { color: 'inherit' },
            h2: { color: 'inherit' },
            h3: { color: 'inherit' },
            h4: { color: 'inherit' },
            code: {
              color: 'inherit',
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': 'rgb(229 231 235)',
            '--tw-prose-headings': 'rgb(255 255 255)',
            '--tw-prose-lead': 'rgb(209 213 219)',
            '--tw-prose-links': 'var(--brand-color, #10b981)',
            '--tw-prose-bold': 'rgb(255 255 255)',
            '--tw-prose-counters': 'rgb(209 213 219)',
            '--tw-prose-bullets': 'rgb(107 114 128)',
            '--tw-prose-hr': 'rgb(55 65 81)',
            '--tw-prose-quotes': 'rgb(243 244 246)',
            '--tw-prose-quote-borders': 'rgb(75 85 99)',
            '--tw-prose-captions': 'rgb(156 163 175)',
            '--tw-prose-code': 'rgb(255 255 255)',
            '--tw-prose-pre-code': 'rgb(229 231 235)',
            '--tw-prose-pre-bg': 'rgb(17 24 39)',
            '--tw-prose-th-borders': 'rgb(75 85 99)',
            '--tw-prose-td-borders': 'rgb(55 65 81)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
