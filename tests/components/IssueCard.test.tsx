import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import IssueCard from "@/components/recommendations/IssueCard";
import type { IssueMatch } from "@/core/types/matching";

const mockMatch: IssueMatch = {
  issue: {
    id: 999,
    number: 42,
    title: "Implement zero-config caching adapter",
    body: "We need an adapter that supports pluggable caches.",
    state: "open",
    htmlUrl: "https://github.com/facebook/react/issues/42",
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    commentsCount: 5,
    labels: [
      { name: "good first issue", color: "128A0C", description: "Good for newcomers" },
      { name: "react", color: "61DAFB", description: "React related" },
    ],
    repository: {
      owner: "facebook",
      name: "react",
      fullName: "facebook/react",
      description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      htmlUrl: "https://github.com/facebook/react",
      primaryLanguage: "TypeScript",
      topics: ["ui", "framework", "frontend"],
      stars: 220000,
      forks: 45000,
      isArchived: false,
    },
  },
  signals: {
    hasBody: true,
    bodyLength: 52,
    labelNames: ["good first issue", "react"],
    hasHelpWantedOrGoodFirstIssue: true,
    commentsCount: 5,
    daysSinceUpdated: 1,
    ageInDays: 4,
    primaryLanguage: "TypeScript",
    repositoryTopics: ["ui", "framework", "frontend"],
    repositoryStars: 220000,
    repositoryForks: 45000,
    isRepositoryArchived: false,
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
  },
  score: 87.4,
  components: {
    technology: { name: "technology", baseWeight: 0.35, effectiveWeight: 0.35, score: 1.0, isAvailable: true, explanation: "Matches technology" },
    language: { name: "language", baseWeight: 0.20, effectiveWeight: 0.20, score: 0.8, isAvailable: true, explanation: "Matches language" },
    framework: { name: "framework", baseWeight: 0.15, effectiveWeight: 0.15, score: 0.7, isAvailable: true, explanation: "Matches framework" },
    suitability: { name: "suitability", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.9, isAvailable: true, explanation: "Good suitability" },
    activity: { name: "activity", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.6, isAvailable: true, explanation: "Active repository" },
    freshness: { name: "freshness", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.8, isAvailable: true, explanation: "Fresh issue" },
    difficulty: { name: "difficulty", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.4, isAvailable: true, explanation: "Friendly label" },
  },
  explanation: {
    matchedTechnologies: ["react"],
    matchedLanguages: [{ language: "TypeScript", userPercentage: 75 }],
    matchedTopics: ["ui", "framework"],
    suitabilityHighlights: [],
    activitySummary: "Active repository",
    unavailableComponents: [],
    reasons: [
      "Issue label matches detected technology: react.",
      "Repository primary language (TypeScript) represents 75% of your analyzed code volume.",
    ],
    gaps: [],
  },
};

describe("IssueCard component", () => {
  it("renders repository, issue number, title, and match score", () => {
    render(<IssueCard match={mockMatch} />);

    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("Implement zero-config caching adapter")).toBeInTheDocument();
    expect(screen.getByText("Match score")).toBeInTheDocument();
    expect(screen.getByText("87.4")).toBeInTheDocument();
  });

  it("renders observable evidence badges with strict terminology", () => {
    render(<IssueCard match={mockMatch} />);

    // Technology badge
    expect(screen.getByText("react")).toBeInTheDocument();

    // Language badge with exact '% of analyzed code' phrasing
    expect(screen.getByText("TypeScript (75% of analyzed code)")).toBeInTheDocument();

    // Topics badges
    expect(screen.getByText("#ui")).toBeInTheDocument();
    expect(screen.getByText("#framework")).toBeInTheDocument();

    // Contributor friendly invitation badge
    expect(screen.getByText("Contributor friendly")).toBeInTheDocument();
  });

  it("renders factual reasons from matching engine explainer", () => {
    render(<IssueCard match={mockMatch} />);

    expect(
      screen.getByText("Issue label matches detected technology: react.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Repository primary language (TypeScript) represents 75% of your analyzed code volume."
      )
    ).toBeInTheDocument();
  });

  it("renders unavailable components notice when component is omitted", () => {
    const matchWithUnavailable: IssueMatch = {
      ...mockMatch,
      explanation: {
        ...mockMatch.explanation,
        unavailableComponents: ["framework"],
      },
    };

    render(<IssueCard match={matchWithUnavailable} />);

    expect(
      screen.getByText(/framework omitted from score calculation/)
    ).toBeInTheDocument();
  });

  it("renders metadata and secure external links to GitHub", () => {
    render(<IssueCard match={mockMatch} />);

    expect(screen.getByText("5 comments")).toBeInTheDocument();
    expect(screen.getByText("Updated 1 day ago")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: /View issue #42 on GitHub/,
    });
    expect(link).toHaveAttribute("href", "https://github.com/facebook/react/issues/42");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
