import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  plugins: [
    react(),
    // No Tauri plugin for Docker builds - it's not compatible with containerized environments
  ],
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "./src/Components"),
      "@": path.resolve(__dirname, "./src"),
      "magicui": path.resolve(__dirname, "./src/Components/magicui"),
      "magicui/*": path.resolve(__dirname, "./src/Components/magicui/*"),
    },
  },
  build: {
    outDir: "dist",
    // Ensure the build doesn't fail on warnings
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
