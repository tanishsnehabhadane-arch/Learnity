import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_ACCESS_SECRET: "test-access-secret-0123456789abcdef",
      JWT_REFRESH_SECRET: "test-refresh-secret-0123456789abcdef",
    },
  },
});
