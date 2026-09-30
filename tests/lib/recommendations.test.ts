import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfileAndRecommendations } from "@/lib/recommendations";
import * as pipelineModule from "@/core/pipeline";
import * as discoveryModule from "@/core/issues/discover";
import * as matchingModule from "@/core/matching/engine";
import { PipelineUserNotFoundError } from "@/core/pipeline/errors";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";
import type { IssueDiscoveryResult } from "@/core/types/issues";
import type { MatchingResult } from "@/core/types/matching";

vi.mock("@/core/pipeline", () => ({
  analyzeProfile: vi.fn(),
}));

vi.mock("@/core/issues/discover", () => ({
  discoverIssues: vi.fn(),
}));

vi.mock("@/core/matching/engine", () => ({
  matchIssues: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getGitHubClient: vi.fn(() => ({})),
}));

const mockProfileResult: ProfileAnalysisResult = {
  user: {
    login: "testdev",
    id: 1,
    avatarUrl: "https://example.com/avatar.png",
    name: "Test Dev",
    bio: "Developer",
    publicRepos: 5,
    followers: 10,
    following: 5,
    createdAt: "2020-01-01T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    htmlUrl: "https://github.com/testdev",
  },
  repositories: [
    {
      id: 1,
      owner: "testdev",
      name: "app",
      fullName: "testdev/app",
      description: "An app",
      topics: ["typescript", "react"],
      primaryLanguage: "TypeScript",
      stars: 10,
      forks: 2,
      openIssuesCount: 1,
      createdAt: "2022-01-01T00:00:00Z",
      updatedAt: "2026-09-24T00:00:00Z",
      pushedAt: "2026-09-24T00:00:00Z",
      defaultBranch: "main",
      isArchived: false,
      isFork: false,
      htmlUrl: "https://github.com/testdev/app",
    },
  ],
  languageFootprint: {
    entries: [
      {
        language: "TypeScript",
        bytes: 8000,
        percentage: 80,
        rawPercentage: 80,
        color: "#3178C6",
      },
      {
        language: "JavaScript",
        bytes: 2000,
        percentage: 20,
        rawPercentage: 20,
        color: "#F7DF1E",
      },
    ],
    totalBytes: 10000,
    uniqueLanguagesCount: 2,
    analyzedRepositoriesCount: 1,
    skippedRepositoriesCount: 0,
    totalRepositoriesCount: 1,
    skippedRepositories: [],
  },
  technologies: [
    {
      id: "react",
      name: "React",
      category: "framework",
      evidenceLevel: "strong",
      evidenceSummary: ["Detected in dependencies"],
      evidence: [],
      repositoryCount: 1,
      repositories: ["app"],
      mostRecentAt: "2026-09-24T00:00:00Z",
      daysSinceMostRecent: 0,
    },
  ],
  profile: {
    userId: "testdev",
    analyzedAt: "2026-09-25T00:00:00.000Z",
    repositoriesAnalyzed: 1,
    technologies: [],
    languageFootprint: [],
  },
  metadata: {
    analyzedAt: "2026-09-25T00:00:00.000Z",
    repositoriesRequested: 30,
    repositoriesFound: 1,
    repositoriesAnalyzed: 1,
    repositoriesSkipped: 0,
    languagesFetchedCount: 1,
    warnings: [],
    status: "complete",
  },
};

const mockDiscoveryResult: IssueDiscoveryResult = {
  issues: [
    {
      issue: {
        id: 101,
        number: 42,
        title: "Add support for TypeScript plugins",
        body: "We need plugins support in TypeScript.",
        state: "open",
        htmlUrl: "https://github.com/org/repo/issues/42",
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
        commentsCount: 3,
        labels: [{ name: "good first issue", color: "128A0C", description: "Good for newcomers" }],
        repository: {
          owner: "org",
          name: "repo",
          fullName: "org/repo",
          description: "Test repository",
          htmlUrl: "https://github.com/org/repo",
          primaryLanguage: "TypeScript",
          topics: ["typescript", "plugins"],
          stars: 250,
          forks: 30,
          isArchived: false,
        },
      },
      signals: {
        hasBody: true,
        bodyLength: 42,
        labelNames: ["good first issue"],
        hasHelpWantedOrGoodFirstIssue: true,
        commentsCount: 3,
        daysSinceUpdated: 1,
        ageInDays: 5,
        primaryLanguage: "TypeScript",
        repositoryTopics: ["typescript", "plugins"],
        repositoryStars: 250,
        repositoryForks: 30,
        isRepositoryArchived: false,
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
      },
    },
  ],
  metadata: {
    searchedAt: "2026-09-25T00:00:00.000Z",
    query: "is:issue state:open archived:false",
    totalAvailableCount: 1,
    returnedCount: 1,
    pagesFetched: 1,
    hasMore: false,
    status: "complete",
    warnings: [],
  },
};

const mockMatchingResult: MatchingResult = {
  matches: [
    {
      issue: mockDiscoveryResult.issues[0].issue,
      signals: mockDiscoveryResult.issues[0].signals,
      score: 82.5,
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
        matchedTechnologies: ["typescript"],
        matchedLanguages: [{ language: "TypeScript", userPercentage: 80 }],
        matchedTopics: ["typescript"],
        suitabilityHighlights: [],
        activitySummary: "Active repository",
        unavailableComponents: [],
        reasons: ["Primary language matches 80% of your analyzed code."],
        gaps: [],
      },
    },
  ],
  profile: mockProfileResult.profile,
  metadata: {
    matchedAt: "2026-09-25T00:00:00.000Z",
    totalCandidateIssues: 1,
    matchedIssuesCount: 1,
    referenceNow: "2026-09-25T00:00:00.000Z",
  },
};

describe("getProfileAndRecommendations helper", () => {
  const fixedNow = new Date("2026-09-25T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("orchestrates profile analysis, issue discovery, and matching on success", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockResolvedValueOnce(mockProfileResult);
    vi.mocked(discoveryModule.discoverIssues).mockResolvedValueOnce(mockDiscoveryResult);
    vi.mocked(matchingModule.matchIssues).mockReturnValueOnce(mockMatchingResult);

    const result = await getProfileAndRecommendations("testdev", { now: fixedNow });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.profile.user.login).toBe("testdev");
      expect(result.discovery.status).toBe("complete");
      expect(result.recommendations.matches.length).toBe(1);
      expect(result.recommendations.matches[0].score).toBe(82.5);
    }

    // Verify discoverIssues was called with the broadest sensible deterministic V1 strategy:
    // - state: "open"
    // - excludeArchived: true
    // - limit: 30
    // - explicitly NO "good first issue" or language restrictions
    expect(discoveryModule.discoverIssues).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        state: "open",
        excludeArchived: true,
        limit: 30,
      })
    );

    const callCriteria = vi.mocked(discoveryModule.discoverIssues).mock.calls[0][1];
    expect(callCriteria?.labels).toBeUndefined();
    expect(callCriteria?.languages).toBeUndefined();

    // Verify matchIssues was called with candidate issues
    expect(matchingModule.matchIssues).toHaveBeenCalledWith(
      mockProfileResult.profile,
      mockDiscoveryResult.issues,
      { now: fixedNow }
    );
  });

  it("returns early with zero matches when user has 0 repositories", async () => {
    const zeroRepoProfile: ProfileAnalysisResult = {
      ...mockProfileResult,
      repositories: [],
    };

    vi.mocked(pipelineModule.analyzeProfile).mockResolvedValueOnce(zeroRepoProfile);

    const result = await getProfileAndRecommendations("newdev", { now: fixedNow });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.profile.repositories.length).toBe(0);
      expect(result.discovery.totalAvailableCount).toBe(0);
      expect(result.recommendations.matches.length).toBe(0);
    }

    expect(discoveryModule.discoverIssues).not.toHaveBeenCalled();
    expect(matchingModule.matchIssues).not.toHaveBeenCalled();
  });

  it("handles discovery failure gracefully and returns partial discovery notice", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockResolvedValueOnce(mockProfileResult);
    vi.mocked(discoveryModule.discoverIssues).mockRejectedValueOnce(
      new Error("GitHub Search API rate limit exceeded")
    );
    vi.mocked(matchingModule.matchIssues).mockReturnValueOnce({
      ...mockMatchingResult,
      matches: [],
      metadata: { ...mockMatchingResult.metadata, totalCandidateIssues: 0, matchedIssuesCount: 0 },
    });

    const result = await getProfileAndRecommendations("testdev", { now: fixedNow });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.discovery.status).toBe("partial");
      expect(result.discovery.warnings.length).toBe(1);
      expect(result.discovery.warnings[0]).toContain("rate limit");
      expect(result.recommendations.matches.length).toBe(0);
    }
  });

  it("captures PipelineError and returns error state without throwing", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockRejectedValueOnce(
      new PipelineUserNotFoundError("ghost")
    );

    const result = await getProfileAndRecommendations("ghost", { now: fixedNow });

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(PipelineUserNotFoundError);
      expect(result.username).toBe("ghost");
    }
  });

  it("captures unexpected error and wraps in PipelineApiError", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockRejectedValueOnce(
      new Error("Unexpected network timeout")
    );

    const result = await getProfileAndRecommendations("timeoutdev", { now: fixedNow });

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.code).toBe("API_ERROR");
      expect(result.error.message).toContain("Unexpected network timeout");
    }
  });
});
