import { describe, it, expect } from "vitest";
import { extractIssueSignals } from "@/core/issues/signals";
import type { GitHubIssue } from "@/core/types/github";

const mockIssue: GitHubIssue = {
  id: 501,
  number: 42,
  title: "Improve documentation for hooks",
  body: "Here is detailed context on what needs improving in the documentation.",
  state: "open",
  labels: [
    { name: "good first issue", color: "7057ff", description: "Good for newcomers" },
    { name: "documentation", color: "0075ca", description: null },
  ],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  commentsCount: 3,
  htmlUrl: "https://github.com/facebook/react/issues/42",
  repository: {
    owner: "facebook",
    name: "react",
    fullName: "facebook/react",
    description: "The library for web and native user interfaces",
    topics: ["react", "ui", "frontend"],
    primaryLanguage: "JavaScript",
    stars: 220000,
    forks: 45000,
    isArchived: false,
    htmlUrl: "https://github.com/facebook/react",
  },
};

describe("extractIssueSignals", () => {
  const referenceTime = new Date("2026-09-25T00:00:00.000Z");

  it("extracts body presence, length, and comments count accurately", () => {
    const signals = extractIssueSignals(mockIssue, referenceTime);

    expect(signals.hasBody).toBe(true);
    expect(signals.bodyLength).toBe(mockIssue.body!.length);
    expect(signals.commentsCount).toBe(3);
  });

  it("handles null or empty issue bodies", () => {
    const issueWithoutBody: GitHubIssue = {
      ...mockIssue,
      body: null,
    };
    const signalsNull = extractIssueSignals(issueWithoutBody, referenceTime);
    expect(signalsNull.hasBody).toBe(false);
    expect(signalsNull.bodyLength).toBe(0);

    const issueWithWhitespace: GitHubIssue = {
      ...mockIssue,
      body: "   \n\t  ",
    };
    const signalsWs = extractIssueSignals(issueWithWhitespace, referenceTime);
    expect(signalsWs.hasBody).toBe(false);
    expect(signalsWs.bodyLength).toBe(0);
  });

  it("identifies contributor friendly labels (good first issue, help wanted)", () => {
    const signals = extractIssueSignals(mockIssue, referenceTime);
    expect(signals.hasHelpWantedOrGoodFirstIssue).toBe(true);
    expect(signals.labelNames).toContain("good first issue");
    expect(signals.labelNames).toContain("documentation");

    const regularIssue: GitHubIssue = {
      ...mockIssue,
      labels: [{ name: "bug", color: "d73a4a" }],
    };
    const regularSignals = extractIssueSignals(regularIssue, referenceTime);
    expect(regularSignals.hasHelpWantedOrGoodFirstIssue).toBe(false);
  });

  it("computes deterministic ageInDays and daysSinceUpdated relative to injected now", () => {
    const signals = extractIssueSignals(mockIssue, referenceTime);

    // Created 2026-09-01, reference 2026-09-25 => 24 days
    expect(signals.ageInDays).toBe(24);

    // Updated 2026-09-20, reference 2026-09-25 => 5 days
    expect(signals.daysSinceUpdated).toBe(5);
  });

  it("preserves repository metadata without alteration", () => {
    const signals = extractIssueSignals(mockIssue, referenceTime);

    expect(signals.primaryLanguage).toBe("JavaScript");
    expect(signals.repositoryTopics).toEqual(["react", "ui", "frontend"]);
    expect(signals.repositoryStars).toBe(220000);
    expect(signals.repositoryForks).toBe(45000);
    expect(signals.isRepositoryArchived).toBe(false);
  });
});
