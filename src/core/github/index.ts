/**
 * GitHub API Client Module
 *
 * Central entry point for all GitHub API operations.
 */

export { GitHubClient, DEFAULT_REPO_LIMIT, type GitHubClientConfig } from "./client";
export { MemoryCache, type CacheOptions } from "./cache";
export {
  parseRateLimitHeaders,
  isPrimaryRateLimitExhausted,
  formatResetTime,
} from "./rate-limit";

// Error taxonomy
export {
  GitHubError,
  GitHubInvalidInputError,
  GitHubUserNotFoundError,
  GitHubResourceNotFoundError,
  GitHubUnauthorizedError,
  GitHubForbiddenError,
  GitHubRateLimitError,
  type RateLimitType,
  GitHubNetworkError,
  GitHubMalformedResponseError,
  GitHubApiError,
} from "./errors";

// Zod schemas
export {
  GitHubUserResponseSchema,
  GitHubRepoResponseSchema,
  GitHubReposListResponseSchema,
  GitHubLanguagesResponseSchema,
  GitHubIssueResponseSchema,
  GitHubSearchIssuesResponseSchema,
  GitHubCommitsListResponseSchema,
  GitHubRateLimitResponseSchema,
  type GitHubUserResponse,
  type GitHubRepoResponse,
  type GitHubLanguagesResponse,
  type GitHubIssueResponse,
  type GitHubSearchIssuesResponse,
  type GitHubCommitItemResponse,
  type GitHubRateLimitResponse,
} from "./schemas";
