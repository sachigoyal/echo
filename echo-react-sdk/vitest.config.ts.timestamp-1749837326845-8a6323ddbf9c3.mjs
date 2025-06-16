// vitest.config.ts
import { defineConfig } from "file:///Users/masonhall/work/merit-systems/echo/node_modules/.pnpm/vitest@2.1.9_@types+node@20.19.0_@vitest+ui@2.1.9_jsdom@26.1.0_msw@2.10.2_@types+node@2_306ad3f8dde85b98e6b3a2d6d2f4129c/node_modules/vitest/dist/config.js";
import react from "file:///Users/masonhall/work/merit-systems/echo/node_modules/.pnpm/@vitejs+plugin-react@4.5.2_vite@6.3.5_@types+node@20.19.0_jiti@2.4.2_terser@5.42.0_tsx@4.20.2_yaml@2.8.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vitest_config_default = defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis"
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "dist/",
        "*.config.*",
        "src/stories/"
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    testTimeout: 1e4,
    hookTimeout: 1e4
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9tYXNvbmhhbGwvd29yay9tZXJpdC1zeXN0ZW1zL2VjaG8vZWNoby1yZWFjdC1zZGtcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9tYXNvbmhhbGwvd29yay9tZXJpdC1zeXN0ZW1zL2VjaG8vZWNoby1yZWFjdC1zZGsvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbWFzb25oYWxsL3dvcmsvbWVyaXQtc3lzdGVtcy9lY2hvL2VjaG8tcmVhY3Qtc2RrL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgZGVmaW5lOiB7XG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvX190ZXN0c19fL3NldHVwLnRzJ10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJ25vZGVfbW9kdWxlcy8nLFxuICAgICAgICAnc3JjL19fdGVzdHNfXy8nLFxuICAgICAgICAnZGlzdC8nLFxuICAgICAgICAnKi5jb25maWcuKicsXG4gICAgICAgICdzcmMvc3Rvcmllcy8nLFxuICAgICAgXSxcbiAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgZ2xvYmFsOiB7XG4gICAgICAgICAgYnJhbmNoZXM6IDk1LFxuICAgICAgICAgIGZ1bmN0aW9uczogOTUsXG4gICAgICAgICAgbGluZXM6IDk1LFxuICAgICAgICAgIHN0YXRlbWVudHM6IDk1LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHRlc3RUaW1lb3V0OiAxMDAwMCxcbiAgICBob29rVGltZW91dDogMTAwMDAsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlYsU0FBUyxvQkFBb0I7QUFDeFgsT0FBTyxXQUFXO0FBRWxCLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsWUFBWSxDQUFDLDBCQUEwQjtBQUFBLElBQ3ZDLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxVQUNOLFVBQVU7QUFBQSxVQUNWLFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxVQUNQLFlBQVk7QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
