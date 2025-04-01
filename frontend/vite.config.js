import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [
	tailwindcss(),
  ],
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
	host: "0.0.0.0",
	headers: {
		"Cross-Origin-Opener-Policy": "same-origin-allow-popups"
	}
  }
});