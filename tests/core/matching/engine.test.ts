import { describe, it, expect } from "vitest";
import { matchIssue, matchIssues } from "@/core/matching/engine";
import { createMockProfile, createMockDiscoveredIssue } from "./testHelpers";

describe("Matching Engine", () => {
  const referenceNow = new Date("2026-09-24T00:00:00Z");

  it("scores an individual issue with complete component breakdown and explanation", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      primaryLanguage: "TypeScript",
      labels: ["docker", "good first issue"],
      repositoryTopics: ["react"],
      daysSinceUpdated: 4,
    });

    const match = matchIssue(profile, issue, { now: referenceNow });

    expect(match.score).toBeGreaterThan(70);
    expect(match.components.technology.score).toBeGreaterThan(0);
    expect(match.components.language.score).toBe(1.0);
    expect(match.components.framework.score).toBe(0.7);
    expect(match.components.difficulty.isAvailable).toBe(true);
    expect(match.components.difficulty.score).toBe(1.0);

    expect(match.explanation.matchedTechnologies).toContain("Docker");
    expect(match.explanation.matchedLanguages[0].language).toBe("TypeScript");
    expect(match.explanation.matchedTopics).toContain("react");
    expect(match.explanation.reasons.length).toBeGreaterThan(0);
  });

  it("handles candidate issues with no matching technologies or languages (evaluates to low score honestly)", () => {
    const profile = createMockProfile({
      technologies: [],
      languageFootprint: [
        { language: "Ruby", bytes: 50000, percentage: 100, rawPercentage: 100, color: "#701516" },
      ],
    });
    const issue = createMockDiscoveredIssue({
      primaryLanguage: "Go",
      labels: ["backend"],
      repositoryTopics: ["networking"],
    });

    const match = matchIssue(profile, issue, { now: referenceNow });

    // Technology = 0, Language = 0, Framework = 0
    expect(match.components.technology.score).toBe(0.0);
    expect(match.components.language.score).toBe(0.0);
    expect(match.components.framework.score).toBe(0.0);
    expect(match.score).toBeLessThan(40);
  });

  it("omits difficulty from denominator when no explicit difficulty label is present", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["bug", "documentation"],
    });

    const match = matchIssue(profile, issue, { now: referenceNow });

    expect(match.components.difficulty.isAvailable).toBe(false);
    expect(match.components.difficulty.score).toBeNull();
    expect(match.components.difficulty.effectiveWeight).toBe(0);
    expect(match.explanation.unavailableComponents).toContain("difficulty");

    // Other components must sum to 1.0 in effective weights
    const totalEffective = Object.values(match.components).reduce(
      (acc, c) => acc + c.effectiveWeight,
      0
    );
    expect(Math.abs(totalEffective - 1.0)).toBeLessThan(0.001);
  });

  it("sorts multiple issues deterministically by score descending", () => {
    const profile = createMockProfile();

    // High match: TypeScript + React + Good First Issue
    const highMatch = createMockDiscoveredIssue({
      id: 1,
      primaryLanguage: "TypeScript",
      labels: ["docker", "good first issue"],
      repositoryTopics: ["react"],
      daysSinceUpdated: 2,
    });

    // Medium match: TypeScript + No Tech match
    const mediumMatch = createMockDiscoveredIssue({
      id: 2,
      primaryLanguage: "TypeScript",
      labels: ["documentation"],
      repositoryTopics: [],
      daysSinceUpdated: 5,
    });

    // Low match: Go + No Tech match
    const lowMatch = createMockDiscoveredIssue({
      id: 3,
      primaryLanguage: "Go",
      labels: ["bug"],
      repositoryTopics: [],
      daysSinceUpdated: 50,
    });

    const result = matchIssues(profile, [lowMatch, highMatch, mediumMatch], {
      now: referenceNow,
    });

    expect(result.matches).toHaveLength(3);
    expect(result.matches[0].issue.id).toBe(1);
    expect(result.matches[1].issue.id).toBe(2);
    expect(result.matches[2].issue.id).toBe(3);
    expect(result.matches[0].score).toBeGreaterThan(result.matches[1].score);
    expect(result.matches[1].score).toBeGreaterThan(result.matches[2].score);
  });

  it("applies secondary tie-breaker (daysSinceUpdated ascending) when scores are equal", () => {
    const profile = createMockProfile();

    const olderIssue = createMockDiscoveredIssue({
      id: 10,
      primaryLanguage: "TypeScript",
      labels: ["help wanted"],
      repositoryTopics: [],
      daysSinceUpdated: 5,
    });

    const fresherIssue = createMockDiscoveredIssue({
      id: 20,
      primaryLanguage: "TypeScript",
      labels: ["help wanted"],
      repositoryTopics: [],
      daysSinceUpdated: 2,
    });

    const result = matchIssues(profile, [olderIssue, fresherIssue], {
      now: referenceNow,
    });

    expect(result.matches[0].score).toBe(result.matches[1].score);
    expect(result.matches[0].issue.id).toBe(20); // Fresher first (2 days vs 5 days)
    expect(result.matches[1].issue.id).toBe(10);
  });

  it("applies tertiary stable tie-breaker (issue.id ascending) when scores and recency are equal", () => {
    const profile = createMockProfile();

    const issueA = createMockDiscoveredIssue({
      id: 500,
      primaryLanguage: "TypeScript",
      labels: ["help wanted"],
      repositoryTopics: [],
      daysSinceUpdated: 5,
    });

    const issueB = createMockDiscoveredIssue({
      id: 200,
      primaryLanguage: "TypeScript",
      labels: ["help wanted"],
      repositoryTopics: [],
      daysSinceUpdated: 5,
    });

    const result = matchIssues(profile, [issueA, issueB], {
      now: referenceNow,
    });

    expect(result.matches[0].score).toBe(result.matches[1].score);
    expect(result.matches[0].issue.id).toBe(200); // Smaller ID first
    expect(result.matches[1].issue.id).toBe(500);
  });

  it("accepts raw GitHubIssue instances and extracts signals automatically", () => {
    const profile = createMockProfile();
    const discovered = createMockDiscoveredIssue({ id: 99 });
    const rawIssue = discovered.issue;

    const result = matchIssues(profile, [rawIssue], { now: referenceNow });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].issue.id).toBe(99);
    expect(result.matches[0].signals.hasBody).toBe(true);
  });

  it("filters matches by minScore threshold", () => {
    const profile = createMockProfile();
    const high = createMockDiscoveredIssue({
      id: 1,
      primaryLanguage: "TypeScript",
      labels: ["docker"],
    });
    const low = createMockDiscoveredIssue({
      id: 2,
      primaryLanguage: "C++",
      labels: [],
      repositoryTopics: [],
    });

    const result = matchIssues(profile, [high, low], {
      now: referenceNow,
      minScore: 50,
    });

    expect(result.matches.every((m) => m.score >= 50)).toBe(true);
  });

  it("ensures data honesty: explanations never assert subjective expertise or personal skill", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      primaryLanguage: "TypeScript",
      labels: ["react", "good first issue"],
      repositoryTopics: ["react"],
    });

    const match = matchIssue(profile, issue, { now: referenceNow });
    const combinedText = [
      ...match.explanation.reasons,
      ...match.explanation.suitabilityHighlights,
      match.explanation.activitySummary,
      ...Object.values(match.components).map((c) => c.explanation),
    ].join(" ").toLowerCase();

    // Must NOT contain subjective claims
    expect(combinedText).not.toContain("expert");
    expect(combinedText).not.toContain("skilled");
    expect(combinedText).not.toContain("master");
    expect(combinedText).not.toContain("easy for you");
  });

  it("is purely deterministic across multiple executions with identical inputs", () => {
    const profile = createMockProfile();
    const candidates = [
      createMockDiscoveredIssue({ id: 1 }),
      createMockDiscoveredIssue({ id: 2 }),
      createMockDiscoveredIssue({ id: 3 }),
    ];

    const run1 = matchIssues(profile, candidates, { now: referenceNow });
    const run2 = matchIssues(profile, candidates, { now: referenceNow });

    expect(run1).toEqual(run2);
  });
});
