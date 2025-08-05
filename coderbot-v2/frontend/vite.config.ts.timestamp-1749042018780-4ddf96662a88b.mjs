// vite.config.ts
import { defineConfig } from "file:///home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/frontend/node_modules/.pnpm/vite@5.4.19_@types+node@22.15.10_sass@1.51.0_terser@5.39.0/node_modules/vite/dist/node/index.js";
import react from "file:///home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/frontend/node_modules/.pnpm/@vitejs+plugin-react-swc@3.9.0_vite@5.4.19_@types+node@22.15.10_sass@1.51.0_terser@5.39.0_/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/frontend/node_modules/.pnpm/lovable-tagger@1.1.8_ts-node@10.9.2_@swc+core@1.11.24_@types+node@22.15.10_typescript@5_ec572f52f9eedb0102eb32a95d04ca78/node_modules/lovable-tagger/dist/index.js";
import { tauri } from "file:///home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/frontend/node_modules/.pnpm/vite-plugin-tauri@4.0.0_@tauri-apps+cli@2.5.0_vite@5.4.19_@types+node@22.15.10_sass@1.51.0_terser@5.39.0_/node_modules/vite-plugin-tauri/dist/index.js";
var __vite_injected_original_dirname = "/home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  plugins: [
    react(),
    mode !== "development" && tauri(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "magicui": path.resolve(__vite_injected_original_dirname, "./src/components/magicui"),
      "magicui/*": path.resolve(__vite_injected_original_dirname, "./src/components/magicui/*")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9tZW5kZXMvRG9jdW1lbnRzL0dpdGh1Yi9DaGF0Ym90LWVkdWNhY2lvbmFsL2NvZGVyYm90LXYyL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9tZW5kZXMvRG9jdW1lbnRzL0dpdGh1Yi9DaGF0Ym90LWVkdWNhY2lvbmFsL2NvZGVyYm90LXYyL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL21lbmRlcy9Eb2N1bWVudHMvR2l0aHViL0NoYXRib3QtZWR1Y2FjaW9uYWwvY29kZXJib3QtdjIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHRhdXJpIH0gZnJvbSBcInZpdGUtcGx1Z2luLXRhdXJpXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMTI3LjAuMC4xXCIsXG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBtb2RlICE9PSAnZGV2ZWxvcG1lbnQnICYmIHRhdXJpKCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICBcIm1hZ2ljdWlcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb21wb25lbnRzL21hZ2ljdWlcIiksXG4gICAgICBcIm1hZ2ljdWkvKlwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2NvbXBvbmVudHMvbWFnaWN1aS8qXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9ZLFNBQVMsb0JBQW9CO0FBQ2phLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxhQUFhO0FBSnRCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLE1BQU07QUFBQSxJQUNoQyxTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxFQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxrQ0FBVywwQkFBMEI7QUFBQSxNQUM3RCxhQUFhLEtBQUssUUFBUSxrQ0FBVyw0QkFBNEI7QUFBQSxJQUNuRTtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
