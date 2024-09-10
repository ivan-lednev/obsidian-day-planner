import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { isNotVoid } from "typed-assert";
import replace from "vite-plugin-filter-replace";
import fs from "node:fs";

export default defineConfig({
  plugins: [
    replace([
      {
        filter: /release-notes\.ts|main\.ts|README\.md|CHANGELOG\.md/,
        replace: [
          {
            from: "changelogMd",
            to: JSON.stringify(fs.readFileSync("./CHANGELOG.md", "utf-8")),
          },
          {
            from: "currentPluginVersion",
            to: JSON.stringify(
              JSON.parse(fs.readFileSync("./package.json", "utf-8")).version,
            ),
          },
          {
            from: "supportBanner",
            to: JSON.stringify(fs.readFileSync("./support-banner.md", "utf-8")),
          }
        ],
      },
    ]),
    svelte({
      compilerOptions: {
        dev: true,
      },
    }),
  ],
  mode: "development",
  css: {
    preprocessorOptions: {
      scss: { includePaths: ["node_modules"] },
    },
  },
  build: {
    watch: { include: "src/**/*" },
    lib: {
      entry: ["src/main.ts", "src/styles.scss"],
      name: "main",
      fileName: () => "main.js",
      formats: ["cjs" as const],
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

          isNotVoid(assetInfo.name);

          return assetInfo.name;
        },
      },
      external: ["obsidian", "electron"],
    },
  },
});
