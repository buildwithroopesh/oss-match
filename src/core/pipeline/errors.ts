/**
 * Pipeline Error Taxonomy
 *
 * Provides typed, structured error classes for the profile analysis pipeline.
 * Downstream consumers (route handlers, UI) can inspect error types and metadata
 * to render accurate error states.
 */

import { GitHubError } from "../github/errors";

export interface PipelineErrorDetails {
  username?: string;
  statusCode?: number;
  cause?: unknown;
  retryAfterSeconds?: number;
  resetTimeEpoch?: number;
}

/** Base class for all pipeline errors */
export class PipelineError extends Error {
  readonly code: string;
  readonly details: PipelineErrorDetails;

  constructor(message: string, code = "PIPELINE_ERROR", details: PipelineErrorDetails = {}) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a GitHub username input fails format or character constraints */
export class PipelineInvalidUsernameError extends PipelineError {
  constructor(message: string, details: PipelineErrorDetails = {}) {
    super(message, "INVALID_USERNAME", details);
    this.name = "PipelineInvalidUsernameError";
  }
}

/** Thrown when the target GitHub user does not exist (404) */
export class PipelineUserNotFoundError extends PipelineError {
  constructor(username: string, details: PipelineErrorDetails = {}) {
    super(
      `GitHub user "${username}" was not found. Please verify the username and try again.`,
      "USER_NOT_FOUND",
      { ...details, username }
    );
    this.name = "PipelineUserNotFoundError";
  }
}

/** Thrown when the GitHub API rate limit is exhausted and requests cannot proceed */
export class PipelineRateLimitExhaustedError extends PipelineError {
  readonly limitType: "primary" | "secondary";
  readonly resetTimeEpoch?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    limitType: "primary" | "secondary",
    details: PipelineErrorDetails & { resetTimeEpoch?: number; retryAfterSeconds?: number } = {}
  ) {
    super(message, "RATE_LIMIT_EXHAUSTED", details);
    this.name = "PipelineRateLimitExhaustedError";
    this.limitType = limitType;
    this.resetTimeEpoch = details.resetTimeEpoch;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

/** Thrown on unexpected GitHub API failures */
export class PipelineApiError extends PipelineError {
  constructor(message: string, details: PipelineErrorDetails = {}) {
    super(message, "API_ERROR", details);
    this.name = "PipelineApiError";
  }
}

/**
 * Maps a GitHubError to an appropriate PipelineError.
 */
export function mapGitHubErrorToPipelineError(error: unknown, username: string): PipelineError {
  if (error instanceof GitHubError) {
    if (error.status === 404) {
      return new PipelineUserNotFoundError(username, { statusCode: 404, cause: error });
    }

    if ("limitType" in error) {
      const rateLimitErr = error as {
        limitType?: "primary" | "secondary";
        resetEpochSeconds?: number;
        resetTimeEpoch?: number;
        retryAfterSeconds?: number;
      };
      return new PipelineRateLimitExhaustedError(
        error.message,
        rateLimitErr.limitType ?? "primary",
        {
          username,
          statusCode: error.status,
          resetTimeEpoch: rateLimitErr.resetEpochSeconds ?? rateLimitErr.resetTimeEpoch,
          retryAfterSeconds: rateLimitErr.retryAfterSeconds,
          cause: error,
        }
      );
    }

    return new PipelineApiError(error.message, {
      username,
      statusCode: error.status,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new PipelineApiError(error.message, { username, cause: error });
  }

  return new PipelineApiError("An unknown error occurred during profile analysis.", {
    username,
    cause: error,
  });
}
