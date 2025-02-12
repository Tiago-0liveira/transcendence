import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000, // Backend runs on port 3000
    watch: {
      usePolling: true,
    },
  },
  plugins: [],
});
