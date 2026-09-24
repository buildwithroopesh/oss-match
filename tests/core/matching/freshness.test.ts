import { describe, it, expect } from "vitest";
import { evaluateFreshnessComponent } from "@/core/matching/components/freshness";
import { createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateFreshnessComponent", () => {
  it("evaluates freshly updated issue (<= 7 days) to 1.0", () => {
    const issue = createMockDiscoveredIssue({ daysSinceUpdated: 3 });
    const result = evaluateFreshnessComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.component.explanation).toContain("updated 3 days ago");
  });

  it("evaluates issue updated within 1 month to 0.8", () => {
    const issue = createMockDiscoveredIssue({ daysSinceUpdated: 20 });
    const result = evaluateFreshnessComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.8);
  });

  it("evaluates issue updated within 2 months to 0.6", () => {
    const issue = createMockDiscoveredIssue({ daysSinceUpdated: 45 });
    const result = evaluateFreshnessComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.6);
  });

  it("evaluates stale issue (> 1 year) to 0.05", () => {
    const issue = createMockDiscoveredIssue({ daysSinceUpdated: 400 });
    const result = evaluateFreshnessComponent(issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.05);
    expect(result.component.explanation).toContain("over a year ago");
  });

  it("marks component unavailable if timestamp is invalid", () => {
    const issue = createMockDiscoveredIssue({ daysSinceUpdated: -1 });
    const result = evaluateFreshnessComponent(issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
  });
});
