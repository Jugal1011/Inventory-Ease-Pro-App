import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the frontend proxies /api to the Express server,
// so cookies are same-site and no CORS setup is needed locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_PROXY || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
