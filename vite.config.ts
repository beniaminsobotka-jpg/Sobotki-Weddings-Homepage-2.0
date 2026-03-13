import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          lenis: ['@studio-freight/lenis'],
          icons: ['lucide-react'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
      input: {
        notFound: new URL('./404.html', import.meta.url).pathname,
        main: new URL('./index.html', import.meta.url).pathname,
        portfolio: new URL('./portfolio/index.html', import.meta.url).pathname,
        film: new URL('./film/index.html', import.meta.url).pathname,
        kontakt: new URL('./kontakt/index.html', import.meta.url).pathname,
        portraits: new URL('./portraits/index.html', import.meta.url).pathname,
        portraitsWedding: new URL('./portraits/wedding/index.html', import.meta.url).pathname,
        portraitsEvent: new URL('./portraits/event/index.html', import.meta.url).pathname,
        portraitsStationary: new URL('./portraits/stationary/index.html', import.meta.url).pathname,
      },
    },
  },
});
