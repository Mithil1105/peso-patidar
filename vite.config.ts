import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// cacheDir outside node_modules avoids Windows EPERM (OneDrive/antivirus locks on node_modules\.vite)
export default defineConfig(({ mode }) => ({
  cacheDir: path.resolve(__dirname, ".vite"),
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3000,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js", "@tanstack/react-query"],
          ui: ["lucide-react", "sonner"],
          reporting: ["jspdf", "jspdf-autotable", "xlsx"],
        },
      },
    },
  },
}));
