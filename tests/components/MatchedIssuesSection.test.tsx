import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MatchedIssuesSection from "@/components/recommendations/MatchedIssuesSection";
import type { MatchingResult, IssueMatch } from "@/core/types/matching";
import type { DiscoveryMetadata } from "@/core/types/issues";

function createMockMatch(id: number, score: number, lang: string, friendly: boolean): IssueMatch {
  return {
    issue: {
      id,
      number: id,
      title: `Issue number ${id} in ${lang}`,
      body: "Issue description",
      state: "open",
      htmlUrl: `https://github.com/org/repo/issues/${id}`,
      createdAt: "2026-09-20T00:00:00Z",
      updatedAt: "2026-09-24T00:00:00Z",
      commentsCount: 2,
      labels: friendly ? [{ name: "good first issue", color: "128A0C", description: null }] : [],
      repository: {
        owner: "org",
        name: "repo",
        fullName: "org/repo",
        description: "Test repository",
        htmlUrl: "https://github.com/org/repo",
        primaryLanguage: lang,
        topics: [],
        stars: 50,
        forks: 5,
        isArchived: false,
      },
    },
    signals: {
      hasBody: true,
      bodyLength: 20,
      labelNames: friendly ? ["good first issue"] : [],
      hasHelpWantedOrGoodFirstIssue: friendly,
      commentsCount: 2,
      daysSinceUpdated: 1,
      ageInDays: 4,
      primaryLanguage: lang,
      repositoryTopics: [],
      repositoryStars: 50,
      repositoryForks: 5,
      isRepositoryArchived: false,
      createdAt: "2026-09-20T00:00:00Z",
      updatedAt: "2026-09-24T00:00:00Z",
    },
    score,
    components: {
      technology: { name: "technology", baseWeight: 0.35, effectiveWeight: 0.35, score: 0, isAvailable: false, explanation: "None" },
      language: { name: "language", baseWeight: 0.20, effectiveWeight: 0.20, score: score / 100, isAvailable: true, explanation: "Matches language" },
      framework: { name: "framework", baseWeight: 0.15, effectiveWeight: 0.15, score: 0, isAvailable: false, explanation: "None" },
      suitability: { name: "suitability", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.5, isAvailable: true, explanation: "Moderate" },
      activity: { name: "activity", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.5, isAvailable: true, explanation: "Moderate" },
      freshness: { name: "freshness", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.5, isAvailable: true, explanation: "Moderate" },
      difficulty: { name: "difficulty", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.5, isAvailable: true, explanation: "Moderate" },
    },
    explanation: {
      matchedTechnologies: [],
      matchedLanguages: [{ language: lang, userPercentage: 50 }],
      matchedTopics: [],
      suitabilityHighlights: [],
      activitySummary: "Moderate",
      unavailableComponents: [],
      reasons: [`Primary language matches ${lang}`],
      gaps: [],
    },
  };
}

const mockDiscovery: DiscoveryMetadata = {
  searchedAt: "2026-09-25T00:00:00Z",
  query: "is:issue",
  totalAvailableCount: 3,
  returnedCount: 3,
  pagesFetched: 1,
  hasMore: false,
  status: "complete",
  warnings: [],
};

describe("MatchedIssuesSection component", () => {
  it("renders section heading, description, and list of issues", () => {
    const recommendations: MatchingResult = {
      matches: [
        createMockMatch(1, 90.0, "TypeScript", true),
        createMockMatch(2, 70.0, "Python", false),
        createMockMatch(3, 40.0, "Go", true),
      ],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 3,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 3,
        matchedIssuesCount: 3,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={recommendations}
        discovery={mockDiscovery}
      />
    );

    expect(screen.getByText("Matched open-source issues")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 issues")).toBeInTheDocument();
    expect(screen.getByText("Issue number 1 in TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Issue number 2 in Python")).toBeInTheDocument();
    expect(screen.getByText("Issue number 3 in Go")).toBeInTheDocument();
  });

  it("filters by language without altering deterministic order", () => {
    const recommendations: MatchingResult = {
      matches: [
        createMockMatch(1, 90.0, "TypeScript", true),
        createMockMatch(2, 70.0, "Python", false),
        createMockMatch(3, 60.0, "TypeScript", false),
      ],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 3,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 3,
        matchedIssuesCount: 3,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={recommendations}
        discovery={mockDiscovery}
      />
    );

    // Filter by TypeScript
    const select = screen.getByLabelText("Language:");
    fireEvent.change(select, { target: { value: "TypeScript" } });

    expect(screen.getByText("Showing 2 of 3 issues")).toBeInTheDocument();
    expect(screen.getByText("Issue number 1 in TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Issue number 3 in TypeScript")).toBeInTheDocument();
    expect(screen.queryByText("Issue number 2 in Python")).not.toBeInTheDocument();
  });

  it("filters by contributor-friendly label", () => {
    const recommendations: MatchingResult = {
      matches: [
        createMockMatch(1, 90.0, "TypeScript", true),
        createMockMatch(2, 70.0, "Python", false),
      ],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 2,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 2,
        matchedIssuesCount: 2,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={recommendations}
        discovery={mockDiscovery}
      />
    );

    const checkbox = screen.getByLabelText("Good first issue / help wanted only");
    fireEvent.click(checkbox);

    expect(screen.getByText("Showing 1 of 2 issues")).toBeInTheDocument();
    expect(screen.getByText("Issue number 1 in TypeScript")).toBeInTheDocument();
    expect(screen.queryByText("Issue number 2 in Python")).not.toBeInTheDocument();
  });

  it("filters by minimum score threshold", () => {
    const recommendations: MatchingResult = {
      matches: [
        createMockMatch(1, 80.0, "TypeScript", true),
        createMockMatch(2, 60.0, "Python", false),
        createMockMatch(3, 40.0, "Go", true),
      ],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 3,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 3,
        matchedIssuesCount: 3,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={recommendations}
        discovery={mockDiscovery}
      />
    );

    const scoreSelect = screen.getByLabelText("Score:");
    fireEvent.change(scoreSelect, { target: { value: "75" } });

    expect(screen.getByText("Showing 1 of 3 issues")).toBeInTheDocument();
    expect(screen.getByText("Issue number 1 in TypeScript")).toBeInTheDocument();
    expect(screen.queryByText("Issue number 2 in Python")).not.toBeInTheDocument();
    expect(screen.queryByText("Issue number 3 in Go")).not.toBeInTheDocument();
  });

  it("shows filter empty state with reset button when no items match active filters", () => {
    const recommendations: MatchingResult = {
      matches: [createMockMatch(1, 40.0, "Go", false)],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 1,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 1,
        matchedIssuesCount: 1,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={recommendations}
        discovery={mockDiscovery}
      />
    );

    // Require 75+ score on a 40.0 match
    const scoreSelect = screen.getByLabelText("Score:");
    fireEvent.change(scoreSelect, { target: { value: "75" } });

    expect(screen.getByText("No issues match the selected filters")).toBeInTheDocument();
    expect(screen.getByText("Showing 0 of 1 issue")).toBeInTheDocument();

    // Reset filters
    const resetBtn = screen.getByRole("button", { name: "Clear active filters" });
    fireEvent.click(resetBtn);

    expect(screen.getByText("Showing 1 of 1 issue")).toBeInTheDocument();
    expect(screen.getByText("Issue number 1 in Go")).toBeInTheDocument();
  });

  it("renders empty state when recommendations list is completely empty", () => {
    const emptyRecommendations: MatchingResult = {
      matches: [],
      profile: {
        userId: "dev",
        analyzedAt: "2026-09-25T00:00:00Z",
        repositoriesAnalyzed: 0,
        technologies: [],
        languageFootprint: [],
      },
      metadata: {
        matchedAt: "2026-09-25T00:00:00Z",
        totalCandidateIssues: 0,
        matchedIssuesCount: 0,
        referenceNow: "2026-09-25T00:00:00Z",
      },
    };

    render(
      <MatchedIssuesSection
        recommendations={emptyRecommendations}
        discovery={mockDiscovery}
      />
    );

    expect(screen.getByText("No open issues currently available")).toBeInTheDocument();
    expect(screen.queryByLabelText("Filter recommendations")).not.toBeInTheDocument();
  });
});
