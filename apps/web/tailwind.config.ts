import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'huum-amber': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'huum-coral': {
          50: '#fff5f5',
          100: '#ffe0db',
          200: '#ffc2b8',
          300: '#ff9a8a',
          400: '#ff7a66',
          500: '#f45d48',
          600: '#e04432',
          700: '#bc3324',
          800: '#9b2d20',
          900: '#812a20',
        },
        'huum-warm': {
          50: '#fdf8f4',
          100: '#faeee4',
          200: '#f5dcc8',
          300: '#eec5a3',
          400: '#e4a67a',
          500: '#d98c5a',
          600: '#c9744a',
          700: '#a85d3e',
          800: '#884c37',
          900: '#6f4030',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-huum': 'linear-gradient(135deg, #f59e0b, #f45d48)',
        'gradient-huum-subtle': 'linear-gradient(135deg, #fef3c7, #ffe0db)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
