/**
 * Core types — Issue Discovery
 *
 * Implemented in Milestone 7 (Issue Discovery).
 *
 * Provides domain models for searching open-source issues, capturing observable
 * facts/suitability signals, and structuring discovery execution telemetry.
 */

import type { GitHubIssue } from "./github";

/** Search criteria configuring the issue discovery engine */
export interface IssueSearchCriteria {
  /** Optional search terms or keywords matched against title and body */
  keywords?: string[];
  /** Target programming languages (e.g. ['typescript', 'python']) */
  languages?: string[];
  /** Target issue labels (e.g. ['help wanted', 'good first issue']) */
  labels?: string[];
  /** Issue state: 'open' | 'closed' | 'all' (default: 'open') */
  state?: "open" | "closed" | "all";
  /** Filter to a specific repository owner (user or organization) */
  owner?: string;
  /** Filter to a specific repository name (format: 'owner/name' or used alongside owner) */
  repo?: string;
  /** Filter to a specific organization */
  org?: string;
  /** Exclude archived repositories from search (default: true) */
  excludeArchived?: boolean;
  /** Search issues updated on or after this ISO date or YYYY-MM-DD */
  updatedAfter?: string;
  /** Search issues created on or after this ISO date or YYYY-MM-DD */
  createdAfter?: string;
  /** Minimum comments count qualifier */
  minComments?: number;
  /** Maximum comments count qualifier */
  maxComments?: number;
  /** Sort order for GitHub search API (default: 'updated') */
  sort?: "comments" | "reactions" | "created" | "updated" | "interactions";
  /** Sort direction for GitHub search API (default: 'desc') */
  order?: "asc" | "desc";
  /** Maximum total issues to return across pagination (default: 30) */
  limit?: number;
  /** Starting page number (default: 1) */
  page?: number;
  /** Page size per API request (default: 30, max: 100) */
  perPage?: number;
  /** Reference time for deterministic calculations (default: new Date()) */
  now?: Date;
}

/** Observable suitability facts extracted from an issue for later matching */
export interface IssueSignals {
  /** Whether the issue contains non-empty body text */
  hasBody: boolean;
  /** Character length of trimmed body text */
  bodyLength: number;
  /** Normalized lowercase label names attached to the issue */
  labelNames: string[];
  /** Whether the issue contains friendly contributor labels (e.g. 'good first issue', 'help wanted') */
  hasHelpWantedOrGoodFirstIssue: boolean;
  /** Repository primary programming language (if available from GitHub) */
  primaryLanguage: string | null;
  /** Repository topics / tags (if available from GitHub) */
  repositoryTopics: string[];
  /** Repository star count */
  repositoryStars: number;
  /** Repository fork count */
  repositoryForks: number;
  /** Whether the parent repository is archived */
  isRepositoryArchived: boolean;
  /** Total number of comments on the issue */
  commentsCount: number;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
  /** Days since creation relative to injected reference time */
  ageInDays: number;
  /** Days since last update relative to injected reference time */
  daysSinceUpdated: number;
}

/** A discovered issue candidate paired with its verified observable signals */
export interface DiscoveredIssue {
  /** Normalized GitHub issue entity */
  issue: GitHubIssue;
  /** Observable suitability signals extracted for downstream matching */
  signals: IssueSignals;
}

/** Execution telemetry and metadata for the discovery run */
export interface DiscoveryMetadata {
  /** Deterministic ISO 8601 timestamp of discovery derived from injected `now` */
  searchedAt: string;
  /** Exact GitHub search query string submitted */
  query: string;
  /** Total matching issues reported available by GitHub search API */
  totalAvailableCount: number;
  /** Number of issues returned in this result set */
  returnedCount: number;
  /** Number of pages fetched from GitHub API */
  pagesFetched: number;
  /** Whether additional pages remain available on GitHub */
  hasMore: boolean;
  /** Overall discovery status: 'complete' if requested limit satisfied without error, 'partial' otherwise */
  status: "complete" | "partial";
  /** Non-fatal warnings encountered (e.g. mid-search rate limit) */
  warnings: string[];
  /** Remaining rate limit observed from response headers */
  rateLimitRemaining?: number;
}

/** The aggregated result of an issue discovery execution */
export interface IssueDiscoveryResult {
  /** Discovered issues sorted deterministically with stable ID tie-breakers */
  issues: DiscoveredIssue[];
  /** Discovery execution telemetry and metadata */
  metadata: DiscoveryMetadata;
}
