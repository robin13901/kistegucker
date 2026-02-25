import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#b2274b',
        surface: '#f7f7f5'
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
};

export default config;
