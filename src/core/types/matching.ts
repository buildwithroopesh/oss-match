/**
 * Core types — Matching engine
 *
 * Implemented in Milestone 8 (Matching engine).
 *
 * Provides domain models for evaluating the alignment between a user's verified
 * public technology profile and candidate open-source issues across 7 observable
 * scoring components with weight renormalization and factual explanations.
 */

import type { GitHubIssue } from "./github";
import type { TechnologyProfile } from "./technology";
import type { TechnologyRegistry } from "../technology/registry";
import type { DiscoveredIssue, IssueSignals } from "./issues";

/** The 7 observable matching engine components */
export type MatchComponentName =
  | "technology"
  | "language"
  | "framework"
  | "suitability"
  | "activity"
  | "freshness"
  | "difficulty";

/** Score and weight breakdown for a single evaluation component */
export interface MatchComponentScore {
  /** Identifier of the scoring component */
  name: MatchComponentName;
  /** Nominal base weight defined in the initial scoring model (e.g. 0.35) */
  baseWeight: number;
  /** Effective weight after renormalizing over available components (sums to 1.0) */
  effectiveWeight: number;
  /** Raw component score in [0, 1], or null if observable evidence is unavailable */
  score: number | null;
  /** Whether observable evidence was sufficient to evaluate this component */
  isAvailable: boolean;
  /** Factual explanation for this specific component */
  explanation: string;
}

/** Non-subjective, factual match explanation */
export interface MatchExplanation {
  /** Names of technologies matching user's detected technology evidence */
  matchedTechnologies: string[];
  /** Languages matching user's analyzed code footprint with user code percentages */
  matchedLanguages: Array<{ language: string; userPercentage: number }>;
  /** Repository topics matching user frameworks or technology evidence */
  matchedTopics: string[];
  /** Observable highlights of issue suitability (e.g. detailed body, discussion volume) */
  suitabilityHighlights: string[];
  /** Observable repository activity telemetry summary */
  activitySummary: string;
  /** Explicit list of components omitted from scoring due to unavailable evidence */
  unavailableComponents: MatchComponentName[];
  /** Objective, factual bullet points explaining why the issue is relevant */
  reasons: string[];
  /** Factual gaps (e.g. technologies in the issue not observed in user profile) */
  gaps: string[];
}

/** Scored candidate issue with complete component breakdown and explanation */
export interface IssueMatch {
  /** The candidate GitHub issue entity */
  issue: GitHubIssue;
  /** Observable signals extracted from the issue */
  signals: IssueSignals;
  /** Normalized composite match score between 0 and 100 (rounded to 1 decimal place) */
  score: number;
  /** Detailed component breakdown across all 7 components */
  components: Record<MatchComponentName, MatchComponentScore>;
  /** Factual audit trail and explanations */
  explanation: MatchExplanation;
}

/** Options configuring matching execution */
export interface MatchingOptions {
  /** Injected reference time for deterministic calculations (default: new Date()) */
  now?: Date;
  /** Custom base weights if overriding defaults (must sum to 1.0) */
  weights?: Partial<Record<MatchComponentName, number>>;
  /** Optional custom technology registry for topic/label mapping */
  registry?: TechnologyRegistry;
  /** Minimum score threshold to include in results (default: 0) */
  minScore?: number;
}

/** Execution telemetry and metadata for matching execution */
export interface MatchingMetadata {
  /** Deterministic ISO timestamp of when matching was performed */
  matchedAt: string;
  /** Total number of candidate issues evaluated */
  totalCandidateIssues: number;
  /** Number of issues meeting the match threshold */
  matchedIssuesCount: number;
  /** Injected reference timestamp string */
  referenceNow: string;
}

/** Complete output of matching engine */
export interface MatchingResult {
  /** Deterministically sorted issue matches */
  matches: IssueMatch[];
  /** The user technology profile evaluated */
  profile: TechnologyProfile;
  /** Matching execution telemetry */
  metadata: MatchingMetadata;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Backward compatibility definitions
 * ───────────────────────────────────────────────────────────────────────────── */

export type MatchResult = IssueMatch;

export interface ScoringComponent {
  name: string;
  weight: number;
  value: number | null;
  explanation: string;
}

export interface MatchReason {
  label: string;
  technology?: string;
}

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

export interface MatchEngineInput {
  profile: TechnologyProfile;
  issues: DiscoveredIssue[] | GitHubIssue[];
  now: Date;
  options?: MatchingOptions;
}

export type MatchEngineOutput = MatchingResult;
