import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  base: "/estudo-caras-3d",
  assetsInclude: ["modelos/*.glb"],
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        proba: resolve(__dirname, "estudos/proba/index.html"),
        semitonos: resolve(__dirname, "estudos/semitonos/index.html"),
      },
    },
  },
});
