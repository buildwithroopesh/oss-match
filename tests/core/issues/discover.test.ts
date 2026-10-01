import { describe, it, expect, vi, beforeEach } from "vitest";
import { discoverIssues } from "@/core/issues/discover";
import {
  DiscoveryInvalidInputError,
  DiscoveryRateLimitExhaustedError,
  DiscoveryApiError,
} from "@/core/issues/errors";
import { GitHubRateLimitError, GitHubApiError } from "@/core/github/errors";
import type { GitHubClient } from "@/core/github/client";
import type { GitHubIssue } from "@/core/types/github";

function createMockIssue(id: number, updatedAt: string, number = id): GitHubIssue {
  return {
    id,
    number,
    title: `Issue #${number}`,
    body: `Body of issue ${number}`,
    state: "open",
    labels: [{ name: "help wanted", color: "128A0C", description: null }],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt,
    commentsCount: 2,
    htmlUrl: `https://github.com/org/repo/issues/${number}`,
    repository: {
      owner: "org",
      name: "repo",
      fullName: "org/repo",
      description: "Test repository",
      topics: ["typescript"],
      primaryLanguage: "TypeScript",
      stars: 500,
      forks: 50,
      isArchived: false,
      htmlUrl: "https://github.com/org/repo",
    },
  };
}

describe("discoverIssues Engine", () => {
  let mockClient: GitHubClient;

  beforeEach(() => {
    mockClient = {
      searchIssues: vi.fn(),
      getRepository: vi.fn(),
      lastRateLimit: {
        limit: 5000,
        remaining: 4980,
        used: 20,
        reset: 1774483200,
        resource: "search",
      },
    } as unknown as GitHubClient;
  });

  it("successfully discovers issues matching search criteria", async () => {
    const issues = [
      createMockIssue(101, "2026-09-24T00:00:00Z"),
      createMockIssue(102, "2026-09-23T00:00:00Z"),
    ];

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 2,
      incompleteResults: false,
      issues,
    });

    const result = await discoverIssues(mockClient, {
      languages: ["typescript"],
      labels: ["help wanted"],
      limit: 10,
    });

    expect(result.issues.length).toBe(2);
    expect(result.issues[0].issue.id).toBe(101);
    expect(result.issues[0].signals.hasHelpWantedOrGoodFirstIssue).toBe(true);
    expect(result.issues[0].signals.primaryLanguage).toBe("TypeScript");
    expect(result.metadata.totalAvailableCount).toBe(2);
    expect(result.metadata.status).toBe("complete");
    expect(result.metadata.pagesFetched).toBe(1);
    expect(result.metadata.rateLimitRemaining).toBe(4980);
  });

  it("handles pagination cleanly when limit exceeds perPage", async () => {
    const page1 = [
      createMockIssue(1, "2026-09-24T00:00:00Z"),
      createMockIssue(2, "2026-09-23T00:00:00Z"),
    ];
    const page2 = [
      createMockIssue(3, "2026-09-22T00:00:00Z"),
      createMockIssue(4, "2026-09-21T00:00:00Z"),
    ];

    vi.mocked(mockClient.searchIssues)
      .mockResolvedValueOnce({
        totalCount: 4,
        incompleteResults: false,
        issues: page1,
      })
      .mockResolvedValueOnce({
        totalCount: 4,
        incompleteResults: false,
        issues: page2,
      });

    const result = await discoverIssues(mockClient, {
      limit: 4,
      perPage: 2,
    });

    expect(mockClient.searchIssues).toHaveBeenCalledTimes(2);
    expect(result.issues.length).toBe(4);
    expect(result.metadata.pagesFetched).toBe(2);
    expect(result.metadata.returnedCount).toBe(4);
    expect(result.metadata.status).toBe("complete");
  });

  it("deduplicates overlapping issues by unique issue ID", async () => {
    const page1 = [
      createMockIssue(1, "2026-09-24T00:00:00Z"),
      createMockIssue(2, "2026-09-23T00:00:00Z"),
    ];
    // Page 2 returns duplicate issue 2 plus issue 3
    const page2 = [
      createMockIssue(2, "2026-09-23T00:00:00Z"),
      createMockIssue(3, "2026-09-22T00:00:00Z"),
    ];

    vi.mocked(mockClient.searchIssues)
      .mockResolvedValueOnce({
        totalCount: 3,
        incompleteResults: false,
        issues: page1,
      })
      .mockResolvedValueOnce({
        totalCount: 3,
        incompleteResults: false,
        issues: page2,
      });

    const result = await discoverIssues(mockClient, {
      limit: 10,
      perPage: 2,
    });

    expect(result.issues.length).toBe(3);
    const ids = result.issues.map((i) => i.issue.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  it("enforces deterministic ordering with stable tie-breaker on issue ID", async () => {
    // Both issues have identical updatedAt
    const issueA = createMockIssue(200, "2026-09-20T00:00:00Z");
    const issueB = createMockIssue(100, "2026-09-20T00:00:00Z");

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 2,
      incompleteResults: false,
      issues: [issueA, issueB],
    });

    const result = await discoverIssues(mockClient, { limit: 10 });
    // Stable tie-breaker ensures ID 100 precedes ID 200
    expect(result.issues[0].issue.id).toBe(100);
    expect(result.issues[1].issue.id).toBe(200);
  });

  it("handles empty search results gracefully", async () => {
    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 0,
      incompleteResults: false,
      issues: [],
    });

    const result = await discoverIssues(mockClient, {
      keywords: ["nonexistent-query-string-xyz"],
    });

    expect(result.issues).toEqual([]);
    expect(result.metadata.totalAvailableCount).toBe(0);
    expect(result.metadata.returnedCount).toBe(0);
    expect(result.metadata.status).toBe("complete");
    expect(result.metadata.hasMore).toBe(false);
  });

  it("validates criteria and rejects invalid limit or page values", async () => {
    await expect(discoverIssues(mockClient, { limit: 0 })).rejects.toThrow(
      DiscoveryInvalidInputError
    );
    await expect(discoverIssues(mockClient, { limit: -5 })).rejects.toThrow(
      DiscoveryInvalidInputError
    );
    await expect(discoverIssues(mockClient, { page: 0 })).rejects.toThrow(
      DiscoveryInvalidInputError
    );
  });

  it("maps rate-limit error on initial page to DiscoveryRateLimitExhaustedError", async () => {
    vi.mocked(mockClient.searchIssues).mockRejectedValueOnce(
      new GitHubRateLimitError("API rate limit exceeded", {
        status: 403,
        limitType: "primary",
        resetEpochSeconds: 1774483200,
      })
    );

    await expect(discoverIssues(mockClient)).rejects.toThrow(
      DiscoveryRateLimitExhaustedError
    );
  });

  it("handles mid-pagination rate limits with partial results resilience", async () => {
    const page1 = [createMockIssue(1, "2026-09-24T00:00:00Z")];

    vi.mocked(mockClient.searchIssues)
      .mockResolvedValueOnce({
        totalCount: 10,
        incompleteResults: false,
        issues: page1,
      })
      .mockRejectedValueOnce(
        new GitHubRateLimitError("Rate limit exceeded on page 2", {
          status: 403,
          limitType: "primary",
        })
      );

    const result = await discoverIssues(mockClient, { limit: 5, perPage: 1 });

    expect(result.issues.length).toBe(1);
    expect(result.metadata.status).toBe("partial");
    expect(result.metadata.warnings.length).toBe(1);
    expect(result.metadata.warnings[0]).toContain("GitHub rate limit reached");
  });

  it("maps unexpected GitHub API errors on initial request", async () => {
    vi.mocked(mockClient.searchIssues).mockRejectedValueOnce(
      new GitHubApiError("Server 500 error", { status: 500 })
    );

    await expect(discoverIssues(mockClient)).rejects.toThrow(DiscoveryApiError);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Regression Tests: Repository Metadata Hydration
  // ───────────────────────────────────────────────────────────────────────────

  it("hydrates repository metadata (language, topics, stars, forks, isArchived) when client.getRepository is available", async () => {
    const rawIssue: GitHubIssue = {
      id: 301,
      number: 1,
      title: "Fix memory leak in parser",
      body: "Description of issue",
      state: "open",
      labels: [{ name: "bug", color: "d73a4a", description: null }],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      commentsCount: 1,
      htmlUrl: "https://github.com/acme/parser/issues/1",
      repository: {
        owner: "acme",
        name: "parser",
        fullName: "acme/parser",
        description: null,
        topics: [],
        primaryLanguage: null,
        stars: 0,
        forks: 0,
        isArchived: false,
        htmlUrl: "https://github.com/acme/parser",
      },
    };

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 1,
      incompleteResults: false,
      issues: [rawIssue],
    });

    const getRepositoryMock = vi.fn().mockResolvedValueOnce({
      id: 99,
      owner: "acme",
      name: "parser",
      fullName: "acme/parser",
      description: "Fast TS parser",
      topics: ["typescript", "compiler", "parser"],
      primaryLanguage: "TypeScript",
      stars: 1500,
      forks: 120,
      openIssuesCount: 10,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      pushedAt: "2026-09-20T00:00:00Z",
      defaultBranch: "main",
      isArchived: false,
      isFork: false,
      htmlUrl: "https://github.com/acme/parser",
    });

    mockClient.getRepository = getRepositoryMock;

    const result = await discoverIssues(mockClient, { limit: 10 });

    expect(getRepositoryMock).toHaveBeenCalledTimes(1);
    expect(getRepositoryMock).toHaveBeenCalledWith("acme", "parser");

    expect(result.issues).toHaveLength(1);
    const discovered = result.issues[0];

    // Verified: repository domain entity is hydrated
    expect(discovered.issue.repository.primaryLanguage).toBe("TypeScript");
    expect(discovered.issue.repository.topics).toEqual(["typescript", "compiler", "parser"]);
    expect(discovered.issue.repository.stars).toBe(1500);
    expect(discovered.issue.repository.forks).toBe(120);

    // Verified: signals fed into downstream matching engine are accurately populated
    expect(discovered.signals.primaryLanguage).toBe("TypeScript");
    expect(discovered.signals.repositoryTopics).toEqual(["typescript", "compiler", "parser"]);
    expect(discovered.signals.repositoryStars).toBe(1500);
    expect(discovered.signals.repositoryForks).toBe(120);
    expect(discovered.signals.isRepositoryArchived).toBe(false);
  });

  it("deduplicates repository hydration calls when multiple issues belong to the same repository", async () => {
    const rawIssue1: GitHubIssue = {
      id: 401,
      number: 10,
      title: "First issue in repo",
      body: "Body 1",
      state: "open",
      labels: [],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      commentsCount: 0,
      htmlUrl: "https://github.com/vercel/next.js/issues/10",
      repository: {
        owner: "vercel",
        name: "next.js",
        fullName: "vercel/next.js",
        description: null,
        topics: [],
        primaryLanguage: null,
        stars: 0,
        forks: 0,
        isArchived: false,
        htmlUrl: "https://github.com/vercel/next.js",
      },
    };

    const rawIssue2: GitHubIssue = {
      id: 402,
      number: 11,
      title: "Second issue in same repo",
      body: "Body 2",
      state: "open",
      labels: [],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      commentsCount: 1,
      htmlUrl: "https://github.com/vercel/next.js/issues/11",
      repository: {
        owner: "vercel",
        name: "next.js",
        fullName: "vercel/next.js",
        description: null,
        topics: [],
        primaryLanguage: null,
        stars: 0,
        forks: 0,
        isArchived: false,
        htmlUrl: "https://github.com/vercel/next.js",
      },
    };

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 2,
      incompleteResults: false,
      issues: [rawIssue1, rawIssue2],
    });

    const getRepositoryMock = vi.fn().mockResolvedValue({
      id: 100,
      owner: "vercel",
      name: "next.js",
      fullName: "vercel/next.js",
      description: "The React Framework",
      topics: ["react", "nextjs"],
      primaryLanguage: "JavaScript",
      stars: 120000,
      forks: 25000,
      openIssuesCount: 800,
      createdAt: "2016-10-25T00:00:00Z",
      updatedAt: "2026-09-24T00:00:00Z",
      pushedAt: "2026-09-24T00:00:00Z",
      defaultBranch: "canary",
      isArchived: false,
      isFork: false,
      htmlUrl: "https://github.com/vercel/next.js",
    });

    mockClient.getRepository = getRepositoryMock;

    const result = await discoverIssues(mockClient, { limit: 10 });

    // CRUCIAL: Exactly 1 call for vercel/next.js even though 2 issues were found
    expect(getRepositoryMock).toHaveBeenCalledTimes(1);
    expect(getRepositoryMock).toHaveBeenCalledWith("vercel", "next.js");

    expect(result.issues[0].signals.primaryLanguage).toBe("JavaScript");
    expect(result.issues[1].signals.primaryLanguage).toBe("JavaScript");
  });

  it("gracefully proceeds when repository hydration encounters a failure or rate limit", async () => {
    const rawIssue: GitHubIssue = {
      id: 501,
      number: 1,
      title: "Issue with unreachable repo metadata",
      body: "Body",
      state: "open",
      labels: [],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      commentsCount: 0,
      htmlUrl: "https://github.com/transient/repo/issues/1",
      repository: {
        owner: "transient",
        name: "repo",
        fullName: "transient/repo",
        description: null,
        topics: [],
        primaryLanguage: null,
        stars: 0,
        forks: 0,
        isArchived: false,
        htmlUrl: "https://github.com/transient/repo",
      },
    };

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 1,
      incompleteResults: false,
      issues: [rawIssue],
    });

    const getRepositoryMock = vi.fn().mockRejectedValueOnce(
      new GitHubRateLimitError("Rate limit exceeded for repository lookup", {
        status: 403,
        limitType: "primary",
      })
    );

    mockClient.getRepository = getRepositoryMock;

    const result = await discoverIssues(mockClient, { limit: 10 });

    // Does NOT throw; preserves discovered issue with partial metadata warning
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].signals.primaryLanguage).toBeNull();
    expect(result.metadata.warnings.some((w) => w.includes("Rate limit reached while hydrating repository"))).toBe(true);
  });

  it("skips hydration when criteria.hydrateRepositories is explicitly false", async () => {
    const rawIssue: GitHubIssue = {
      id: 601,
      number: 1,
      title: "Issue with hydration disabled",
      body: "Body",
      state: "open",
      labels: [],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
      commentsCount: 0,
      htmlUrl: "https://github.com/no-hydrate/repo/issues/1",
      repository: {
        owner: "no-hydrate",
        name: "repo",
        fullName: "no-hydrate/repo",
        description: null,
        topics: [],
        primaryLanguage: null,
        stars: 0,
        forks: 0,
        isArchived: false,
        htmlUrl: "https://github.com/no-hydrate/repo",
      },
    };

    vi.mocked(mockClient.searchIssues).mockResolvedValueOnce({
      totalCount: 1,
      incompleteResults: false,
      issues: [rawIssue],
    });

    const getRepositoryMock = vi.fn();
    mockClient.getRepository = getRepositoryMock;

    const result = await discoverIssues(mockClient, {
      limit: 10,
      hydrateRepositories: false,
    });

    expect(getRepositoryMock).not.toHaveBeenCalled();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].signals.primaryLanguage).toBeNull();
  });
});

