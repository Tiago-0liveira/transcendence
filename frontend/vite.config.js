import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    historyApiFallback: true, // Ensures proper handling of SPA routes
  }
});
