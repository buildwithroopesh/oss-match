import { describe, it, expect } from "vitest";

/**
 * Smoke test — verifies the test infrastructure is working.
 * This test has no external dependencies (no GitHub token, no network).
 */
describe("test infrastructure", () => {
  it("runs a synchronous assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("handles async assertions", async () => {
    const result = await Promise.resolve("oss-match");
    expect(result).toBe("oss-match");
  });

  it("supports array assertions", () => {
    const languages = ["TypeScript", "JavaScript", "Python"];
    expect(languages).toHaveLength(3);
    expect(languages).toContain("TypeScript");
  });
});
