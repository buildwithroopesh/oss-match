import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeProfile } from "@/core/pipeline/analyze";
import {
  PipelineInvalidUsernameError,
  PipelineUserNotFoundError,
  PipelineRateLimitExhaustedError,
} from "@/core/pipeline/errors";
import { GitHubClient } from "@/core/github/client";
import {
  GitHubUserNotFoundError,
  GitHubRateLimitError,
  GitHubApiError,
} from "@/core/github/errors";
import type { GitHubUser, GitHubRepository, GitHubLanguages } from "@/core/types/github";

describe("analyzeProfile (Profile Analysis Pipeline)", () => {
  const fixedNow = new Date("2026-03-20T12:00:00Z");

  const mockUser: GitHubUser = {
    login: "alice",
    id: 12345,
    avatarUrl: "https://avatars.githubusercontent.com/u/12345",
    name: "Alice Developer",
    bio: "Full-stack engineer",
    publicRepos: 3,
    followers: 100,
    following: 20,
    createdAt: "2020-01-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    htmlUrl: "https://github.com/alice",
  };

  const mockRepos: GitHubRepository[] = [
    {
      id: 101,
      owner: "alice",
      name: "frontend-dashboard",
      fullName: "alice/frontend-dashboard",
      openIssuesCount: 0,
      isFork: false,
      isArchived: false,
      description: "Next.js dashboard",
      stars: 45,
      forks: 5,
      primaryLanguage: "TypeScript",
      topics: ["react", "nextjs", "tailwindcss"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2026-03-15T00:00:00Z",
      pushedAt: "2026-03-15T00:00:00Z",
      defaultBranch: "main",
      htmlUrl: "https://github.com/alice/frontend-dashboard",
    },
    {
      id: 102,
      owner: "alice",
      name: "data-service",
      fullName: "alice/data-service",
      openIssuesCount: 0,
      isFork: false,
      isArchived: false,
      description: "FastAPI data service",
      stars: 12,
      forks: 1,
      primaryLanguage: "Python",
      topics: ["python", "fastapi"],
      createdAt: "2023-05-01T00:00:00Z",
      updatedAt: "2026-03-10T00:00:00Z",
      pushedAt: "2026-03-10T00:00:00Z",
      defaultBranch: "main",
      htmlUrl: "https://github.com/alice/data-service",
    },
    {
      id: 103,
      owner: "alice",
      name: "systems-tool",
      fullName: "alice/systems-tool",
      openIssuesCount: 0,
      isFork: true, // forked repo
      isArchived: true, // archived repo
      description: "Archived Rust CLI tool",
      stars: 8,
      forks: 0,
      primaryLanguage: "Rust",
      topics: ["rust"],
      createdAt: "2022-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      pushedAt: "2025-01-01T00:00:00Z",
      defaultBranch: "main",
      htmlUrl: "https://github.com/alice/systems-tool",
    },
  ];

  const mockLanguages: Record<string, GitHubLanguages> = {
    "frontend-dashboard": { TypeScript: 60000, JavaScript: 10000, CSS: 5000 },
    "data-service": { Python: 45000, Shell: 2000 },
    "systems-tool": { Rust: 30000 },
  };

  let mockClient: GitHubClient;

  beforeEach(() => {
    mockClient = {
      getUser: vi.fn().mockResolvedValue(mockUser),
      getRepositories: vi.fn().mockResolvedValue(mockRepos),
      getLanguages: vi.fn().mockImplementation((_owner: string, repo: string) => {
        return Promise.resolve(mockLanguages[repo] ?? {});
      }),
      lastRateLimit: {
        limit: 5000,
        remaining: 4980,
        used: 20,
        reset: Math.floor(fixedNow.getTime() / 1000) + 3600,
        resource: "core",
      },
    } as unknown as GitHubClient;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Successful End-to-End Analysis
  // ───────────────────────────────────────────────────────────────────────────

  it("performs complete end-to-end profile analysis", async () => {
    const result = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    // User metadata
    expect(result.user.login).toBe("alice");
    expect(result.user.id).toBe(12345);

    // Repositories
    expect(result.repositories).toHaveLength(3);

    // Language Footprint
    expect(result.languageFootprint.totalBytes).toBe(152000); // 60k+10k+5k + 45k+2k + 30k
    expect(result.languageFootprint.analyzedRepositoriesCount).toBe(3);
    const sumPct = result.languageFootprint.entries.reduce((sum, e) => sum + e.percentage, 0);
    expect(sumPct).toBe(100);

    // Technologies
    expect(result.technologies.length).toBeGreaterThan(0);
    const python = result.technologies.find((t) => t.id === "python");
    expect(python).toBeDefined();
    expect(python?.evidenceLevel).toBe("moderate");

    const rust = result.technologies.find((t) => t.id === "rust");
    expect(rust).toBeDefined();

    // Consolidated TechnologyProfile
    expect(result.profile.userId).toBe("alice");
    expect(result.profile.repositoriesAnalyzed).toBe(3);
    expect(result.profile.languageFootprint).toEqual(result.languageFootprint.entries);

    // Metadata
    expect(result.metadata.status).toBe("complete");
    expect(result.metadata.repositoriesRequested).toBe(30);
    expect(result.metadata.repositoriesFound).toBe(3);
    expect(result.metadata.repositoriesAnalyzed).toBe(3);
    expect(result.metadata.repositoriesSkipped).toBe(0);
    expect(result.metadata.languagesFetchedCount).toBe(3);
    expect(result.metadata.rateLimitRemaining).toBe(4980);
    expect(result.metadata.warnings).toHaveLength(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Empty Profile (Zero Repositories)
  // ───────────────────────────────────────────────────────────────────────────

  it("handles user with zero public repositories gracefully", async () => {
    mockClient.getRepositories = vi.fn().mockResolvedValue([]);

    const result = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    expect(result.repositories).toEqual([]);
    expect(result.languageFootprint.totalBytes).toBe(0);
    expect(result.languageFootprint.entries).toEqual([]);
    expect(result.technologies).toEqual([]);
    expect(result.profile.repositoriesAnalyzed).toBe(0);
    expect(result.metadata.status).toBe("complete");
    expect(result.metadata.repositoriesFound).toBe(0);
    expect(result.metadata.repositoriesAnalyzed).toBe(0);
    expect(mockClient.getLanguages).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Repositories with Missing / Empty Language Data
  // ───────────────────────────────────────────────────────────────────────────

  it("handles repositories with empty language data safely", async () => {
    mockClient.getLanguages = vi.fn().mockImplementation((_owner: string, repo: string) => {
      if (repo === "systems-tool") {
        return Promise.resolve({}); // Empty repo with no language bytes
      }
      return Promise.resolve(mockLanguages[repo] ?? {});
    });

    const result = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    expect(result.languageFootprint.analyzedRepositoriesCount).toBe(2);
    expect(result.languageFootprint.skippedRepositoriesCount).toBe(1);
    expect(result.languageFootprint.skippedRepositories).toContain("systems-tool");
    expect(result.metadata.status).toBe("complete");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Partial Failure Resilience
  // ───────────────────────────────────────────────────────────────────────────

  it("continues analysis and sets status to 'partial' when an individual language fetch fails", async () => {
    mockClient.getLanguages = vi.fn().mockImplementation((_owner: string, repo: string) => {
      if (repo === "data-service") {
        return Promise.reject(new GitHubApiError("Repository language read timeout", { status: 500 }));
      }
      return Promise.resolve(mockLanguages[repo] ?? {});
    });

    const result = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    expect(result.metadata.status).toBe("partial");
    expect(result.metadata.warnings.length).toBeGreaterThan(0);
    expect(result.metadata.warnings[0]).toContain("data-service");
    // Other repositories are still analyzed
    expect(result.languageFootprint.analyzedRepositoriesCount).toBe(2);
    expect(result.technologies.some((t) => t.id === "rust")).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Rate Limit Interruption Mid-Run
  // ───────────────────────────────────────────────────────────────────────────

  it("halts further language requests and captures partial evidence when rate limit is reached", async () => {
    mockClient.getLanguages = vi.fn().mockImplementation((_owner: string, repo: string) => {
      if (repo === "data-service") {
        return Promise.reject(
          new GitHubRateLimitError("Primary rate limit exceeded", {
            status: 403,
            limitType: "primary",
            resetEpochSeconds: 1774000000,
          })
        );
      }
      return Promise.resolve(mockLanguages[repo] ?? {});
    });

    const result = await analyzeProfile(mockClient, "alice", {
      now: fixedNow,
      concurrency: 1, // Sequential execution to test deterministic stop
    });

    expect(result.metadata.status).toBe("partial");
    expect(result.metadata.warnings.some((w) => w.includes("rate limit reached"))).toBe(true);
    // First repository languages were collected
    expect(result.languageFootprint.totalBytes).toBe(75000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Capped to Configured Repository Limit (30)
  // ───────────────────────────────────────────────────────────────────────────

  it("caps repository fetching to a maximum of 30", async () => {
    await analyzeProfile(mockClient, "alice", {
      repositoryLimit: 100, // Attempt to request 100
      now: fixedNow,
    });

    expect(mockClient.getRepositories).toHaveBeenCalledWith("alice", {
      limit: 30,
      sort: "updated",
      direction: "desc",
      type: "owner",
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Determinism (Identical Inputs Produce Identical Output)
  // ───────────────────────────────────────────────────────────────────────────

  it("produces deterministic output for identical inputs and injected now", async () => {
    const result1 = await analyzeProfile(mockClient, "alice", { now: fixedNow });
    const result2 = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    // Exclude wall-clock durationMs from determinism snapshot
    const stripDuration = (res: typeof result1) => {
      const { metadata, ...rest } = res;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { durationMs, ...cleanMetadata } = metadata;
      return { ...rest, metadata: cleanMetadata };
    };

    expect(JSON.stringify(stripDuration(result1))).toBe(
      JSON.stringify(stripDuration(result2))
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Error Handling & Validation
  // ───────────────────────────────────────────────────────────────────────────

  it("throws PipelineInvalidUsernameError for empty or invalid usernames", async () => {
    await expect(analyzeProfile(mockClient, "")).rejects.toThrow(PipelineInvalidUsernameError);
    await expect(analyzeProfile(mockClient, "   ")).rejects.toThrow(PipelineInvalidUsernameError);
    await expect(analyzeProfile(mockClient, "-invalid-start")).rejects.toThrow(
      PipelineInvalidUsernameError
    );
    await expect(analyzeProfile(mockClient, "invalid--double-hyphen")).rejects.toThrow(
      PipelineInvalidUsernameError
    );
    await expect(
      analyzeProfile(mockClient, "this-username-is-longer-than-the-thirty-nine-character-limit")
    ).rejects.toThrow(PipelineInvalidUsernameError);
  });

  it("throws PipelineUserNotFoundError when GitHub returns 404 for user", async () => {
    mockClient.getUser = vi
      .fn()
      .mockRejectedValue(new GitHubUserNotFoundError("nonexistent-user"));

    await expect(analyzeProfile(mockClient, "nonexistent-user")).rejects.toThrow(
      PipelineUserNotFoundError
    );
  });

  it("throws PipelineRateLimitExhaustedError when rate limit is hit on user fetch", async () => {
    mockClient.getUser = vi
      .fn()
      .mockRejectedValue(
        new GitHubRateLimitError("API rate limit exceeded", {
          status: 403,
          limitType: "primary",
          resetEpochSeconds: 1774000000,
        })
      );

    await expect(analyzeProfile(mockClient, "alice")).rejects.toThrow(
      PipelineRateLimitExhaustedError
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Forked & Archived Repositories
  // ───────────────────────────────────────────────────────────────────────────

  it("processes forked and archived repositories without synthetic omission", async () => {
    const result = await analyzeProfile(mockClient, "alice", { now: fixedNow });

    const forkedRepo = result.repositories.find((r) => r.isFork);
    expect(forkedRepo).toBeDefined();
    expect(forkedRepo?.name).toBe("systems-tool");

    // The archived/forked repo's Rust code is reflected in footprint
    expect(result.languageFootprint.entries.some((e) => e.language === "Rust")).toBe(true);

    // Recency correctly reflects the last push date (2025-01-01)
    const rustTech = result.technologies.find((t) => t.id === "rust");
    expect(rustTech?.mostRecentAt).toBe("2025-01-01T00:00:00Z");
  });
});
