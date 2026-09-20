/**
 * GitHub API Error Taxonomy
 *
 * Strongly typed error hierarchy for all GitHub API transport,
 * authentication, validation, rate-limiting, and network failures.
 */

import type { RateLimitInfo } from "../types/github";

export abstract class GitHubError extends Error {
  readonly status?: number;
  readonly endpoint?: string;
  readonly rateLimit?: RateLimitInfo;

  constructor(message: string, options?: { status?: number; endpoint?: string; rateLimit?: RateLimitInfo; cause?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.status = options?.status;
    this.endpoint = options?.endpoint;
    this.rateLimit = options?.rateLimit;
    if (options?.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when user input fails client validation (e.g. empty username, invalid parameters) */
export class GitHubInvalidInputError extends GitHubError {
  constructor(message: string, options?: { endpoint?: string }) {
    super(message, { status: 400, endpoint: options?.endpoint });
  }
}

/** Thrown when a GitHub user profile is not found (404) */
export class GitHubUserNotFoundError extends GitHubError {
  readonly username: string;

  constructor(username: string, options?: { endpoint?: string; rateLimit?: RateLimitInfo }) {
    super(`GitHub user '@${username}' not found.`, {
      status: 404,
      endpoint: options?.endpoint,
      rateLimit: options?.rateLimit,
    });
    this.username = username;
  }
}

/** Thrown when a repository or issue resource is not found (404) */
export class GitHubResourceNotFoundError extends GitHubError {
  readonly resource: string;

  constructor(resource: string, options?: { endpoint?: string; rateLimit?: RateLimitInfo }) {
    super(`GitHub resource '${resource}' not found.`, {
      status: 404,
      endpoint: options?.endpoint,
      rateLimit: options?.rateLimit,
    });
    this.resource = resource;
  }
}

/** Thrown when request authentication fails (401 Bad Credentials or revoked token) */
export class GitHubUnauthorizedError extends GitHubError {
  constructor(message = "GitHub API authorization failed. Please verify your GITHUB_API_TOKEN credential.", options?: { endpoint?: string; rateLimit?: RateLimitInfo }) {
    super(message, {
      status: 401,
      endpoint: options?.endpoint,
      rateLimit: options?.rateLimit,
    });
  }
}

/** Thrown when request is forbidden (403 without rate limit exhaustion, e.g. permission/resource access denied) */
export class GitHubForbiddenError extends GitHubError {
  constructor(message = "GitHub API request forbidden.", options?: { endpoint?: string; rateLimit?: RateLimitInfo }) {
    super(message, {
      status: 403,
      endpoint: options?.endpoint,
      rateLimit: options?.rateLimit,
    });
  }
}

export type RateLimitType = "primary" | "secondary";

/** Thrown when primary rate limit is exhausted (remaining=0) or secondary rate limiting is active */
export class GitHubRateLimitError extends GitHubError {
  readonly limitType: RateLimitType;
  readonly isPrimaryLimit: boolean;
  readonly isSecondaryLimit: boolean;
  readonly resetEpochSeconds?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    options: {
      status: number;
      limitType: RateLimitType;
      endpoint?: string;
      rateLimit?: RateLimitInfo;
      resetEpochSeconds?: number;
      retryAfterSeconds?: number;
    }
  ) {
    super(message, {
      status: options.status,
      endpoint: options.endpoint,
      rateLimit: options.rateLimit,
    });
    this.limitType = options.limitType;
    this.isPrimaryLimit = options.limitType === "primary";
    this.isSecondaryLimit = options.limitType === "secondary";
    this.resetEpochSeconds = options.resetEpochSeconds;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

/** Thrown on transport, DNS, or network connection drop */
export class GitHubNetworkError extends GitHubError {
  constructor(message: string, options?: { endpoint?: string; cause?: unknown }) {
    super(`GitHub network error: ${message}`, {
      endpoint: options?.endpoint,
      cause: options?.cause,
    });
  }
}

/** Thrown when GitHub response JSON fails Zod boundary schema validation */
export class GitHubMalformedResponseError extends GitHubError {
  readonly validationIssues?: unknown[];

  constructor(message: string, options?: { endpoint?: string; validationIssues?: unknown[]; cause?: unknown }) {
    super(`Malformed GitHub API response: ${message}`, {
      status: 502,
      endpoint: options?.endpoint,
      cause: options?.cause,
    });
    this.validationIssues = options?.validationIssues;
  }
}

/** Generic catch-all for unexpected GitHub HTTP errors (e.g. 500, 503) */
export class GitHubApiError extends GitHubError {
  constructor(message: string, options?: { status?: number; endpoint?: string; rateLimit?: RateLimitInfo; cause?: unknown }) {
    super(message, options);
  }
}
