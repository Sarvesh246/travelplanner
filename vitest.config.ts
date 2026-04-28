import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/prisma.ts",
        "src/lib/supabase/**",
        "src/lib/email/**",
        "src/lib/osm/**",
        "src/lib/auth/**",
        "src/lib/serialize/**",
        "src/lib/trip-layout-data.ts",
        "src/lib/store/**",
      ],
    },
  },
});
