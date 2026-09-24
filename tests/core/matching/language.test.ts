import { describe, it, expect } from "vitest";
import { evaluateLanguageComponent } from "@/core/matching/components/language";
import { createMockProfile, createMockDiscoveredIssue } from "./testHelpers";

describe("evaluateLanguageComponent", () => {
  it("evaluates dominant language (>= 50% code volume) to 1.0", () => {
    const profile = createMockProfile({
      languageFootprint: [
        { language: "TypeScript", bytes: 60000, percentage: 60, rawPercentage: 60, color: "#3178C6" },
        { language: "Python", bytes: 40000, percentage: 40, rawPercentage: 40, color: "#3572A5" },
      ],
    });
    const issue = createMockDiscoveredIssue({ primaryLanguage: "TypeScript" });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
    expect(result.matchedLanguages).toHaveLength(1);
    expect(result.matchedLanguages[0].language).toBe("TypeScript");
    expect(result.matchedLanguages[0].userPercentage).toBe(60);
    expect(result.component.explanation).toContain("60% of your analyzed code volume");
  });

  it("evaluates moderate language (20% - 49%) to 0.8", () => {
    const profile = createMockProfile({
      languageFootprint: [
        { language: "TypeScript", bytes: 70000, percentage: 70, rawPercentage: 70, color: "#3178C6" },
        { language: "Python", bytes: 30000, percentage: 30, rawPercentage: 30, color: "#3572A5" },
      ],
    });
    const issue = createMockDiscoveredIssue({ primaryLanguage: "Python" });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.8);
    expect(result.matchedLanguages[0].language).toBe("Python");
  });

  it("evaluates minor language (< 20%) correctly", () => {
    const profile = createMockProfile({
      languageFootprint: [
        { language: "TypeScript", bytes: 90000, percentage: 90, rawPercentage: 90, color: "#3178C6" },
        { language: "Go", bytes: 10000, percentage: 10, rawPercentage: 10, color: "#00ADD8" },
      ],
    });
    const issue = createMockDiscoveredIssue({ primaryLanguage: "Go" });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.6);
  });

  it("evaluates to 0.0 when issue language is not in user footprint", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({ primaryLanguage: "Rust" });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(0.0);
    expect(result.matchedLanguages).toHaveLength(0);
    expect(result.component.explanation).toContain("was not observed in your analyzed public repositories");
  });

  it("marks component unavailable when repository has no primary language", () => {
    const profile = createMockProfile();
    const issue = createMockDiscoveredIssue({ primaryLanguage: null });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(false);
    expect(result.component.score).toBeNull();
    expect(result.component.explanation).toContain("Repository primary language is not available");
  });

  it("matches case-insensitively", () => {
    const profile = createMockProfile({
      languageFootprint: [
        { language: "TypeScript", bytes: 100000, percentage: 100, rawPercentage: 100, color: "#3178C6" },
      ],
    });
    const issue = createMockDiscoveredIssue({ primaryLanguage: "typescript" });

    const result = evaluateLanguageComponent(profile, issue);

    expect(result.component.isAvailable).toBe(true);
    expect(result.component.score).toBe(1.0);
  });
});
