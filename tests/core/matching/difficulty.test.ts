import { describe, it, expect } from "vitest";
import { evaluateDifficultyComponent } from "@/core/matching/components/difficulty";
import { createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateDifficultyComponent", () => {
  it("evaluates beginner-friendly label to 1.0", () => {
    const issue = createMockDiscoveredIssue({
      labels: ["bug", "good first issue"],
    });

    const result = evaluateDifficultyComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.difficultyEstimate).toBe("beginner");
    expect(result.observedLabel).toBe("good first issue");
    expect(result.component.explanation).toContain("good first issue");
  });

  it("evaluates intermediate difficulty label to 0.8", () => {
    const issue = createMockDiscoveredIssue({
      labels: ["enhancement", "difficulty:medium"],
    });

    const result = evaluateDifficultyComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.8);
    expect(result.difficultyEstimate).toBe("intermediate");
  });

  it("evaluates advanced difficulty label to 0.6", () => {
    const issue = createMockDiscoveredIssue({
      labels: ["architecture", "level:advanced"],
    });

    const result = evaluateDifficultyComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.6);
    expect(result.difficultyEstimate).toBe("advanced");
  });

  it("strictly marks component UNAVAILABLE (null) when no explicit difficulty label is present", () => {
    const issue = createMockDiscoveredIssue({
      labels: ["bug", "documentation", "frontend"],
    });

    const result = evaluateDifficultyComponent(issue);

    // CRITICAL: Must not guess, synthesize, or invent difficulty
    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.difficultyEstimate).toBe("unknown");
    expect(result.observedLabel).toBeNull();
    expect(result.component.explanation).toContain("No explicit difficulty label was present");
  });

  it("handles empty label arrays by marking unavailable", () => {
    const issue = createMockDiscoveredIssue({
      labels: [],
    });

    const result = evaluateDifficultyComponent(issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.difficultyEstimate).toBe("unknown");
  });
});
