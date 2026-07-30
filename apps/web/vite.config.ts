import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "https://api.esquinazo.io";

  return {
    plugins: [react()],

    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },

    server: {
      port: 5173,
      // The deployed API only allows the production origins, so a direct
      // browser call from localhost is blocked by CORS. Proxying /api through
      // the dev server sidesteps it without loosening the API's policy.
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },

    build: {
      target: "es2020",
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split the animation runtime out so the initial parse stays small.
          manualChunks: {
            gsap: ["gsap"],
            query: ["@tanstack/react-query"],
          },
        },
      },
    },
  };
});
