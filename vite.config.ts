import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuração do Vite
export default defineConfig(({ mode }) => ({
  server: {
    // Permite acesso de qualquer host no dev server
    host: true, // permite acesso externo
    allowedHosts: ['feedtrack.site', 'localhost', '127.0.0.1'], 
    port: 5176,
  },
  plugins: [
    react(), // Plugin oficial do React com SWC
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Facilita imports usando @
    },
  },
  build: {
    target: "esnext", // Compatível com navegadores modernos
    sourcemap: mode === "development", // Sourcemaps só no dev
  },
}));
