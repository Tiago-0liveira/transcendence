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
	watch: {
		usePolling: true,
	},
    port: 3000,
	strictPort: true,
	historyApiFallback: true,
	host: "0.0.0.0"
  }
});