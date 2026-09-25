import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment (needed for React component tests)
    environment: "jsdom",
    // Run this file before each test file — loads jest-dom matchers
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      // Mirror the @/* path alias from tsconfig.json
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
