import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Vite dev port — do not use root .env PORT (API uses 3000).
const port = Number(process.env.VITE_DEV_PORT ?? process.env.WEB_PORT ?? "5173");
const basePath = process.env.BASE_PATH ?? "/";
const startUrl = basePath === "/" ? "/" : `${basePath}/`;

/** Serve Colega about/contact at /about and /contact (not React iframe shell). */
function guestProMarketingPagesPlugin() {
  const map: Record<string, string> = {
    "/about": "/colega/about.html",
    "/contact": "/colega/contact.html",
  };
  const rewrite = (
    req: { url?: string },
    _res: unknown,
    next: () => void,
  ) => {
    const raw = req.url || "/";
    const [pathname, search = ""] = raw.split("?");
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const target = map[normalized];
    if (target) {
      req.url = target + (search ? `?${search}` : "");
    }
    next();
  };
  return {
    name: "guestpro-marketing-pages",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    guestProMarketingPagesPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true, type: "module" },
      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-192.png",
        "pwa-512.png",
      ],
      manifest: {
        name: "Guest Pro",
        short_name: "Guest Pro",
        description: "Your premium AI concierge for a seamless hotel stay.",
        theme_color: "#0A0A0A",
        background_color: "#F8F8F8",
        display: "standalone",
        orientation: "portrait",
        start_url: startUrl,
        scope: basePath === "/" ? "/" : `${basePath}/`,
        id: "guestpro-app",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        categories: ["travel", "lifestyle"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Deep links like /platform/login on installed PWA (mobile)
        navigateFallback: basePath === "/" ? "/index.html" : `${basePath}/index.html`,
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/colega(?:\/|$)/,
          /^\/about\/?$/,
          /^\/contact\/?$/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src", "assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true, deny: ["**/.*"] },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: { port, host: "0.0.0.0", allowedHosts: true },
});
