import { describe, it, expect } from "vitest";
import { evaluateFrameworkComponent } from "@/core/matching/components/framework";
import { evaluateTechnologyComponent } from "@/core/matching/components/technology";
import { createMockProfile, createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateFrameworkComponent", () => {
  it("evaluates matching repository topic to detected framework", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      repositoryTopics: ["react"],
    });

    const result = evaluateFrameworkComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.7);
    expect(result.matchedTopics).toContain("react");
    expect(result.component.explanation).toContain("react");
  });

  it("evaluates multiple matching framework topics to 1.0", () => {
    const profile = createMockProfile({
      technologies: [
        {
          id: "react",
          name: "React",
          category: "framework",
          evidenceLevel: "strong",
          evidenceSummary: [],
          evidence: [],
          repositoryCount: 2,
          repositories: [],
          mostRecentAt: null,
          daysSinceMostRecent: null,
        },
        {
          id: "nextjs",
          name: "Next.js",
          category: "framework",
          evidenceLevel: "strong",
          evidenceSummary: [],
          evidence: [],
          repositoryCount: 2,
          repositories: [],
          mostRecentAt: null,
          daysSinceMostRecent: null,
        },
      ],
    });
    const issue = createMockDiscoveredIssue({
      repositoryTopics: ["react", "nextjs"],
    });

    const result = evaluateFrameworkComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.matchedTopics).toHaveLength(2);
  });

  it("evaluates to 0.0 when topics do not match user frameworks", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      repositoryTopics: ["angular", "vue"],
    });

    const result = evaluateFrameworkComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.matchedTopics).toHaveLength(0);
    expect(result.component.explanation).toContain("None of the repository topics matched");
  });

  it("marks component unavailable when repository has no topics", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      repositoryTopics: [],
    });

    const result = evaluateFrameworkComponent(profile, issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.component.explanation).toContain("No repository topics are available");
  });

  it("does NOT read issue labels for framework/topic scoring", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["react", "nextjs"], // present in labels
      repositoryTopics: [], // missing in repository topics
    });

    const result = evaluateFrameworkComponent(profile, issue);

    // Framework/Topic requires structured repository topics, not issue labels
    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.matchedTopics).toHaveLength(0);
  });

  it("verifies separate structured evidence sources for the React example", () => {
    const profile = createMockProfile({
      technologies: [
        {
          id: "react",
          name: "React",
          category: "framework",
          evidenceLevel: "strong",
          evidenceSummary: ["Used in 4 repositories"],
          evidence: [],
          repositoryCount: 4,
          repositories: ["repo-1"],
          mostRecentAt: null,
          daysSinceMostRecent: null,
        },
      ],
    });

    const issue = createMockDiscoveredIssue({
      labels: ["react"],
      repositoryTopics: ["react"],
    });

    // 1. Technology component evaluates strictly from issue labels
    const techResult = evaluateTechnologyComponent(profile, issue);
    expect(techResult.component.name).toBe("technology");
    expect(techResult.component.isAvailable).toBe(true);
    expect(techResult.matchedTechnologies).toEqual(["React"]);

    // If labels did not contain 'react', technology would NOT score it from topics
    const issueWithoutLabel = createMockDiscoveredIssue({
      labels: ["bug"],
      repositoryTopics: ["react"],
    });
    const techResultNoLabel = evaluateTechnologyComponent(profile, issueWithoutLabel);
    expect(techResultNoLabel.matchedTechnologies).toHaveLength(0);

    // 2. Framework component evaluates strictly from repository topics
    const fwResult = evaluateFrameworkComponent(profile, issue);
    expect(fwResult.component.name).toBe("framework");
    expect(fwResult.component.isAvailable).toBe(true);
    expect(fwResult.matchedTopics).toEqual(["react"]);

    // If repository topics did not contain 'react', framework would NOT score it from labels
    const issueWithoutTopic = createMockDiscoveredIssue({
      labels: ["react"],
      repositoryTopics: ["tooling"],
    });
    const fwResultNoTopic = evaluateFrameworkComponent(profile, issueWithoutTopic);
    expect(fwResultNoTopic.matchedTopics).toHaveLength(0);
  });
});
