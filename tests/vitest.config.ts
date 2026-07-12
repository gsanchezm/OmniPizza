import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 15_000,
    // These are integration tests against ONE shared, stateful backend
    // (in-memory DB, single set of test users). Running test files in
    // parallel workers lets them race on shared per-user state — e.g. a
    // login in one file resets another user's profile mid-assertion. Run
    // files sequentially so the suite is deterministic.
    fileParallelism: false,
  },
});
