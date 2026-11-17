// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://richard-va.vercel.app",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "auto" },
});
