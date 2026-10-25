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
        darkBg: '#090d16',
        cardBg: '#0f172a',
        cardHover: '#131e36',
        cardBorder: '#1e293b',
      },
    },
  },
  plugins: [],
};

export default config;
