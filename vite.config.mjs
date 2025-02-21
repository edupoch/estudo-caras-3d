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
        materiais: resolve(__dirname, "estudos/materiais/index.html"),
        efectos: resolve(__dirname, "estudos/efectos/index.html"),
      },
    },
  },
});
