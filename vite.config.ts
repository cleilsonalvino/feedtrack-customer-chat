import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // permite acesso externo
    port: 5176,
    allowedHosts: [
      "all", // libera tudo
      // ou então lista só os hosts que você quer:
      "feedtrack.site",
      "localhost",
      "127.0.0.1",
      "0ad114b79e6c.ngrok-free.app",
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    sourcemap: mode === "development",
  },
}));
