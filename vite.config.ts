import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuração do Vite
export default defineConfig(({ mode }) => ({
  server: {
    // Permite acesso de qualquer host no dev server
    host: true,
    port: 5173, // ou outra porta que você queira
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
