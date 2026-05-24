import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    preact(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/sdk/index.ts'),
      name: 'LuminaAvatar',
      fileName: () => 'lumina-avatar.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
      output: {
        extend: true,
        globals: {},
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
