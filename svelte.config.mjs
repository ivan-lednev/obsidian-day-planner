import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    warningFilter: (warning) => !warning.code.startsWith("a11y"),
  },
};
