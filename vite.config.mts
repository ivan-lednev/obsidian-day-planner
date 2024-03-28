import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte({
    compilerOptions: { 
      dev: true
    }
  })],
  mode: "development",
  css: {
    preprocessorOptions: {
      scss: {}
    }
  },
  build: {
    watch: { include: "src/**/*" },
    lib: {
      entry: ["src/main.ts", "src/styles.scss"],
      name: "main",
      fileName: () => "main.js",
      formats: ["cjs" as const]
    },
    minify: false,
    outDir: ".",
    rollupOptions: {
      output: {
        exports: "named" as const,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "styles.css";
          }

          return assetInfo.name;
        }
      },
      external: ["obsidian", "electron"]
    }
  }
});
