import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // DB-backed integration tests share Neon tables and reset them in beforeEach.
    // Running test files in parallel would cause cross-file races (e.g. atoa-escrow
    // and atoa-runner both truncating atoa_escrow_sessions). Force serial execution.
    fileParallelism: false,
    // Discord bridge ingest test does ~330 round trips (30 days × 11 events).
    testTimeout: 30000
  }
});
