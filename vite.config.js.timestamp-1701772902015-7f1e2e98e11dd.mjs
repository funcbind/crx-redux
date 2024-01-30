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
      matches: ["*://gitlab.com/*"],
      js: ["src/contentScripts/allWebPages.jsx"],
      run_at: "document_end"
    }
  ],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHdvcmtcXFxccHJvamVjdHNcXFxccGVyc29uYWwtcHJvamVjdHNcXFxcbXVsdGljb3B5LWV4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya1xcXFxwcm9qZWN0c1xcXFxwZXJzb25hbC1wcm9qZWN0c1xcXFxtdWx0aWNvcHktZXh0ZW5zaW9uXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi93b3JrL3Byb2plY3RzL3BlcnNvbmFsLXByb2plY3RzL211bHRpY29weS1leHRlbnNpb24vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbic7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbcmVhY3QoKSwgY3J4KHsgbWFuaWZlc3QgfSldLFxuXHRidWlsZDoge1xuXHRcdG1pbmlmeTogdHJ1ZSxcblx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdH0sXG59KTtcbiIsICJ7XG5cdFwibWFuaWZlc3RfdmVyc2lvblwiOiAzLFxuXHRcIm5hbWVcIjogXCJDaHJvbWUgRXh0ZW5zaW9uIFN0YXJ0ZXJcIixcblx0XCJ2ZXJzaW9uXCI6IFwiMS4wLjBcIixcblx0XCJhY3Rpb25cIjogeyBcImRlZmF1bHRfcG9wdXBcIjogXCJzcmMvcG9wdXAvaW5kZXguaHRtbFwiIH0sXG5cdFwib3B0aW9uc19wYWdlXCI6IFwic3JjL29wdGlvbnMvaW5kZXguaHRtbFwiLFxuXHRcInBlcm1pc3Npb25zXCI6IFtcInN0b3JhZ2VcIiwgXCJ1bmxpbWl0ZWRTdG9yYWdlXCJdLFxuXHRcImNvbnRlbnRfc2NyaXB0c1wiOiBbXG5cdFx0e1xuXHRcdFx0XCJtYXRjaGVzXCI6IFtcIio6Ly9naXRsYWIuY29tLypcIl0sXG5cdFx0XHRcImpzXCI6IFtcInNyYy9jb250ZW50U2NyaXB0cy9hbGxXZWJQYWdlcy5qc3hcIl0sXG5cdFx0XHRcInJ1bl9hdFwiOiBcImRvY3VtZW50X2VuZFwiXG5cdFx0fVxuXHRdLFxuXHRcImJhY2tncm91bmRcIjoge1xuXHRcdFwic2VydmljZV93b3JrZXJcIjogXCJzcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzXCIsXG5cdFx0XCJ0eXBlXCI6IFwibW9kdWxlXCJcblx0fVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VixTQUFTLG9CQUFvQjtBQUMzWCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGcEI7QUFBQSxFQUNDLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFFBQVUsRUFBRSxlQUFpQix1QkFBdUI7QUFBQSxFQUNwRCxjQUFnQjtBQUFBLEVBQ2hCLGFBQWUsQ0FBQyxXQUFXLGtCQUFrQjtBQUFBLEVBQzdDLGlCQUFtQjtBQUFBLElBQ2xCO0FBQUEsTUFDQyxTQUFXLENBQUMsa0JBQWtCO0FBQUEsTUFDOUIsSUFBTSxDQUFDLG9DQUFvQztBQUFBLE1BQzNDLFFBQVU7QUFBQSxJQUNYO0FBQUEsRUFDRDtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ2IsZ0JBQWtCO0FBQUEsSUFDbEIsTUFBUTtBQUFBLEVBQ1Q7QUFDRDs7O0FEWkEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsMkJBQVMsQ0FBQyxDQUFDO0FBQUEsRUFDcEMsT0FBTztBQUFBLElBQ04sUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLEVBQ1o7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
