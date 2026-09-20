/**
 * Core types — Matching engine
 *
 * Implemented in Milestone 8 (Matching engine).
 */

import type { GitHubIssue } from "./github";
import type { TechnologyProfile } from "./technology";

/** Normalized value between 0 and 1 for a single scoring component */
export interface ScoringComponent {
  name: string;
  weight: number;
  value: number | null;
  explanation: string;
}

/** A fully scored issue with explanation */
export interface MatchResult {
  issue: GitHubIssue;
  /** Score from 0 to 100 */
  score: number;
  components: ScoringComponent[];
  reasons: MatchReason[];
  gaps: MatchGap[];
  difficultyEstimate: DifficultyEstimate;
  activityLevel: ActivityLevel;
}

/** A positive reason explaining why an issue matches */
export interface MatchReason {
  label: string;
  technology?: string;
}

/** A potential knowledge gap between the user and the issue */
export interface MatchGap {
  label: string;
  technology?: string;
}

export type DifficultyEstimate =
  | "beginner"
  | "beginner-intermediate"
  | "intermediate"
  | "intermediate-advanced"
  | "advanced"
  | "unknown";

export type ActivityLevel =
  | "recently-active"
  | "moderately-active"
  | "limited-activity";

/** Input to the matching engine — injecting time keeps it deterministic */
export interface MatchEngineInput {
  profile: TechnologyProfile;
  issues: GitHubIssue[];
  /** Current time — injected so the engine is pure and testable */
  now: Date;
}

/** Output from the matching engine */
export interface MatchEngineOutput {
  results: MatchResult[];
  profileUsed: TechnologyProfile;
  scoredAt: string;
}
