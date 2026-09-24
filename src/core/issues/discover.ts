/**
 * GitHub Issue Discovery Engine
 *
 * Discovers open-source issues matching configurable criteria, paginates as needed,
 * deduplicates results, extracts observable suitability signals, and returns a
 * deterministically ordered result set ready for the matching engine.
 */

import type { GitHubClient } from "../github/client";
import type {
  IssueSearchCriteria,
  IssueDiscoveryResult,
  DiscoveredIssue,
  DiscoveryMetadata,
} from "../types/issues";
import { buildIssueSearchQuery } from "./queryBuilder";
import { extractIssueSignals } from "./signals";
import {
  DiscoveryInvalidInputError,
  mapGitHubErrorToDiscoveryError,
} from "./errors";
import { GitHubRateLimitError } from "../github/errors";

const DEFAULT_LIMIT = 30;
const DEFAULT_PER_PAGE = 30;
const MAX_PER_PAGE = 100;

/**
 * Discovers open-source GitHub issues matching the provided criteria.
 *
 * @param client Instantiated GitHubClient (Milestone 2)
 * @param criteria Configurable search criteria and injected `now`
 * @returns Comprehensive IssueDiscoveryResult with observable signals and execution metadata
 */
export async function discoverIssues(
  client: GitHubClient,
  criteria: IssueSearchCriteria = {}
): Promise<IssueDiscoveryResult> {
  // 1. Validate inputs
  const targetLimit = criteria.limit !== undefined ? criteria.limit : DEFAULT_LIMIT;
  if (targetLimit <= 0) {
    throw new DiscoveryInvalidInputError(
      `Issue discovery limit must be a positive integer. Received: ${targetLimit}`
    );
  }

  const startPage = criteria.page !== undefined ? criteria.page : 1;
  if (startPage <= 0) {
    throw new DiscoveryInvalidInputError(
      `Starting page must be a positive integer. Received: ${startPage}`
    );
  }

  const requestedPerPage = criteria.perPage !== undefined ? criteria.perPage : DEFAULT_PER_PAGE;
  const perPage = Math.max(1, Math.min(requestedPerPage, MAX_PER_PAGE, targetLimit));

  // Deterministic reference time
  const now = criteria.now ?? new Date();

  // 2. Build GitHub search query
  const query = buildIssueSearchQuery(criteria);
  if (!query.trim()) {
    throw new DiscoveryInvalidInputError("Generated search query is empty.");
  }

  // 3. Execution state
  const discovered: DiscoveredIssue[] = [];
  const seenIds = new Set<number>();
  const warnings: string[] = [];
  let currentPage = startPage;
  let pagesFetched = 0;
  let totalAvailableCount = 0;
  let isPartial = false;

  // 4. Paginate until targetLimit is reached or results exhausted
  while (discovered.length < targetLimit) {
    let searchResult;
    try {
      searchResult = await client.searchIssues(query, {
        page: currentPage,
        perPage,
        sort: criteria.sort ?? "updated",
        order: criteria.order ?? "desc",
      });
    } catch (err) {
      // If error occurs on the very first page, map and rethrow
      if (pagesFetched === 0) {
        throw mapGitHubErrorToDiscoveryError(err, query);
      }

      // If error occurs mid-pagination, capture as partial failure and preserve already collected issues
      isPartial = true;
      if (err instanceof GitHubRateLimitError) {
        warnings.push(
          `GitHub rate limit reached on page ${currentPage}. Returning ${discovered.length} issues collected before rate limit.`
        );
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Search pagination failed on page ${currentPage}: ${msg}`);
      }
      break;
    }

    pagesFetched += 1;
    totalAvailableCount = searchResult.totalCount;

    if (searchResult.issues.length === 0) {
      break;
    }

    // Deduplicate and extract signals
    for (const rawIssue of searchResult.issues) {
      if (seenIds.has(rawIssue.id)) {
        continue;
      }

      seenIds.add(rawIssue.id);
      const signals = extractIssueSignals(rawIssue, now);
      discovered.push({
        issue: rawIssue,
        signals,
      });

      if (discovered.length >= targetLimit) {
        break;
      }
    }

    // If GitHub returned fewer items than requested per_page, no further items exist
    if (searchResult.issues.length < perPage) {
      break;
    }

    // If we have traversed all available items on GitHub
    if (currentPage * perPage >= searchResult.totalCount) {
      break;
    }

    currentPage += 1;
  }

  // 5. Stable deterministic sorting
  // Preserve primary API order (updated/created desc), and apply stable tie-breaker on issue ID
  const sorted = [...discovered].sort((a, b) => {
    // Primary: compare timestamps if sorting by updated/created
    if (criteria.sort === "created") {
      const timeA = new Date(a.issue.createdAt).getTime();
      const timeB = new Date(b.issue.createdAt).getTime();
      if (timeA !== timeB) {
        return criteria.order === "asc" ? timeA - timeB : timeB - timeA;
      }
    } else {
      // Default: updated desc
      const timeA = new Date(a.issue.updatedAt).getTime();
      const timeB = new Date(b.issue.updatedAt).getTime();
      if (timeA !== timeB) {
        return criteria.order === "asc" ? timeA - timeB : timeB - timeA;
      }
    }

    // Stable secondary tie-breaker: issue ID ascending
    return a.issue.id < b.issue.id ? -1 : a.issue.id > b.issue.id ? 1 : 0;
  });

  const finalIssues = sorted.slice(0, targetLimit);
  const hasMore =
    totalAvailableCount > finalIssues.length &&
    finalIssues.length >= targetLimit;

  // 6. Assemble metadata
  const metadata: DiscoveryMetadata = {
    searchedAt: now.toISOString(),
    query,
    totalAvailableCount,
    returnedCount: finalIssues.length,
    pagesFetched,
    hasMore,
    status: isPartial ? "partial" : "complete",
    warnings,
    rateLimitRemaining: client.lastRateLimit?.remaining,
  };

  return {
    issues: finalIssues,
    metadata,
  };
}
