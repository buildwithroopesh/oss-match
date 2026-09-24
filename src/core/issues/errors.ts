/**
 * Issue Discovery Error Taxonomy
 *
 * Provides typed, structured error classes for the issue discovery engine.
 */

import { GitHubError } from "../github/errors";

export interface DiscoveryErrorDetails {
  query?: string;
  statusCode?: number;
  cause?: unknown;
  retryAfterSeconds?: number;
  resetTimeEpoch?: number;
}

/** Base class for all discovery errors */
export class DiscoveryError extends Error {
  readonly code: string;
  readonly details: DiscoveryErrorDetails;

  constructor(
    message: string,
    code = "DISCOVERY_ERROR",
    details: DiscoveryErrorDetails = {}
  ) {
    super(message);
    this.name = "DiscoveryError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when search input parameters are invalid or contradictory */
export class DiscoveryInvalidInputError extends DiscoveryError {
  constructor(message: string, details: DiscoveryErrorDetails = {}) {
    super(message, "INVALID_INPUT", details);
    this.name = "DiscoveryInvalidInputError";
  }
}

/** Thrown when GitHub API rate limits prevent issue discovery */
export class DiscoveryRateLimitExhaustedError extends DiscoveryError {
  readonly limitType: "primary" | "secondary";
  readonly resetTimeEpoch?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    limitType: "primary" | "secondary",
    details: DiscoveryErrorDetails & {
      resetTimeEpoch?: number;
      retryAfterSeconds?: number;
    } = {}
  ) {
    super(message, "RATE_LIMIT_EXHAUSTED", details);
    this.name = "DiscoveryRateLimitExhaustedError";
    this.limitType = limitType;
    this.resetTimeEpoch = details.resetTimeEpoch;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

/** Thrown on unexpected GitHub API failures during search */
export class DiscoveryApiError extends DiscoveryError {
  constructor(message: string, details: DiscoveryErrorDetails = {}) {
    super(message, "API_ERROR", details);
    this.name = "DiscoveryApiError";
  }
}

/**
 * Maps a GitHubError or general error to an appropriate DiscoveryError.
 */
export function mapGitHubErrorToDiscoveryError(
  error: unknown,
  query?: string
): DiscoveryError {
  if (error instanceof GitHubError) {
    if ("limitType" in error) {
      const rateLimitErr = error as {
        limitType?: "primary" | "secondary";
        resetEpochSeconds?: number;
        resetTimeEpoch?: number;
        retryAfterSeconds?: number;
      };
      return new DiscoveryRateLimitExhaustedError(
        error.message,
        rateLimitErr.limitType ?? "primary",
        {
          query,
          statusCode: error.status,
          resetTimeEpoch:
            rateLimitErr.resetEpochSeconds ?? rateLimitErr.resetTimeEpoch,
          retryAfterSeconds: rateLimitErr.retryAfterSeconds,
          cause: error,
        }
      );
    }

    return new DiscoveryApiError(error.message, {
      query,
      statusCode: error.status,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new DiscoveryApiError(error.message, { query, cause: error });
  }

  return new DiscoveryApiError(
    "An unknown error occurred during issue discovery.",
    {
      query,
      cause: error,
    }
  );
}
