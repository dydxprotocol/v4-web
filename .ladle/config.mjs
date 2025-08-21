/** @type {import('@ladle/react').UserConfig} */
export default {
  addons: {
    a11y: {
      enabled: true,
    },
  },
  stories: "src/**/*.stories.{js,jsx,ts,tsx,mdx}",
    port: 61000,
    previewPort: 8080,
  outDir: "dist",
  viteConfig: process.cwd() + "/vite.config.ts",
  // base: "./",
};
