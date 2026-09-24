import { describe, it, expect } from "vitest";
import { evaluateTechnologyComponent } from "@/core/matching/components/technology";
import { createMockProfile, createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateTechnologyComponent", () => {
  it("evaluates exact technology match with strong evidence from structured issue labels", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["docker", "enhancement"],
      repositoryTopics: ["infrastructure"],
    });

    const result = evaluateTechnologyComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBeGreaterThan(0.6);
    expect(result.matchedTechnologies).toContain("Docker");
    expect(result.component.explanation).toContain("Docker");
  });

  it("evaluates multiple matching technologies from issue labels with bonus", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["docker", "react"],
      repositoryTopics: [],
    });

    const singleResult = evaluateTechnologyComponent(
      profile,
      createMockDiscoveredIssue({ labels: ["docker"], repositoryTopics: [] })
    );
    const multiResult = evaluateTechnologyComponent(profile, issue);

    expect(multiResult.matchedTechnologies).toHaveLength(2);
    expect(multiResult.matchedTechnologies).toContain("React");
    expect(multiResult.matchedTechnologies).toContain("Docker");
    expect(multiResult.component.score).toBeGreaterThanOrEqual(singleResult.component.score!);
  });

  it("evaluates to 0.0 when no user technologies match issue labels", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["vue", "kubernetes"],
      repositoryTopics: ["vuejs"],
    });

    const result = evaluateTechnologyComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.matchedTechnologies).toHaveLength(0);
    expect(result.component.explanation).toContain("No detected technologies");
  });

  it("marks component unavailable when issue has no labels", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: [],
      repositoryTopics: ["docker"],
    });

    const result = evaluateTechnologyComponent(profile, issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.matchedTechnologies).toHaveLength(0);
    expect(result.component.explanation).toContain("No observable technology labels found on the issue");
  });

  it("does NOT match technologies mentioned only in issue title prose", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      title: "Optimize Docker container build times and React hydration",
      labels: ["bug", "performance"],
      repositoryTopics: [],
    });

    const result = evaluateTechnologyComponent(profile, issue);

    // CRITICAL: Prose/title mentions must NOT create a technology match
    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.matchedTechnologies).toHaveLength(0);
    expect(result.component.explanation).toContain("No detected technologies in your profile matched the issue's labels");
  });

  it("does NOT read repository topics for technology matching", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({
      labels: ["bug"],
      repositoryTopics: ["docker", "react"], // topics present, but labels lack them
    });

    const result = evaluateTechnologyComponent(profile, issue);

    // Repository topics belong exclusively to the Framework/Topic component
    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.matchedTechnologies).toHaveLength(0);
  });
});
