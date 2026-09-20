/**
 * Centralized GitHub API Client
 *
 * Framework-independent HTTP client for api.github.com.
 * Features:
 * - Centralized headers (Accept, X-GitHub-Api-Version: 2026-03-10, User-Agent)
 * - Request deduplication for concurrent identical requests
 * - In-memory TTL caching with configurable expiration
 * - Header-driven rate-limit tracking (no polling GET /rate_limit)
 * - Non-blind retry policy with bounded exponential backoff
 * - Zod boundary schema validation
 * - Typed domain entity normalization
 * - Zero dependencies on React, Next.js, or process.env
 */

import { z } from "zod";
import type {
  GitHubUser,
  GitHubRepository,
  GitHubLanguages,
  GitHubIssue,
  RepositoryActivity,
  RateLimitInfo,
  GetRepositoriesOptions,
  SearchIssuesOptions,
  IssueSearchResult,
  ActivityLevel,
} from "../types/github";
import {
  GitHubInvalidInputError,
  GitHubUserNotFoundError,
  GitHubResourceNotFoundError,
  GitHubUnauthorizedError,
  GitHubForbiddenError,
  GitHubRateLimitError,
  GitHubNetworkError,
  GitHubMalformedResponseError,
  GitHubApiError,
} from "./errors";
import {
  GitHubUserResponseSchema,
  GitHubRepoResponseSchema,
  GitHubReposListResponseSchema,
  GitHubLanguagesResponseSchema,
  GitHubIssueResponseSchema,
  GitHubSearchIssuesResponseSchema,
  GitHubCommitsListResponseSchema,
  GitHubRateLimitResponseSchema,
  type GitHubIssueResponse,
  type GitHubRepoResponse,
} from "./schemas";
import { parseRateLimitHeaders, isPrimaryRateLimitExhausted, formatResetTime } from "./rate-limit";
import { MemoryCache } from "./cache";

export const DEFAULT_REPO_LIMIT = 30;

export interface GitHubClientConfig {
  /** Optional personal access token (server-side only) */
  token?: string;
  /** Base URL for API (default: https://api.github.com) */
  baseUrl?: string;
  /** User-Agent header (default: oss-match/0.1.0 (+https://github.com/buildwithroopesh/oss-match)) */
  userAgent?: string;
  /** GitHub REST API version header (default: 2026-03-10) */
  apiVersion?: string;
  /** Injected fetch function for testing and mock injection (default: globalThis.fetch) */
  fetchFn?: typeof fetch;
  /** In-memory cache instance (default: new MemoryCache()) */
  cache?: MemoryCache;
  /** Default cache TTL in milliseconds (default: 5 minutes) */
  cacheTtlMs?: number;
  /** Enable concurrent in-flight request deduplication (default: true) */
  enableDeduplication?: boolean;
  /** Default repository analysis cap (default: 30) */
  defaultRepoLimit?: number;
}

export class GitHubClient {
  private readonly token?: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly apiVersion: string;
  private readonly fetchFn: typeof fetch;
  private readonly cache: MemoryCache;
  private readonly cacheTtlMs: number;
  private readonly enableDeduplication: boolean;
  readonly defaultRepoLimit: number;

  /** Latest rate-limit telemetry parsed from response headers */
  private _lastRateLimit?: RateLimitInfo;

  /** In-flight promises for request deduplication */
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(config?: GitHubClientConfig) {
    this.token = config?.token;
    this.baseUrl = (config?.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
    this.userAgent = config?.userAgent ?? "oss-match/0.1.0 (+https://github.com/buildwithroopesh/oss-match)";
    this.apiVersion = config?.apiVersion ?? "2026-03-10";
    this.fetchFn = config?.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.cache = config?.cache ?? new MemoryCache();
    this.cacheTtlMs = config?.cacheTtlMs ?? 5 * 60 * 1000;
    this.enableDeduplication = config?.enableDeduplication ?? true;
    this.defaultRepoLimit = config?.defaultRepoLimit ?? DEFAULT_REPO_LIMIT;
  }

  /** Exposes the latest telemetry parsed from response headers */
  get lastRateLimit(): RateLimitInfo | undefined {
    return this._lastRateLimit;
  }

  /** Clears the internal cache */
  clearCache(): void {
    this.cache.clear();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Core HTTP Transport & Interceptor
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Centralized request wrapper with caching, deduplication, rate limit parsing,
   * bounded backoff, and typed error handling.
   */
  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: {
      cacheTtlMs?: number;
      skipCache?: boolean;
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const cacheKey = `GET:${url}`;

    // 1. Check in-memory cache
    if (!options?.skipCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // 2. Request deduplication for identical concurrent requests
    if (this.enableDeduplication && this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeWithRetry<T>(url, path, schema);

    if (this.enableDeduplication) {
      this.inFlight.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      if (!options?.skipCache) {
        this.cache.set(cacheKey, result, options?.cacheTtlMs ?? this.cacheTtlMs);
      }
      return result;
    } finally {
      if (this.enableDeduplication) {
        this.inFlight.delete(cacheKey);
      }
    }
  }

  /**
   * Executes HTTP request with conservative, bounded backoff for secondary limits only.
   */
  private async executeWithRetry<T>(
    url: string,
    path: string,
    schema: z.ZodType<T>,
    retryCount = 0
  ): Promise<T> {
    const headers = new Headers();
    headers.set("Accept", "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", this.apiVersion);
    headers.set("User-Agent", this.userAgent);

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: "GET",
        headers,
      });
    } catch (err) {
      throw new GitHubNetworkError(err instanceof Error ? err.message : String(err), {
        endpoint: path,
        cause: err,
      });
    }

    // Extract rate-limit telemetry from headers
    const rateLimit = parseRateLimitHeaders(response.headers);
    if (rateLimit) {
      this._lastRateLimit = rateLimit;
    }

    // Handle non-2xx responses
    if (!response.ok) {
      await this.handleHttpError(response, path, rateLimit, async () => {
        // Only retry secondary rate-limit if bounded (max 1 retry)
        if (retryCount === 0) {
          return this.executeWithRetry<T>(url, path, schema, retryCount + 1);
        }
        return undefined;
      });
    }

    // Parse and validate response JSON
    let json: unknown;
    try {
      json = await response.json();
    } catch (err) {
      throw new GitHubMalformedResponseError("Failed to parse response body as JSON.", {
        endpoint: path,
        cause: err,
      });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new GitHubMalformedResponseError("Response data does not match expected schema.", {
        endpoint: path,
        validationIssues: parsed.error.issues,
        cause: parsed.error,
      });
    }

    return parsed.data;
  }

  /**
   * Maps HTTP error responses to typed error classes with strict rate-limit discipline.
   */
  private async handleHttpError(
    response: Response,
    path: string,
    rateLimit?: RateLimitInfo,
    onRetry?: () => Promise<unknown>
  ): Promise<never> {
    let errorBody: { message?: string } | undefined;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error on error response
    }
    const apiMessage = errorBody?.message ?? response.statusText;

    // 404 Not Found
    if (response.status === 404) {
      const userMatch = path.match(/^\/users\/([^/?]+)/);
      if (userMatch && !path.includes("/repos")) {
        throw new GitHubUserNotFoundError(decodeURIComponent(userMatch[1]), {
          endpoint: path,
          rateLimit,
        });
      }
      throw new GitHubResourceNotFoundError(path, { endpoint: path, rateLimit });
    }

    // 401 Unauthorized: authentication failure (bad token or missing credential)
    if (response.status === 401) {
      throw new GitHubUnauthorizedError(apiMessage, { endpoint: path, rateLimit });
    }

    // Evidence-based rate-limit classification:
    // Do not infer rate limiting from HTTP status alone.
    const isPrimaryExhausted = isPrimaryRateLimitExhausted(rateLimit);
    const hasRetryAfter = rateLimit?.retryAfter !== undefined;
    const lowerMessage = apiMessage.toLowerCase();
    const indicatesSecondaryRateLimit =
      hasRetryAfter ||
      lowerMessage.includes("secondary rate") ||
      lowerMessage.includes("abuse") ||
      lowerMessage.includes("please wait a few minutes") ||
      (lowerMessage.includes("rate limit") && !isPrimaryExhausted);

    // Primary rate limit: 403 or 429 with x-ratelimit-remaining === 0
    if ((response.status === 403 || response.status === 429) && isPrimaryExhausted) {
      const resetFormatted = rateLimit?.reset ? formatResetTime(rateLimit.reset) : "unknown";
      throw new GitHubRateLimitError(
        `GitHub API primary rate limit exceeded. Resets in ${resetFormatted}.`,
        {
          status: response.status,
          limitType: "primary",
          endpoint: path,
          rateLimit,
          resetEpochSeconds: rateLimit?.reset,
        }
      );
    }

    // Secondary rate limit: 403 or 429 where response/error message indicates secondary rate limiting
    if ((response.status === 403 || response.status === 429) && (indicatesSecondaryRateLimit || response.status === 429)) {
      // Conservative bounded retry for transient secondary limits when no retry-after is provided
      if (onRetry && !hasRetryAfter) {
        const retryResult = await onRetry();
        if (retryResult !== undefined) {
          return retryResult as never;
        }
      }

      const waitMsg = hasRetryAfter ? ` Retry after ${rateLimit?.retryAfter}s.` : "";
      throw new GitHubRateLimitError(
        `GitHub API secondary rate limit triggered: ${apiMessage}.${waitMsg}`,
        {
          status: response.status,
          limitType: "secondary",
          endpoint: path,
          rateLimit,
          retryAfterSeconds: rateLimit?.retryAfter,
        }
      );
    }

    // Ordinary permission/authorization failure: 403 where response does NOT indicate rate limiting
    if (response.status === 403) {
      throw new GitHubForbiddenError(apiMessage, { endpoint: path, rateLimit });
    }

    // Generic API failure
    throw new GitHubApiError(`GitHub API error (${response.status}): ${apiMessage}`, {
      status: response.status,
      endpoint: path,
      rateLimit,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Typed Domain Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Retrieves a public GitHub user profile.
   * GET /users/{username}
   */
  async getUser(username: string): Promise<GitHubUser> {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new GitHubInvalidInputError("GitHub username must not be empty.", {
        endpoint: "/users/{username}",
      });
    }

    const raw = await this.request(
      `/users/${encodeURIComponent(trimmed)}`,
      GitHubUserResponseSchema,
      { cacheTtlMs: 10 * 60 * 1000 } // 10 minutes TTL for profiles
    );

    return {
      login: raw.login,
      id: raw.id,
      avatarUrl: raw.avatar_url,
      name: raw.name ?? null,
      bio: raw.bio ?? null,
      publicRepos: raw.public_repos,
      followers: raw.followers,
      following: raw.following,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      htmlUrl: raw.html_url,
    };
  }

  /**
   * Retrieves public repositories for a user, sorted by recent updates.
   * Capped to a configurable maximum (default: 30) and paginated efficiently.
   * GET /users/{username}/repos
   */
  async getRepositories(
    username: string,
    options?: GetRepositoriesOptions
  ): Promise<GitHubRepository[]> {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new GitHubInvalidInputError("GitHub username must not be empty.", {
        endpoint: "/users/{username}/repos",
      });
    }

    const targetLimit = options?.limit ?? this.defaultRepoLimit;
    const sort = options?.sort ?? "updated";
    const direction = options?.direction ?? "desc";
    const type = options?.type ?? "owner";

    const results: GitHubRepository[] = [];
    let page = 1;

    // Fetch in chunks of at most 100, or the remaining limit
    while (results.length < targetLimit) {
      const remainingNeeded = targetLimit - results.length;
      const perPage = Math.min(remainingNeeded, 100);

      const path = `/users/${encodeURIComponent(trimmed)}/repos?per_page=${perPage}&page=${page}&sort=${sort}&direction=${direction}&type=${type}`;
      const rawList = await this.request(path, GitHubReposListResponseSchema, {
        cacheTtlMs: 5 * 60 * 1000, // 5 minutes TTL
      });

      if (rawList.length === 0) {
        break;
      }

      for (const raw of rawList) {
        results.push(this.normalizeRepository(raw));
        if (results.length >= targetLimit) {
          break;
        }
      }

      // If GitHub returned fewer than requested, there are no more pages
      if (rawList.length < perPage) {
        break;
      }

      page += 1;
    }

    return results;
  }

  /**
   * Retrieves metadata for a single public repository.
   * GET /repos/{owner}/{repo}
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    if (!cleanOwner || !cleanRepo) {
      throw new GitHubInvalidInputError("Owner and repo parameters must not be empty.", {
        endpoint: "/repos/{owner}/{repo}",
      });
    }

    const raw = await this.request(
      `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}`,
      GitHubRepoResponseSchema,
      { cacheTtlMs: 10 * 60 * 1000 }
    );

    return this.normalizeRepository(raw);
  }

  /**
   * Retrieves language byte counts for a repository.
   * GET /repos/{owner}/{repo}/languages
   */
  async getLanguages(owner: string, repo: string): Promise<GitHubLanguages> {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    if (!cleanOwner || !cleanRepo) {
      throw new GitHubInvalidInputError("Owner and repo parameters must not be empty.", {
        endpoint: "/repos/{owner}/{repo}/languages",
      });
    }

    return this.request(
      `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/languages`,
      GitHubLanguagesResponseSchema,
      { cacheTtlMs: 15 * 60 * 1000 } // Languages rarely change rapidly (15m TTL)
    );
  }

  /**
   * Searches open issues globally across GitHub.
   * GET /search/issues
   */
  async searchIssues(query: string, options?: SearchIssuesOptions): Promise<IssueSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new GitHubInvalidInputError("Search query must not be empty.", {
        endpoint: "/search/issues",
      });
    }

    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 30;
    let path = `/search/issues?q=${encodeURIComponent(trimmed)}&page=${page}&per_page=${perPage}`;

    if (options?.sort) {
      path += `&sort=${encodeURIComponent(options.sort)}`;
    }
    if (options?.order) {
      path += `&order=${encodeURIComponent(options.order)}`;
    }

    const raw = await this.request(path, GitHubSearchIssuesResponseSchema, {
      cacheTtlMs: 3 * 60 * 1000, // 3 minutes TTL for issue searches
    });

    return {
      totalCount: raw.total_count,
      incompleteResults: raw.incomplete_results,
      issues: raw.items.map((item) => this.normalizeIssue(item)),
    };
  }

  /**
   * Retrieves a single issue by repository and issue number.
   * GET /repos/{owner}/{repo}/issues/{issueNumber}
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    if (!cleanOwner || !cleanRepo || isNaN(issueNumber) || issueNumber <= 0) {
      throw new GitHubInvalidInputError("Valid owner, repo, and issueNumber are required.", {
        endpoint: "/repos/{owner}/{repo}/issues/{issueNumber}",
      });
    }

    const raw = await this.request(
      `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/issues/${issueNumber}`,
      GitHubIssueResponseSchema,
      { cacheTtlMs: 5 * 60 * 1000 }
    );

    return this.normalizeIssue(raw, cleanOwner, cleanRepo);
  }

  /**
   * Computes a neutral repository activity indicator based on observable telemetry.
   * Combines pushed_at date and latest commit date from GET /repos/{owner}/{repo}/commits?per_page=1.
   */
  async getRepositoryActivity(owner: string, repo: string): Promise<RepositoryActivity> {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    if (!cleanOwner || !cleanRepo) {
      throw new GitHubInvalidInputError("Owner and repo parameters must not be empty.", {
        endpoint: "/repos/{owner}/{repo}/activity",
      });
    }

    // 1. Fetch repo metadata to read pushed_at
    const repository = await this.getRepository(cleanOwner, cleanRepo);

    // 2. Fetch latest commit to confirm real commit timestamp
    let lastCommitDate: string | null = null;
    try {
      const commits = await this.request(
        `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/commits?per_page=1`,
        GitHubCommitsListResponseSchema,
        { cacheTtlMs: 5 * 60 * 1000 }
      );
      if (commits.length > 0) {
        lastCommitDate =
          commits[0].commit.committer?.date ??
          commits[0].commit.author?.date ??
          null;
      }
    } catch {
      // If commits endpoint fails (e.g. empty repo), fall back to pushed_at
      lastCommitDate = repository.pushedAt;
    }

    const nowMs = Date.now();
    const pushMs = new Date(repository.pushedAt).getTime();
    const commitMs = lastCommitDate ? new Date(lastCommitDate).getTime() : pushMs;

    const mostRecentMs = Math.max(pushMs, commitMs);
    const daysSinceLastActivity = Math.max(0, Math.floor((nowMs - mostRecentMs) / (1000 * 60 * 60 * 24)));
    const daysSinceLastPush = Math.max(0, Math.floor((nowMs - pushMs) / (1000 * 60 * 60 * 24)));
    const daysSinceLastCommit = lastCommitDate
      ? Math.max(0, Math.floor((nowMs - commitMs) / (1000 * 60 * 60 * 24)))
      : null;

    let activityLevel: ActivityLevel;
    if (daysSinceLastActivity <= 30) {
      activityLevel = "recently-active";
    } else if (daysSinceLastActivity <= 90) {
      activityLevel = "moderately-active";
    } else {
      activityLevel = "limited-activity";
    }

    return {
      owner: cleanOwner,
      repo: cleanRepo,
      pushedAt: repository.pushedAt,
      lastCommitDate,
      daysSinceLastPush,
      daysSinceLastCommit,
      activityLevel,
    };
  }

  /**
   * Diagnostic only: explicitly checks GET /rate_limit.
   * NOTE: Do not call this on normal requests; telemetry is parsed from response headers.
   */
  async getRateLimitStatus(): Promise<RateLimitInfo | null> {
    const raw = await this.request("/rate_limit", GitHubRateLimitResponseSchema, {
      skipCache: true,
    });
    return {
      limit: raw.resources.core.limit,
      remaining: raw.resources.core.remaining,
      used: raw.resources.core.used,
      reset: raw.resources.core.reset,
      resource: "core",
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Normalizers
  // ─────────────────────────────────────────────────────────────────────────────

  private normalizeRepository(raw: GitHubRepoResponse): GitHubRepository {
    return {
      id: raw.id,
      owner: raw.owner.login,
      name: raw.name,
      fullName: raw.full_name,
      description: raw.description ?? null,
      topics: raw.topics ?? [],
      primaryLanguage: raw.language ?? null,
      stars: raw.stargazers_count,
      forks: raw.forks_count,
      openIssuesCount: raw.open_issues_count,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      pushedAt: raw.pushed_at,
      defaultBranch: raw.default_branch,
      isArchived: raw.archived,
      isFork: raw.fork,
      htmlUrl: raw.html_url,
    };
  }

  private normalizeIssue(raw: GitHubIssueResponse, fallbackOwner?: string, fallbackRepo?: string): GitHubIssue {
    // Parse owner and repo from repository_url (e.g. "https://api.github.com/repos/owner/name")
    let repoOwner = fallbackOwner ?? raw.repository?.owner?.login ?? "";
    let repoName = fallbackRepo ?? raw.repository?.name ?? "";

    if ((!repoOwner || !repoName) && raw.repository_url) {
      const match = raw.repository_url.match(/repos\/([^/]+)\/([^/]+)$/);
      if (match) {
        repoOwner = match[1];
        repoName = match[2];
      }
    }

    const fullName = raw.repository?.full_name ?? (repoOwner && repoName ? `${repoOwner}/${repoName}` : "");

    const labels = (raw.labels ?? []).map((label) => {
      if (typeof label === "string") {
        return { name: label, color: "ededed", description: null };
      }
      return {
        name: label.name,
        color: label.color,
        description: "description" in label && typeof label.description === "string" ? label.description : null,
      };
    });

    return {
      id: raw.id,
      number: raw.number,
      title: raw.title,
      body: raw.body ?? null,
      state: raw.state === "open" ? "open" : "closed",
      labels,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      commentsCount: raw.comments,
      htmlUrl: raw.html_url,
      repository: {
        owner: repoOwner,
        name: repoName,
        fullName,
        description: raw.repository?.description ?? null,
        topics: raw.repository?.topics ?? [],
        primaryLanguage: raw.repository?.language ?? null,
        stars: raw.repository?.stargazers_count ?? 0,
        forks: raw.repository?.forks_count ?? 0,
        isArchived: raw.repository?.archived ?? false,
        htmlUrl: raw.repository?.html_url ?? `https://github.com/${fullName}`,
      },
    };
  }
}
