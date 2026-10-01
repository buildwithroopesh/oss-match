import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBrowseIssues } from "@/lib/issues";
import * as discoveryModule from "@/core/issues/discover";
import {
  DiscoveryError,
  DiscoveryRateLimitExhaustedError,
} from "@/core/issues/errors";
import type { IssueDiscoveryResult } from "@/core/types/issues";

vi.mock("@/core/issues/discover", () => ({
  discoverIssues: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getGitHubClient: vi.fn(() => ({})),
}));

const mockDiscoveryResult: IssueDiscoveryResult = {
  issues: [
    {
      issue: {
        id: 101,
        number: 42,
        title: "Fix memory leak in parser",
        body: "Detailed description of memory leak.",
        state: "open",
        htmlUrl: "https://github.com/acme/parser/issues/42",
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
        commentsCount: 3,
        labels: [
          { name: "good first issue", color: "7057ff", description: null },
        ],
        repository: {
          owner: "acme",
          name: "parser",
          fullName: "acme/parser",
          description: "Fast parser",
          topics: ["typescript", "compiler"],
          primaryLanguage: "TypeScript",
          stars: 1200,
          forks: 150,
          isArchived: false,
          htmlUrl: "https://github.com/acme/parser",
        },
      },
      signals: {
        hasBody: true,
        bodyLength: 36,
        labelNames: ["good first issue"],
        hasHelpWantedOrGoodFirstIssue: true,
        primaryLanguage: "TypeScript",
        repositoryTopics: ["typescript", "compiler"],
        repositoryStars: 1200,
        repositoryForks: 150,
        isRepositoryArchived: false,
        commentsCount: 3,
        createdAt: "2026-09-20T00:00:00Z",
        updatedAt: "2026-09-24T00:00:00Z",
        ageInDays: 4,
        daysSinceUpdated: 0,
      },
    },
  ],
  metadata: {
    searchedAt: "2026-09-24T00:00:00Z",
    query: "is:issue state:open archived:false",
    totalAvailableCount: 1,
    returnedCount: 1,
    pagesFetched: 1,
    hasMore: false,
    status: "complete",
    warnings: [],
  },
};

describe("getBrowseIssues lib helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns status success with discovered issues and metadata", async () => {
    vi.mocked(discoveryModule.discoverIssues).mockResolvedValueOnce(
      mockDiscoveryResult
    );

    const result = await getBrowseIssues();

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue.title).toBe("Fix memory leak in parser");
      expect(result.metadata.status).toBe("complete");
    }
  });

  it("passes language criteria when language option is supplied", async () => {
    vi.mocked(discoveryModule.discoverIssues).mockResolvedValueOnce(
      mockDiscoveryResult
    );

    await getBrowseIssues({ language: "Rust" });

    expect(discoveryModule.discoverIssues).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        languages: ["Rust"],
      })
    );
  });

  it("passes friendly label filter when friendlyOnly is true", async () => {
    vi.mocked(discoveryModule.discoverIssues).mockResolvedValueOnce(
      mockDiscoveryResult
    );

    await getBrowseIssues({ friendlyOnly: true });

    expect(discoveryModule.discoverIssues).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        labels: ["good first issue"],
      })
    );
  });

  it("handles DiscoveryRateLimitExhaustedError with structured error state", async () => {
    vi.mocked(discoveryModule.discoverIssues).mockRejectedValueOnce(
      new DiscoveryRateLimitExhaustedError("API quota exhausted", "primary", {
        resetTimeEpoch: 1774483200,
      })
    );

    const result = await getBrowseIssues();

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("RATE_LIMIT_EXHAUSTED");
      expect(result.resetTimeEpoch).toBe(1774483200);
      expect(result.error).toContain("rate limit");
    }
  });

  it("handles generic DiscoveryError with message and code", async () => {
    vi.mocked(discoveryModule.discoverIssues).mockRejectedValueOnce(
      new DiscoveryError("Network failure connecting to GitHub API", "NETWORK_ERROR")
    );

    const result = await getBrowseIssues();

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.error).toBe("Network failure connecting to GitHub API");
    }
  });
});
