/**
 * Matching Engine Constants & Baseline Weights
 *
 * Implements the baseline scoring model specified in the OSS Match master requirements.
 */

import type { MatchComponentName } from "../types/matching";

/**
 * Baseline weights per component:
 * - Technology: 35%
 * - Language: 20%
 * - Framework/topic: 15%
 * - Issue suitability: 10%
 * - Repository activity: 10%
 * - Freshness: 5%
 * - Difficulty: 5%
 */
export const DEFAULT_COMPONENT_WEIGHTS: Readonly<Record<MatchComponentName, number>> = {
  technology: 0.35,
  language: 0.20,
  framework: 0.15,
  suitability: 0.10,
  activity: 0.10,
  freshness: 0.05,
  difficulty: 0.05,
};

/** Explicit beginner-friendly labels recognized from GitHub */
export const BEGINNER_DIFFICULTY_PATTERNS = [
  "good first issue",
  "good-first-issue",
  "good_first_issue",
  "beginner",
  "starter",
  "easy",
  "first-timers-only",
  "first timers only",
  "up-for-grabs",
  "level:beginner",
  "level:easy",
  "difficulty:easy",
  "difficulty:beginner",
  "e-easy",
  "d:easy",
];

/** Explicit intermediate-difficulty labels recognized from GitHub */
export const INTERMEDIATE_DIFFICULTY_PATTERNS = [
  "intermediate",
  "medium",
  "moderate",
  "level:intermediate",
  "level:medium",
  "difficulty:medium",
  "difficulty:intermediate",
  "e-medium",
  "d:medium",
];

/** Explicit advanced-difficulty labels recognized from GitHub */
export const ADVANCED_DIFFICULTY_PATTERNS = [
  "advanced",
  "complex",
  "hard",
  "level:advanced",
  "level:hard",
  "difficulty:hard",
  "difficulty:advanced",
  "e-hard",
  "d:hard",
];

/** General contributor-friendly invite labels */
export const CONTRIBUTOR_INVITE_PATTERNS = [
  "help wanted",
  "help-wanted",
  "help_wanted",
  "good first issue",
  "good-first-issue",
  "good_first_issue",
  "up-for-grabs",
  "first-timers-only",
];
