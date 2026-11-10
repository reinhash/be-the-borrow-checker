import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds the whole quiz, verified compiler output included, into one self-contained dist/index.html.
export default defineConfig({
  plugins: [viteSingleFile()],
  // Everything is inlined, so there are no modules to preload and the helper would only add dead code.
  build: { target: "es2022", modulePreload: { polyfill: false } }
});
