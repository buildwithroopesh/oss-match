/**
 * Core types — Profile Analysis Pipeline
 *
 * Implemented in Milestone 5 (Profile analysis pipeline).
 *
 * Defines the input options, execution metadata, and aggregated result
 * for the end-to-end profile analysis pipeline.
 */

import type { GitHubUser, GitHubRepository } from "./github";
import type { LanguageFootprint } from "./language";
import type { DetectedTechnology, TechnologyProfile } from "./technology";
import type { TechnologyRegistry } from "../technology/registry";

/** Options for configuring the profile analysis execution */
export interface ProfileAnalysisOptions {
  /** Maximum number of repositories to analyze (default: 30) */
  repositoryLimit?: number;
  /** Injected reference time for deterministic recency and timestamps */
  now?: Date;
  /** Custom technology registry (defaults to defaultTechnologyRegistry) */
  registry?: TechnologyRegistry;
  /** Maximum concurrent language fetch requests (default: 5) */
  concurrency?: number;
}

/** Execution metadata and diagnostic telemetry */
export interface ProfileAnalysisMetadata {
  /** Deterministic ISO 8601 timestamp of analysis derived from injected `now` */
  analyzedAt: string;
  /** Number of repositories requested from GitHub API */
  repositoriesRequested: number;
  /** Number of public repositories returned by GitHub */
  repositoriesFound: number;
  /** Number of repositories successfully analyzed */
  repositoriesAnalyzed: number;
  /** Number of repositories skipped (e.g. empty or failed language fetch) */
  repositoriesSkipped: number;
  /** Number of repositories for which languages were successfully fetched */
  languagesFetchedCount: number;
  /** Remaining rate limit quota observed from response headers */
  rateLimitRemaining?: number;
  /** Non-fatal warnings captured during execution (e.g. partial language fetch failures) */
  warnings: string[];
  /** Overall pipeline status */
  status: "complete" | "partial";
  /** Optional wall-clock diagnostic duration in milliseconds (diagnostic only, does not affect profile) */
  durationMs?: number;
}

/** The complete result of an end-to-end profile analysis */
export interface ProfileAnalysisResult {
  /** Validated GitHub user entity */
  user: GitHubUser;
  /** Analyzed repositories sorted by recent updates */
  repositories: GitHubRepository[];
  /** Deterministic language footprint summing to exactly 100% */
  languageFootprint: LanguageFootprint;
  /** Detected technologies with evidence audit trails */
  technologies: DetectedTechnology[];
  /** Consolidated TechnologyProfile ready for downstream consumption */
  profile: TechnologyProfile;
  /** Pipeline execution metadata and warnings */
  metadata: ProfileAnalysisMetadata;
}
