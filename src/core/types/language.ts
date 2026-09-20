/**
 * Core types — Language Footprint
 *
 * Framework-independent domain types representing analyzed code volume.
 *
 * Terminology rules:
 * - "language"
 * - "code bytes"
 * - "percentage of analyzed code"
 * - NEVER "skill"
 */

import type { GitHubLanguages } from "./github";

/** A single language entry in the analyzed code footprint */
export interface LanguageFootprintEntry {
  /** Programming language name (e.g. "TypeScript", "Python", "Other") */
  language: string;
  /** Volume of analyzed code in bytes */
  bytes: number;
  /** Rounded percentage of total analyzed code (sum of all entries is exactly 100, or 0 if no code) */
  percentage: number;
  /** Exact unrounded percentage for precision, analytics, and sorting */
  rawPercentage: number;
  /** Visual presentation color hex code (e.g. "#3178C6") */
  color: string;
}

/** Complete footprint summarizing analyzed languages across repositories */
export interface LanguageFootprint {
  /** Ranked list of languages (sorted by bytes descending, with "Other" last if present) */
  entries: LanguageFootprintEntry[];
  /** Total code bytes analyzed across all repositories */
  totalBytes: number;
  /** Number of repositories that contained analyzed code */
  analyzedRepositoriesCount: number;
  /** Number of repositories that were skipped (e.g. empty, 0 bytes, or no language data) */
  skippedRepositoriesCount: number;
  /** Total number of repositories inspected */
  totalRepositoriesCount: number;
  /** List of repository names that were skipped */
  skippedRepositories: string[];
  /** Number of distinct programming languages detected prior to collapsing into "Other" */
  uniqueLanguagesCount: number;
}

/** Input representing language data for a single repository */
export interface RepositoryLanguageData {
  /** Repository name or full identifier (e.g. "owner/repo") */
  repositoryName: string;
  /** Language byte counts from GitHub API, or null/undefined if empty */
  languages?: GitHubLanguages | null;
}

/** Configuration options for language aggregation */
export interface LanguageAggregationOptions {
  /** Maximum number of top languages to display before collapsing into "Other" (default: 8) */
  topLimit?: number;
  /** Whether to attach color metadata to entries (default: true) */
  attachColors?: boolean;
}
