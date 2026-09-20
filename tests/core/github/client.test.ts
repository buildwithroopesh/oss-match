import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient, DEFAULT_REPO_LIMIT } from "@/core/github/client";
import {
  GitHubInvalidInputError,
  GitHubUserNotFoundError,
  GitHubResourceNotFoundError,
  GitHubUnauthorizedError,
  GitHubForbiddenError,
  GitHubRateLimitError,
  GitHubNetworkError,
  GitHubMalformedResponseError,
} from "@/core/github/errors";
import { MemoryCache } from "@/core/github/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createMockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  const isJson = typeof body === "object" && body !== null;
  const bodyString = isJson ? JSON.stringify(body) : String(body ?? "");

  const responseHeaders = new Headers({
    "content-type": "application/json",
    "x-ratelimit-limit": "5000",
    "x-ratelimit-remaining": "4999",
    "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
    ...headers,
  });

  return new Response(bodyString, {
    status,
    statusText: status === 200 ? "OK" : `Error ${status}`,
    headers: responseHeaders,
  });
}

describe("GitHubClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GitHubClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new GitHubClient({
      fetchFn: mockFetch as unknown as typeof fetch,
      cache: new MemoryCache({ defaultTtlMs: 60 * 1000 }),
      token: "test-token",
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Centralized Headers & Transport
  // ───────────────────────────────────────────────────────────────────────────

  it("attaches centralized headers: Accept, X-GitHub-Api-Version: 2026-03-10, User-Agent, and Authorization", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        login: "buildwithroopesh",
        id: 12345,
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
        name: "Roopesh",
        bio: "OSS developer",
        public_repos: 12,
        followers: 100,
        following: 50,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        html_url: "https://github.com/buildwithroopesh",
      })
    );

    await client.getUser("buildwithroopesh");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe("https://api.github.com/users/buildwithroopesh");

    const headers = calledInit.headers as Headers;
    expect(headers.get("Accept")).toBe("application/vnd.github+json");
    expect(headers.get("X-GitHub-Api-Version")).toBe("2026-03-10");
    expect(headers.get("User-Agent")).toBe(
      "oss-match/0.1.0 (+https://github.com/buildwithroopesh/oss-match)"
    );
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("works without authentication token (unauthenticated requests)", async () => {
    const unauthClient = new GitHubClient({
      fetchFn: mockFetch as unknown as typeof fetch,
      cache: new MemoryCache(),
    });

    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        login: "octocat",
        id: 1,
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        public_repos: 8,
        followers: 20,
        following: 0,
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2026-01-01T00:00:00Z",
        html_url: "https://github.com/octocat",
      })
    );

    await unauthClient.getUser("octocat");

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Successful Domain Operations & Normalization
  // ───────────────────────────────────────────────────────────────────────────

  it("getUser() retrieves and normalizes user profile", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        login: "buildwithroopesh",
        id: 99,
        avatar_url: "https://avatars.example.com/u/99",
        name: "Roopesh",
        bio: "Developer",
        public_repos: 15,
        followers: 40,
        following: 10,
        created_at: "2023-05-10T12:00:00Z",
        updated_at: "2026-08-01T15:00:00Z",
        html_url: "https://github.com/buildwithroopesh",
      })
    );

    const user = await client.getUser("buildwithroopesh");

    expect(user).toEqual({
      login: "buildwithroopesh",
      id: 99,
      avatarUrl: "https://avatars.example.com/u/99",
      name: "Roopesh",
      bio: "Developer",
      publicRepos: 15,
      followers: 40,
      following: 10,
      createdAt: "2023-05-10T12:00:00Z",
      updatedAt: "2026-08-01T15:00:00Z",
      htmlUrl: "https://github.com/buildwithroopesh",
    });
  });

  it("getUser() throws GitHubInvalidInputError on empty username", async () => {
    await expect(client.getUser("   ")).rejects.toThrow(GitHubInvalidInputError);
  });

  it("getRepository() retrieves and normalizes repository metadata", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        id: 101,
        name: "oss-match",
        full_name: "buildwithroopesh/oss-match",
        owner: { login: "buildwithroopesh" },
        description: "Find matching open-source issues",
        topics: ["open-source", "typescript"],
        language: "TypeScript",
        stargazers_count: 42,
        forks_count: 5,
        open_issues_count: 3,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
        pushed_at: "2026-09-15T00:00:00Z",
        default_branch: "main",
        archived: false,
        fork: false,
        html_url: "https://github.com/buildwithroopesh/oss-match",
      })
    );

    const repo = await client.getRepository("buildwithroopesh", "oss-match");

    expect(repo.fullName).toBe("buildwithroopesh/oss-match");
    expect(repo.primaryLanguage).toBe("TypeScript");
    expect(repo.topics).toEqual(["open-source", "typescript"]);
    expect(repo.stars).toBe(42);
  });

  it("getLanguages() returns byte counts for repository", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        TypeScript: 85000,
        JavaScript: 15000,
      })
    );

    const languages = await client.getLanguages("buildwithroopesh", "oss-match");
    expect(languages).toEqual({
      TypeScript: 85000,
      JavaScript: 15000,
    });
  });

  it("searchIssues() retrieves and normalizes open issues", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        total_count: 1,
        incomplete_results: false,
        items: [
          {
            id: 501,
            number: 12,
            title: "Add toast notifications",
            body: "Please replace window.alert with toasts.",
            state: "open",
            labels: [{ name: "good first issue", color: "7057ff", description: "Good for beginners" }],
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-02T00:00:00Z",
            comments: 2,
            html_url: "https://github.com/buildwithroopesh/oss-match/issues/12",
            repository_url: "https://api.github.com/repos/buildwithroopesh/oss-match",
          },
        ],
      })
    );

    const result = await client.searchIssues('label:"good first issue"');
    expect(result.totalCount).toBe(1);
    expect(result.issues[0].title).toBe("Add toast notifications");
    expect(result.issues[0].repository.fullName).toBe("buildwithroopesh/oss-match");
    expect(result.issues[0].labels[0].name).toBe("good first issue");
  });

  it("getIssue() retrieves single issue with fallback repo details", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        id: 777,
        number: 5,
        title: "Fix responsive layout on mobile",
        body: "Navbar wraps unexpectedly on small screens.",
        state: "open",
        labels: ["bug"],
        created_at: "2026-08-10T00:00:00Z",
        updated_at: "2026-08-11T00:00:00Z",
        comments: 0,
        html_url: "https://github.com/buildwithroopesh/oss-match/issues/5",
      })
    );

    const issue = await client.getIssue("buildwithroopesh", "oss-match", 5);
    expect(issue.number).toBe(5);
    expect(issue.repository.fullName).toBe("buildwithroopesh/oss-match");
    expect(issue.labels[0]).toEqual({
      name: "bug",
      color: "ededed",
      description: null,
    });
  });

  it("getRepositoryActivity() computes activity level from pushed_at and commit telemetry", async () => {
    // 1. Repo metadata call
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        id: 202,
        name: "active-repo",
        full_name: "test/active-repo",
        owner: { login: "test" },
        description: "Active project",
        topics: [],
        stargazers_count: 10,
        forks_count: 2,
        open_issues_count: 0,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2026-09-18T00:00:00Z",
        pushed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        default_branch: "main",
        archived: false,
        fork: false,
        html_url: "https://github.com/test/active-repo",
      })
    );

    // 2. Commits call
    mockFetch.mockResolvedValueOnce(
      createMockResponse([
        {
          sha: "abc1234",
          commit: {
            committer: { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          },
        },
      ])
    );

    const activity = await client.getRepositoryActivity("test", "active-repo");
    expect(activity.activityLevel).toBe("recently-active");
    expect(activity.daysSinceLastPush).toBeLessThanOrEqual(6);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Pagination Strategy (Default 30, Bounded, No 100-repo Overfetch)
  // ───────────────────────────────────────────────────────────────────────────

  it("getRepositories() paginates and stops at the configured limit", async () => {
    // Return 2 repos when limit is 2
    mockFetch.mockResolvedValueOnce(
      createMockResponse([
        {
          id: 1,
          name: "repo-1",
          full_name: "user/repo-1",
          owner: { login: "user" },
          stargazers_count: 1,
          forks_count: 0,
          open_issues_count: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          pushed_at: "2026-01-01T00:00:00Z",
          default_branch: "main",
          archived: false,
          fork: false,
          html_url: "https://github.com/user/repo-1",
        },
        {
          id: 2,
          name: "repo-2",
          full_name: "user/repo-2",
          owner: { login: "user" },
          stargazers_count: 2,
          forks_count: 0,
          open_issues_count: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          pushed_at: "2026-01-01T00:00:00Z",
          default_branch: "main",
          archived: false,
          fork: false,
          html_url: "https://github.com/user/repo-2",
        },
      ])
    );

    const repos = await client.getRepositories("user", { limit: 2 });
    expect(repos).toHaveLength(2);

    // Verify per_page requested was 2 (no fetching 100 to discard 98)
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("per_page=2");
  });

  it("uses DEFAULT_REPO_LIMIT (30) by default when fetching repositories", async () => {
    expect(DEFAULT_REPO_LIMIT).toBe(30);
    expect(client.defaultRepoLimit).toBe(30);

    mockFetch.mockResolvedValueOnce(createMockResponse([]));
    await client.getRepositories("user");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("per_page=30");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Error Taxonomy & Rate-Limit Discipline
  // ───────────────────────────────────────────────────────────────────────────

  it("throws GitHubUserNotFoundError on 404 for user endpoint", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({ message: "Not Found" }, 404));
    await expect(client.getUser("ghost-user")).rejects.toThrow(GitHubUserNotFoundError);
  });

  it("throws GitHubResourceNotFoundError on 404 for repository endpoint", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({ message: "Not Found" }, 404));
    await expect(client.getRepository("user", "missing-repo")).rejects.toThrow(
      GitHubResourceNotFoundError
    );
  });

  it("classifies 401 as GitHubUnauthorizedError", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ message: "Bad credentials" }, 401)
    );
    await expect(client.getUser("any")).rejects.toThrow(GitHubUnauthorizedError);
  });

  it("classifies 403 + remaining>0 + permission error as ordinary GitHubForbiddenError", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        { message: "Resource not accessible by personal access token" },
        403,
        {
          "x-ratelimit-remaining": "4950",
          "x-ratelimit-limit": "5000",
        }
      )
    );

    try {
      await client.getUser("any");
      expect.unreachable("Should have thrown GitHubForbiddenError");
    } catch (err) {
      expect(err).toBeInstanceOf(GitHubForbiddenError);
      expect(err).not.toBeInstanceOf(GitHubRateLimitError);
      const forbiddenError = err as GitHubForbiddenError;
      expect(forbiddenError.status).toBe(403);
      expect(forbiddenError.rateLimit?.remaining).toBe(4950);
    }
  });

  it("classifies 403 + remaining=0 as primary rate limit with reset time", async () => {
    const futureReset = Math.floor(Date.now() / 1000) + 1200;
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        { message: "API rate limit exceeded for user ID 12345" },
        403,
        {
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(futureReset),
        }
      )
    );

    try {
      await client.getUser("any");
      expect.unreachable("Should have thrown GitHubRateLimitError");
    } catch (err) {
      expect(err).toBeInstanceOf(GitHubRateLimitError);
      const rateLimitError = err as GitHubRateLimitError;
      expect(rateLimitError.limitType).toBe("primary");
      expect(rateLimitError.isPrimaryLimit).toBe(true);
      expect(rateLimitError.isSecondaryLimit).toBe(false);
      expect(rateLimitError.resetEpochSeconds).toBe(futureReset);
    }
  });

  it("classifies 429 + retry-after as secondary rate-limit condition", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        { message: "Too many concurrent requests" },
        429,
        {
          "retry-after": "60",
          "x-ratelimit-remaining": "100",
        }
      )
    );

    try {
      await client.getUser("any");
      expect.unreachable("Should have thrown GitHubRateLimitError");
    } catch (err) {
      expect(err).toBeInstanceOf(GitHubRateLimitError);
      const rateLimitError = err as GitHubRateLimitError;
      expect(rateLimitError.limitType).toBe("secondary");
      expect(rateLimitError.isPrimaryLimit).toBe(false);
      expect(rateLimitError.isSecondaryLimit).toBe(true);
      expect(rateLimitError.retryAfterSeconds).toBe(60);
    }
  });

  it("throws GitHubMalformedResponseError when response fails Zod schema validation", async () => {
    // Missing required fields like 'id', 'avatar_url', etc.
    mockFetch.mockResolvedValueOnce(createMockResponse({ login: "incomplete" }, 200));

    await expect(client.getUser("incomplete")).rejects.toThrow(
      GitHubMalformedResponseError
    );
  });

  it("throws GitHubMalformedResponseError when response is not valid JSON", async () => {
    const badJsonResponse = new Response("<html>Gateway Timeout</html>", {
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
    });
    mockFetch.mockResolvedValueOnce(badJsonResponse);

    await expect(client.getUser("user")).rejects.toThrow(GitHubMalformedResponseError);
  });

  it("throws GitHubNetworkError when fetch rejects (connection drop)", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed: connection refused"));
    await expect(client.getUser("user")).rejects.toThrow(GitHubNetworkError);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Caching & Deduplication Behavior
  // ───────────────────────────────────────────────────────────────────────────

  it("deduplicates identical concurrent requests into a single fetch invocation", async () => {
    const userPayload = {
      login: "dedupuser",
      id: 88,
      avatar_url: "https://avatar.example.com",
      public_repos: 1,
      followers: 0,
      following: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      html_url: "https://github.com/dedupuser",
    };

    // Delay mock response slightly to ensure concurrency
    mockFetch.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return createMockResponse(userPayload);
    });

    // Fire two identical calls concurrently
    const [res1, res2] = await Promise.all([
      client.getUser("dedupuser"),
      client.getUser("dedupuser"),
    ]);

    expect(res1.login).toBe("dedupuser");
    expect(res2.login).toBe("dedupuser");
    // Crucial: fetch was invoked only once!
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns cached result on subsequent calls (cache hit)", async () => {
    const userPayload = {
      login: "cacheuser",
      id: 99,
      avatar_url: "https://avatar.example.com",
      public_repos: 1,
      followers: 0,
      following: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      html_url: "https://github.com/cacheuser",
    };

    mockFetch.mockResolvedValue(createMockResponse(userPayload));

    // First call: cache miss
    await client.getUser("cacheuser");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call: cache hit
    const cachedUser = await client.getUser("cacheuser");
    expect(cachedUser.login).toBe("cacheuser");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
