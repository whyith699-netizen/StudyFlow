// vite.config.js
import { defineConfig } from "file:///D:/SECURE/000001Studyflowproject/Extension/node_modules/vite/dist/node/index.js";
import react from "file:///D:/SECURE/000001Studyflowproject/Extension/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///D:/SECURE/000001Studyflowproject/Extension/node_modules/@crxjs/vite-plugin/dist/index.mjs";
import obfuscatorPlugin from "file:///D:/SECURE/000001Studyflowproject/Extension/node_modules/rollup-plugin-obfuscator/dist/rollup-plugin-obfuscator.js";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Study Dashboard",
  version: "1.4",
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0kiaD4zzbAlctcy9JGryFS9ISABYVsUuqWqjKwX9MZzH4e147vexQ9QPjs/fiPSt8w8WZKQKfTTqz2YQ51TYocXh4fAkSAZm5qTDm8oSMwTKLspLcmjwwzdIn654UpEX1u0DdxL1uMi0nJoRMSn+hg8lNXFiOe/E0sEalyTxstrmIgCyhM2jr8y4SpTGOzpPdS0lJjrIdNDyXqFWFqpA9bsp2l8eYhHS2ucGkDmcR0mB6YQ8MPyRFFyQO8j9mKOf/Vo0RTV+YhxDPLKpBpSDM7gFcrKxm7dBPpP9Qd2fLFm4T/+oc+c8YAyVzMAztTxKxjhnhkvGpb/HFAbGfVkUTQIDAQAB",
  description: "A comprehensive study dashboard with timer, tasks, and auto time tracking",
  icons: {
    "16": "public/assets/icons/study 16.png",
    "48": "public/assets/icons/study 48.png",
    "128": "public/assets/icons/study 128.png"
  },
  permissions: [
    "storage",
    "activeTab",
    "tabs",
    "webNavigation",
    "notifications",
    "alarms",
    "identity",
    "declarativeNetRequest"
  ],
  host_permissions: [
    "https://*.googleapis.com/*",
    "https://*.firebaseio.com/*",
    "https://*.gstatic.com/*"
  ],
  action: {
    default_popup: "index.html",
    default_title: "Study Dashboard",
    default_icon: {
      "16": "public/assets/icons/study 16.png",
      "48": "public/assets/icons/study 48.png",
      "128": "public/assets/icons/study 128.png"
    }
  },
  background: {
    service_worker: "src/background/index.js",
    type: "module"
  }
};

// vite.config.js
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        popup: "index.html"
      },
      plugins: [
        obfuscatorPlugin({
          options: {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            stringArray: true,
            stringArrayThreshold: 0.75,
            renameGlobals: false
          }
        })
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFNFQ1VSRVxcXFwwMDAwMDFTdHVkeWZsb3dwcm9qZWN0XFxcXEV4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcU0VDVVJFXFxcXDAwMDAwMVN0dWR5Zmxvd3Byb2plY3RcXFxcRXh0ZW5zaW9uXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9TRUNVUkUvMDAwMDAxU3R1ZHlmbG93cHJvamVjdC9FeHRlbnNpb24vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcclxuaW1wb3J0IG9iZnVzY2F0b3JQbHVnaW4gZnJvbSAncm9sbHVwLXBsdWdpbi1vYmZ1c2NhdG9yJ1xyXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5qc29uJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgY3J4KHsgbWFuaWZlc3QgfSksXHJcbiAgXSxcclxuICBidWlsZDoge1xyXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcclxuICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgY29tcHJlc3M6IHtcclxuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXHJcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgcG9wdXA6ICdpbmRleC5odG1sJyxcclxuICAgICAgfSxcclxuICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgIG9iZnVzY2F0b3JQbHVnaW4oe1xyXG4gICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICBjb250cm9sRmxvd0ZsYXR0ZW5pbmc6IGZhbHNlLFxyXG4gICAgICAgICAgICBkZWFkQ29kZUluamVjdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgIHN0cmluZ0FycmF5OiB0cnVlLFxyXG4gICAgICAgICAgICBzdHJpbmdBcnJheVRocmVzaG9sZDogMC43NSxcclxuICAgICAgICAgICAgcmVuYW1lR2xvYmFsczogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICBdLFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG5cclxuIiwgIntcclxuICBcIm1hbmlmZXN0X3ZlcnNpb25cIjogMyxcclxuICBcIm5hbWVcIjogXCJTdHVkeSBEYXNoYm9hcmRcIixcclxuICBcInZlcnNpb25cIjogXCIxLjRcIixcclxuICBcImtleVwiOiBcIk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMGtpYUQ0enpiQWxjdGN5OUpHcnlGUzlJU0FCWVZzVXVxV3FqS3dYOU1aekg0ZTE0N3ZleFE5UVBqcy9maVBTdDh3OFdaS1FLZlRUcXoyWVE1MVRZb2NYaDRmQWtTQVptNXFURG04b1NNd1RLTHNwTGNtand3emRJbjY1NFVwRVgxdTBEZHhMMXVNaTBuSm9STVNuK2hnOGxOWEZpT2UvRTBzRWFseVR4c3RybUlnQ3loTTJqcjh5NFNwVEdPenBQZFMwbEpqcklkTkR5WHFGV0ZxcEE5YnNwMmw4ZVloSFMydWNHa0RtY1IwbUI2WVE4TVB5UkZGeVFPOGo5bUtPZi9WbzBSVFYrWWh4RFBMS3BCcFNETTdnRmNyS3htN2RCUHBQOVFkMmZMRm00VC8rb2MrYzhZQXlWek1BenRUeEt4amhuaGt2R3BiL0hGQWJHZlZrVVRRSURBUUFCXCIsXHJcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkEgY29tcHJlaGVuc2l2ZSBzdHVkeSBkYXNoYm9hcmQgd2l0aCB0aW1lciwgdGFza3MsIGFuZCBhdXRvIHRpbWUgdHJhY2tpbmdcIixcclxuICBcImljb25zXCI6IHtcclxuICAgIFwiMTZcIjogXCJwdWJsaWMvYXNzZXRzL2ljb25zL3N0dWR5IDE2LnBuZ1wiLFxyXG4gICAgXCI0OFwiOiBcInB1YmxpYy9hc3NldHMvaWNvbnMvc3R1ZHkgNDgucG5nXCIsXHJcbiAgICBcIjEyOFwiOiBcInB1YmxpYy9hc3NldHMvaWNvbnMvc3R1ZHkgMTI4LnBuZ1wiXHJcbiAgfSxcclxuICBcInBlcm1pc3Npb25zXCI6IFtcclxuICAgIFwic3RvcmFnZVwiLFxyXG4gICAgXCJhY3RpdmVUYWJcIixcclxuICAgIFwidGFic1wiLFxyXG4gICAgXCJ3ZWJOYXZpZ2F0aW9uXCIsXHJcbiAgICBcIm5vdGlmaWNhdGlvbnNcIixcclxuICAgIFwiYWxhcm1zXCIsXHJcbiAgICBcImlkZW50aXR5XCIsXHJcbiAgICBcImRlY2xhcmF0aXZlTmV0UmVxdWVzdFwiXHJcbiAgXSxcclxuICBcImhvc3RfcGVybWlzc2lvbnNcIjogW1xyXG4gICAgXCJodHRwczovLyouZ29vZ2xlYXBpcy5jb20vKlwiLFxyXG4gICAgXCJodHRwczovLyouZmlyZWJhc2Vpby5jb20vKlwiLFxyXG4gICAgXCJodHRwczovLyouZ3N0YXRpYy5jb20vKlwiXHJcbiAgXSxcclxuICBcImFjdGlvblwiOiB7XHJcbiAgICBcImRlZmF1bHRfcG9wdXBcIjogXCJpbmRleC5odG1sXCIsXHJcbiAgICBcImRlZmF1bHRfdGl0bGVcIjogXCJTdHVkeSBEYXNoYm9hcmRcIixcclxuICAgIFwiZGVmYXVsdF9pY29uXCI6IHtcclxuICAgICAgXCIxNlwiOiBcInB1YmxpYy9hc3NldHMvaWNvbnMvc3R1ZHkgMTYucG5nXCIsXHJcbiAgICAgIFwiNDhcIjogXCJwdWJsaWMvYXNzZXRzL2ljb25zL3N0dWR5IDQ4LnBuZ1wiLFxyXG4gICAgICBcIjEyOFwiOiBcInB1YmxpYy9hc3NldHMvaWNvbnMvc3R1ZHkgMTI4LnBuZ1wiXHJcbiAgICB9XHJcbiAgfSxcclxuICBcImJhY2tncm91bmRcIjoge1xyXG4gICAgXCJzZXJ2aWNlX3dvcmtlclwiOiBcInNyYy9iYWNrZ3JvdW5kL2luZGV4LmpzXCIsXHJcbiAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxyXG4gIH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdULFNBQVMsb0JBQW9CO0FBQ3JWLE9BQU8sV0FBVztBQUNsQixTQUFTLFdBQVc7QUFDcEIsT0FBTyxzQkFBc0I7OztBQ0g3QjtBQUFBLEVBQ0Usa0JBQW9CO0FBQUEsRUFDcEIsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsS0FBTztBQUFBLEVBQ1AsYUFBZTtBQUFBLEVBQ2YsT0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGFBQWU7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGtCQUFvQjtBQUFBLElBQ2xCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUixlQUFpQjtBQUFBLElBQ2pCLGVBQWlCO0FBQUEsSUFDakIsY0FBZ0I7QUFBQSxNQUNkLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1osZ0JBQWtCO0FBQUEsSUFDbEIsTUFBUTtBQUFBLEVBQ1Y7QUFDRjs7O0FEakNBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSwyQkFBUyxDQUFDO0FBQUEsRUFDbEI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE9BQU87QUFBQSxNQUNUO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxpQkFBaUI7QUFBQSxVQUNmLFNBQVM7QUFBQSxZQUNQLFNBQVM7QUFBQSxZQUNULHVCQUF1QjtBQUFBLFlBQ3ZCLG1CQUFtQjtBQUFBLFlBQ25CLGFBQWE7QUFBQSxZQUNiLHNCQUFzQjtBQUFBLFlBQ3RCLGVBQWU7QUFBQSxVQUNqQjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
