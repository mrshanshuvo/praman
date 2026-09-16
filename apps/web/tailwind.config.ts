import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-cyan': 'var(--brand-cyan, #08D9D6)',
        'brand-pink': 'var(--brand-pink, #FF2E63)',
        'brand-dark': 'var(--brand-dark, #252A34)',
        'brand-light': 'var(--brand-light, #EAEAEA)',
        brand: {
          cyan: 'var(--brand-cyan, #08D9D6)',
          pink: 'var(--brand-pink, #FF2E63)',
          dark: 'var(--brand-dark, #252A34)',
          light: 'var(--brand-light, #EAEAEA)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
