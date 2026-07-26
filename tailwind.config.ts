import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#EEF0E8',
          alt: '#E4E7DC',
        },
        ink: {
          DEFAULT: '#1F2B22',
          soft: '#4A5A4C',
        },
        moss: {
          50: '#EAF1EA',
          100: '#D6E4D6',
          300: '#9CC0A0',
          600: '#3F6B46',
          700: '#345938',
          800: '#2A472D',
        },
        line: '#D6D9CC',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        // Grille pointillée discrète, à la manière d'un papier de carnet de terrain
        'dotted-grid':
          'radial-gradient(circle, rgba(31,43,34,0.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dotted-grid': '18px 18px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
