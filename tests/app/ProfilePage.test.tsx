import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage, { generateMetadata } from "@/app/profile/[username]/page";
import * as recommendationsLib from "@/lib/recommendations";
import { PipelineUserNotFoundError } from "@/core/pipeline/errors";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";
import type { DiscoveryMetadata } from "@/core/types/issues";
import type { MatchingResult } from "@/core/types/matching";

vi.mock("@/lib/recommendations", () => ({
  getProfileAndRecommendations: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockSuccessProfile: ProfileAnalysisResult = {
  user: {
    login: "linus",
    id: 1,
    avatarUrl: "https://example.com/avatar.png",
    name: "Linus Torvalds",
    bio: "Linux creator",
    publicRepos: 10,
    followers: 100000,
    following: 0,
    createdAt: "2010-01-01T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    htmlUrl: "https://github.com/linus",
  },
  repositories: [
    {
      id: 1,
      owner: "linus",
      name: "linux",
      fullName: "linus/linux",
      description: "Linux kernel source tree",
      topics: ["kernel", "c", "os"],
      primaryLanguage: "C",
      stars: 180000,
      forks: 50000,
      openIssuesCount: 400,
      createdAt: "2011-09-04T00:00:00Z",
      updatedAt: "2026-09-24T00:00:00Z",
      pushedAt: "2026-09-24T00:00:00Z",
      defaultBranch: "master",
      isArchived: false,
      isFork: false,
      htmlUrl: "https://github.com/linus/linux",
    },
  ],
  languageFootprint: {
    entries: [
      {
        language: "C",
        bytes: 100000000,
        percentage: 100,
        rawPercentage: 100,
        color: "#555555",
      },
    ],
    totalBytes: 100000000,
    uniqueLanguagesCount: 1,
    analyzedRepositoriesCount: 1,
    skippedRepositoriesCount: 0,
    totalRepositoriesCount: 1,
    skippedRepositories: [],
  },
  technologies: [
    {
      id: "c",
      name: "C",
      category: "language",
      evidenceLevel: "strong",
      evidenceSummary: ["Detected in primary languages"],
      evidence: [],
      repositoryCount: 1,
      repositories: ["linux"],
      mostRecentAt: "2026-09-24T00:00:00Z",
      daysSinceMostRecent: 1,
    },
  ],
  profile: {
    userId: "linus",
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

const mockDiscoveryMetadata: DiscoveryMetadata = {
  searchedAt: "2026-09-25T00:00:00Z",
  query: "is:issue",
  totalAvailableCount: 1,
  returnedCount: 1,
  pagesFetched: 1,
  hasMore: false,
  status: "complete",
  warnings: [],
};

const mockMatchingResult: MatchingResult = {
  matches: [
    {
      issue: {
        id: 777,
        number: 12,
        title: "Fix kernel scheduler race condition",
        body: "Race condition in scheduler.",
        state: "open",
        htmlUrl: "https://github.com/torvalds/linux/issues/12",
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
        commentsCount: 10,
        labels: [{ name: "kernel", color: "128A0C", description: null }],
        repository: {
          owner: "torvalds",
          name: "linux",
          fullName: "torvalds/linux",
          description: "Linux kernel source tree",
          htmlUrl: "https://github.com/torvalds/linux",
          primaryLanguage: "C",
          topics: ["kernel"],
          stars: 180000,
          forks: 50000,
          isArchived: false,
        },
      },
      signals: {
        hasBody: true,
        bodyLength: 30,
        labelNames: ["kernel"],
        hasHelpWantedOrGoodFirstIssue: false,
        commentsCount: 10,
        daysSinceUpdated: 1,
        ageInDays: 4,
        primaryLanguage: "C",
        repositoryTopics: ["kernel"],
        repositoryStars: 180000,
        repositoryForks: 50000,
        isRepositoryArchived: false,
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
      },
      score: 91.2,
      components: {
        technology: { name: "technology", baseWeight: 0.35, effectiveWeight: 0.35, score: 1.0, isAvailable: true, explanation: "Matches technology" },
        language: { name: "language", baseWeight: 0.20, effectiveWeight: 0.20, score: 1.0, isAvailable: true, explanation: "Matches language" },
        framework: { name: "framework", baseWeight: 0.15, effectiveWeight: 0.15, score: 1.0, isAvailable: true, explanation: "Matches framework" },
        suitability: { name: "suitability", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.8, isAvailable: true, explanation: "Good suitability" },
        activity: { name: "activity", baseWeight: 0.10, effectiveWeight: 0.10, score: 0.7, isAvailable: true, explanation: "Active repository" },
        freshness: { name: "freshness", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.8, isAvailable: true, explanation: "Fresh issue" },
        difficulty: { name: "difficulty", baseWeight: 0.05, effectiveWeight: 0.05, score: 0.44, isAvailable: true, explanation: "Moderate difficulty" },
      },
      explanation: {
        matchedTechnologies: ["c"],
        matchedLanguages: [{ language: "C", userPercentage: 100 }],
        matchedTopics: ["kernel"],
        suitabilityHighlights: [],
        activitySummary: "Active repository",
        unavailableComponents: [],
        reasons: ["Primary language matches 100% of your analyzed code."],
        gaps: [],
      },
    },
  ],
  profile: mockSuccessProfile.profile,
  metadata: {
    matchedAt: "2026-09-25T00:00:00Z",
    totalCandidateIssues: 1,
    matchedIssuesCount: 1,
    referenceNow: "2026-09-25T00:00:00Z",
  },
};

describe("ProfilePage Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates correct page metadata", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ username: "linus" }),
    });
    expect(meta.title).toBe("@linus — Profile Analysis & Matched Issues | OSS Match");
  });

  it("renders profile header, footprint, repositories, and matched issues on success", async () => {
    vi.mocked(recommendationsLib.getProfileAndRecommendations).mockResolvedValueOnce({
      status: "success",
      profile: mockSuccessProfile,
      discovery: mockDiscoveryMetadata,
      recommendations: mockMatchingResult,
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "linus" }),
    });
    render(pageElement);

    // Profile elements
    expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
    expect(screen.getByText("@linus")).toBeInTheDocument();
    expect(screen.getByText("Linux kernel source tree")).toBeInTheDocument();
    expect(screen.getByText("Analysis Complete")).toBeInTheDocument();

    // Recommendations elements
    expect(screen.getByText("Matched open-source issues")).toBeInTheDocument();
    expect(screen.getByText("Fix kernel scheduler race condition")).toBeInTheDocument();
    expect(screen.getByText("91.2")).toBeInTheDocument();
  });

  it("renders EmptyProfileCard when user has 0 repositories", async () => {
    const emptyProfile: ProfileAnalysisResult = {
      ...mockSuccessProfile,
      repositories: [],
      languageFootprint: {
        entries: [],
        totalBytes: 0,
        uniqueLanguagesCount: 0,
        analyzedRepositoriesCount: 0,
        skippedRepositoriesCount: 0,
        totalRepositoriesCount: 0,
        skippedRepositories: [],
      },
      technologies: [],
    };

    vi.mocked(recommendationsLib.getProfileAndRecommendations).mockResolvedValueOnce({
      status: "success",
      profile: emptyProfile,
      discovery: { ...mockDiscoveryMetadata, totalAvailableCount: 0 },
      recommendations: { ...mockMatchingResult, matches: [] },
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "linus" }),
    });
    render(pageElement);

    expect(screen.getByText("No Public Repositories Found")).toBeInTheDocument();
    expect(screen.queryByText("Matched open-source issues")).not.toBeInTheDocument();
  });

  it("renders ProfileErrorState when recommendations pipeline returns an error", async () => {
    vi.mocked(recommendationsLib.getProfileAndRecommendations).mockResolvedValueOnce({
      status: "error",
      error: new PipelineUserNotFoundError("ghost"),
      username: "ghost",
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "ghost" }),
    });
    render(pageElement);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("User Not Found")).toBeInTheDocument();
  });
});
