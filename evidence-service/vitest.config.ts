import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // API scenario tests mutate process-global singletons (_setStoreForTest, _setWorkerForTest)
    // and must run sequentially. Unit tests are safe to parallelize.
    fileParallelism: false,
  },
});
