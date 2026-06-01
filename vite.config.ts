import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RsvpReader',
      formats: ['iife', 'es'],
      fileName: (format) => format === 'iife' ? 'rsvp-reader.iife.js' : 'rsvp-reader.js',
    },
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, drop_console: true, drop_debugger: true },
      format: { comments: false },
    },
    target: 'es2020',
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  server: {
    port: 5173,
    open: '/index.html',
  },
});
