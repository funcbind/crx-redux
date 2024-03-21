// vite.config.js
import { defineConfig } from "file:///D:/work/Projects/personal-projects/multicopy-extension/node_modules/.pnpm/vite@4.5.0_sass@1.69.5/node_modules/vite/dist/node/index.js";
import react from "file:///D:/work/Projects/personal-projects/multicopy-extension/node_modules/.pnpm/@vitejs+plugin-react@4.2.0_vite@4.5.0/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { crx } from "file:///D:/work/Projects/personal-projects/multicopy-extension/node_modules/.pnpm/@crxjs+vite-plugin@2.0.0-beta.21/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Chrome Extension Starter",
  version: "1.0.0",
  action: { default_popup: "src/popup/index.html" },
  options_page: "src/options/index.html",
  permissions: ["storage", "unlimitedStorage"],
  content_scripts: [
    {
      matches: ["*://*.gitlab.com/*"],
      js: ["src/contentScripts/allWebPages.jsx"],
      run_at: "document_end"
    }
  ],
  devtools_page: "src/devtool/devtools.html",
  background: {
    service_worker: "src/background/background.js",
    type: "module"
  }
};

// vite.config.js
var vite_config_default = defineConfig({
  plugins: [react(), crx({ manifest: manifest_default })],
  build: {
    minify: true,
    sourcemap: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHdvcmtcXFxccHJvamVjdHNcXFxccGVyc29uYWwtcHJvamVjdHNcXFxcbXVsdGljb3B5LWV4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya1xcXFxwcm9qZWN0c1xcXFxwZXJzb25hbC1wcm9qZWN0c1xcXFxtdWx0aWNvcHktZXh0ZW5zaW9uXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi93b3JrL3Byb2plY3RzL3BlcnNvbmFsLXByb2plY3RzL211bHRpY29weS1leHRlbnNpb24vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbic7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbcmVhY3QoKSwgY3J4KHsgbWFuaWZlc3QgfSldLFxuXHRcdGJ1aWxkOiB7XG5cdFx0XHRtaW5pZnk6IHRydWUsXG5cdFx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdFx0fSxcbn0pO1xuIiwgIntcblx0XCJtYW5pZmVzdF92ZXJzaW9uXCI6IDMsXG5cdFwibmFtZVwiOiBcIkNocm9tZSBFeHRlbnNpb24gU3RhcnRlclwiLFxuXHRcInZlcnNpb25cIjogXCIxLjAuMFwiLFxuXHRcImFjdGlvblwiOiB7IFwiZGVmYXVsdF9wb3B1cFwiOiBcInNyYy9wb3B1cC9pbmRleC5odG1sXCIgfSxcblx0XCJvcHRpb25zX3BhZ2VcIjogXCJzcmMvb3B0aW9ucy9pbmRleC5odG1sXCIsXG5cdFwicGVybWlzc2lvbnNcIjogW1wic3RvcmFnZVwiLCBcInVubGltaXRlZFN0b3JhZ2VcIl0sXG5cdFwiY29udGVudF9zY3JpcHRzXCI6IFtcblx0XHR7XG5cdFx0XHRcIm1hdGNoZXNcIjogW1wiKjovLyouZ2l0bGFiLmNvbS8qXCJdLFxuXHRcdFx0XCJqc1wiOiBbXCJzcmMvY29udGVudFNjcmlwdHMvYWxsV2ViUGFnZXMuanN4XCJdLFxuXHRcdFx0XCJydW5fYXRcIjogXCJkb2N1bWVudF9lbmRcIlxuXHRcdH1cblx0XSxcblx0XCJkZXZ0b29sc19wYWdlXCI6IFwic3JjL2RldnRvb2wvZGV2dG9vbHMuaHRtbFwiLFxuXHRcImJhY2tncm91bmRcIjoge1xuXHRcdFwic2VydmljZV93b3JrZXJcIjogXCJzcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzXCIsXG5cdFx0XCJ0eXBlXCI6IFwibW9kdWxlXCJcblx0fVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VixTQUFTLG9CQUFvQjtBQUMzWCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGcEI7QUFBQSxFQUNDLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFFBQVUsRUFBRSxlQUFpQix1QkFBdUI7QUFBQSxFQUNwRCxjQUFnQjtBQUFBLEVBQ2hCLGFBQWUsQ0FBQyxXQUFXLGtCQUFrQjtBQUFBLEVBQzdDLGlCQUFtQjtBQUFBLElBQ2xCO0FBQUEsTUFDQyxTQUFXLENBQUMsb0JBQW9CO0FBQUEsTUFDaEMsSUFBTSxDQUFDLG9DQUFvQztBQUFBLE1BQzNDLFFBQVU7QUFBQSxJQUNYO0FBQUEsRUFDRDtBQUFBLEVBQ0EsZUFBaUI7QUFBQSxFQUNqQixZQUFjO0FBQUEsSUFDYixnQkFBa0I7QUFBQSxJQUNsQixNQUFRO0FBQUEsRUFDVDtBQUNEOzs7QURiQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSwyQkFBUyxDQUFDLENBQUM7QUFBQSxFQUNuQyxPQUFPO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDWjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
