import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const hostname = 'https://instantdentalbill.in'; // Default fallback

  return {
    plugins: [
      react(), 
      tailwindcss(),
      Sitemap({
        hostname: 'https://instantdentalbill.in',
        dynamicRoutes: [
          '/',
          '/login',
          '/signup',
          '/blog',
          '/privacy',
          '/terms',
          '/disclaimer',
          '/troubleshoot',
          '/dental-clinic-software-india',
        ],
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
