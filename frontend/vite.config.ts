import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

// In development Vite serves the app and proxies API/media/admin requests to
// Django, so session and CSRF cookies are first-party on localhost:5173.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // changeOrigin stays false so Django sees the Vite host, which keeps
    // links it generates (e.g. password reset emails) pointing at this server.
    proxy: Object.fromEntries(
      ["/api", "/media", "/admin", "/static"].map((path) => [path, { target: backend, changeOrigin: false }]),
    ),
  },
});
