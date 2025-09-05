import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // permite acesso externo (0.0.0.0)
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    // Otimizações de desenvolvimento
    hmr: {
      overlay: true
    },
    // Cache de dependências
    fs: {
      strict: true
    }
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "magicui": path.resolve(__dirname, "./src/Components/magicui"),
      "magicui/*": path.resolve(__dirname, "./src/Components/magicui/*"),
    },
  },
  // Otimizações de build
  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor cache
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Otimizar chunks
    chunkSizeWarningLimit: 1000,
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Configurações de CSS
  css: {
    devSourcemap: true,
  },
}));
