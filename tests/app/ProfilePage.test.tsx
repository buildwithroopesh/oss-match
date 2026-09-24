import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage, { generateMetadata } from "@/app/profile/[username]/page";
import * as profileLib from "@/lib/profile";
import { PipelineUserNotFoundError } from "@/core/pipeline/errors";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";

vi.mock("@/lib/profile", () => ({
  getProfileAnalysis: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockSuccessResult: ProfileAnalysisResult = {
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

describe("ProfilePage Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates correct page metadata", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ username: "linus" }),
    });
    expect(meta.title).toBe("@linus — Profile Analysis | OSS Match");
  });

  it("renders profile header, footprint, and repositories on success", async () => {
    vi.mocked(profileLib.getProfileAnalysis).mockResolvedValueOnce({
      status: "success",
      data: mockSuccessResult,
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "linus" }),
    });
    render(pageElement);

    expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
    expect(screen.getByText("@linus")).toBeInTheDocument();
    expect(screen.getByText("Linux kernel source tree")).toBeInTheDocument();
    expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
  });

  it("renders EmptyProfileCard when user has 0 repositories", async () => {
    const emptyResult: ProfileAnalysisResult = {
      ...mockSuccessResult,
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

    vi.mocked(profileLib.getProfileAnalysis).mockResolvedValueOnce({
      status: "success",
      data: emptyResult,
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "linus" }),
    });
    render(pageElement);

    expect(screen.getByText("No Public Repositories Found")).toBeInTheDocument();
  });

  it("renders ProfileErrorState when pipeline returns an error", async () => {
    vi.mocked(profileLib.getProfileAnalysis).mockResolvedValueOnce({
      status: "error",
      error: new PipelineUserNotFoundError("ghost"),
    });

    const pageElement = await ProfilePage({
      params: Promise.resolve({ username: "ghost" }),
    });
    render(pageElement);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("User Not Found")).toBeInTheDocument();
  });
});
