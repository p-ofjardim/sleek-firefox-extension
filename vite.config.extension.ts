import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "src/extension",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@sleek-types": path.resolve(rootDir, "src/@types/index"),
    },
  },
  define: {
    "process.mas": false,
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV ?? "production",
    ),
  },
  build: {
    outDir: path.resolve(rootDir, "out/extension"),
    emptyOutDir: true,
  },
});
