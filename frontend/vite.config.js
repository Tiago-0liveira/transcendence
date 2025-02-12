import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
	  '@component': path.resolve(__dirname, './src/components/'),
	  '@page': path.resolve(__dirname, './src/pages/'),
      '@types': path.resolve(__dirname, './types'),
    }
  },
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
	historyApiFallback: true,
  }
});