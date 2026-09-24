import { describe, it, expect } from "vitest";
import { evaluateActivityComponent } from "@/core/matching/components/activity";
import { createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateActivityComponent", () => {
  it("evaluates recently active repository (<= 30 days) to 1.0", () => {
    const issue = createMockDiscoveredIssue({
      daysSinceUpdated: 10,
      isArchived: false,
    });

    const result = evaluateActivityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.component.explanation).toContain("recently active");
  });

  it("evaluates moderately active repository (<= 90 days) to 0.7", () => {
    const issue = createMockDiscoveredIssue({
      daysSinceUpdated: 45,
      isArchived: false,
    });

    const result = evaluateActivityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.7);
    expect(result.component.explanation).toContain("moderately active");
  });

  it("evaluates periodic repository activity (<= 180 days) to 0.4", () => {
    const issue = createMockDiscoveredIssue({
      daysSinceUpdated: 120,
      isArchived: false,
    });

    const result = evaluateActivityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.4);
  });

  it("evaluates archived repository to 0.0", () => {
    const issue = createMockDiscoveredIssue({
      daysSinceUpdated: 5,
      isArchived: true,
    });

    const result = evaluateActivityComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.component.explanation).toContain("Parent repository is archived and read-only");
  });

  it("marks component unavailable if timestamp is invalid", () => {
    const issue = createMockDiscoveredIssue({
      daysSinceUpdated: -1,
    });

    const result = evaluateActivityComponent(issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
  });
});
