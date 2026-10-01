/**
 * Server-side Issue Discovery & Browsing Helper
 *
 * NOTE: Belongs to the application infrastructure layer (src/lib), NOT src/core.
 * Orchestrates pure issue discovery with the server's GitHubClient singleton.
 */

import { discoverIssues } from "@/core/issues/discover";
import { DiscoveryError, DiscoveryRateLimitExhaustedError } from "@/core/issues/errors";
import type { DiscoveredIssue, DiscoveryMetadata, IssueSearchCriteria } from "@/core/types/issues";
import { getGitHubClient } from "@/lib/github";

export type BrowseIssuesState =
  | {
      status: "success";
      issues: DiscoveredIssue[];
      metadata: DiscoveryMetadata;
    }
  | {
      status: "error";
      error: string;
      code?: string;
      resetTimeEpoch?: number;
    };

export interface GetBrowseIssuesOptions {
  language?: string;
  friendlyOnly?: boolean;
  query?: string;
  limit?: number;
  now?: Date;
}

/**
 * Discovers and returns browseable open-source issues from GitHub.
 * Centralized on the server, leveraging GitHub API token and memory cache.
 */
export async function getBrowseIssues(
  options: GetBrowseIssuesOptions = {}
): Promise<BrowseIssuesState> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 30;

  try {
    const client = getGitHubClient();

    const criteria: IssueSearchCriteria = {
      state: "open",
      excludeArchived: true,
      limit,
      now,
      hydrateRepositories: true,
    };

    if (
      options.language &&
      options.language.trim() &&
      options.language.trim().toUpperCase() !== "ALL"
    ) {
      criteria.languages = [options.language.trim()];
    }

    if (options.friendlyOnly) {
      criteria.labels = ["good first issue"];
    }

    if (options.query && options.query.trim()) {
      criteria.keywords = [options.query.trim()];
    }

    const result = await discoverIssues(client, criteria);

    return {
      status: "success",
      issues: result.issues,
      metadata: result.metadata,
    };
  } catch (err) {
    if (err instanceof DiscoveryRateLimitExhaustedError) {
      return {
        status: "error",
        error: "GitHub API rate limit reached. Please wait for the quota to reset.",
        code: "RATE_LIMIT_EXHAUSTED",
        resetTimeEpoch: err.resetTimeEpoch,
      };
    }

    if (err instanceof DiscoveryError) {
      return {
        status: "error",
        error: err.message,
        code: err.code,
        resetTimeEpoch: err.details.resetTimeEpoch,
      };
    }

    return {
      status: "error",
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while discovering open source issues.",
    };
  }
}
