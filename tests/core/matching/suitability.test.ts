import { describe, it, expect } from "vitest";
import { evaluateSuitabilityComponent } from "@/core/matching/components/suitability";
import { createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateSuitabilityComponent", () => {
  it("scores highly for well-described open issue with contributor label and low contention", () => {
    const longBody = "A".repeat(350);
    const issue = createMockDiscoveredIssue({
      body: longBody,
      commentsCount: 2,
      labels: ["help wanted"],
    });

    const result = evaluateSuitabilityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.highlights).toContain("Descriptive issue body (350 characters)");
    expect(result.highlights).toContain("2 comments (low contention)");
  });

  it("penalizes issues with empty or missing body", () => {
    const issue = createMockDiscoveredIssue({
      body: "",
      commentsCount: 0,
      labels: [],
    });

    const result = evaluateSuitabilityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBeLessThan(0.4);
    expect(result.highlights).toContain("No issue body description provided");
  });

  it("evaluates closed issue to 0.0", () => {
    const issue = createMockDiscoveredIssue({
      state: "closed",
    });

    const result = evaluateSuitabilityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.component.explanation).toContain("Issue is closed");
  });

  it("handles high comment volume", () => {
    const issue = createMockDiscoveredIssue({
      body: "Some description here",
      commentsCount: 25,
      labels: [],
    });

    const result = evaluateSuitabilityComponent(issue);

    expect(result.highlights).toContain("25 comments (high contention)");
  });
});
