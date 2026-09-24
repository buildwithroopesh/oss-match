/**
 * Difficulty Component Scorer (Base Weight: 5%)
 *
 * Evaluates ONLY explicit observable labels on the issue (e.g. 'good first issue', 'beginner', 'intermediate').
 *
 * DATA HONESTY INVARIANT:
 * If an issue does not contain an explicit difficulty label, this component is UNAVAILABLE (null).
 * We strictly NEVER invent, guess, or synthesize machine-generated difficulty ratings.
 */

import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore, DifficultyEstimate } from "../../types/matching";
import {
  BEGINNER_DIFFICULTY_PATTERNS,
  INTERMEDIATE_DIFFICULTY_PATTERNS,
  ADVANCED_DIFFICULTY_PATTERNS,
} from "../constants";

export interface DifficultyScorerResult {
  component: MatchComponentScore;
  difficultyEstimate: DifficultyEstimate;
  observedLabel: string | null;
}

export function evaluateDifficultyComponent(
  issue: DiscoveredIssue,
  baseWeight = 0.05
): DifficultyScorerResult {
  const labelNames = issue.signals.labelNames ?? [];

  let matchedLabel: string | null = null;
  let level: "beginner" | "intermediate" | "advanced" | null = null;

  for (const label of labelNames) {
    const clean = label.toLowerCase().trim();

    if (
      BEGINNER_DIFFICULTY_PATTERNS.some(
        (pattern) => clean === pattern || clean.includes(pattern)
      )
    ) {
      matchedLabel = label;
      level = "beginner";
      break;
    }

    if (
      INTERMEDIATE_DIFFICULTY_PATTERNS.some(
        (pattern) => clean === pattern || clean.includes(pattern)
      )
    ) {
      matchedLabel = label;
      level = "intermediate";
      break;
    }

    if (
      ADVANCED_DIFFICULTY_PATTERNS.some(
        (pattern) => clean === pattern || clean.includes(pattern)
      )
    ) {
      matchedLabel = label;
      level = "advanced";
      break;
    }
  }

  // If no explicit difficulty label is present on the issue, mark unavailable
  if (!level || !matchedLabel) {
    return {
      component: {
        name: "difficulty",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "No explicit difficulty label was present on the issue.",
      },
      difficultyEstimate: "unknown",
      observedLabel: null,
    };
  }

  let score = 1.0;
  let estimate: DifficultyEstimate = "beginner";

  if (level === "beginner") {
    score = 1.0;
    estimate = "beginner";
  } else if (level === "intermediate") {
    score = 0.8;
    estimate = "intermediate";
  } else if (level === "advanced") {
    score = 0.6;
    estimate = "advanced";
  }

  const explanation = `Issue contains explicit contributor difficulty label '${matchedLabel}'.`;

  return {
    component: {
      name: "difficulty",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    difficultyEstimate: estimate,
    observedLabel: matchedLabel,
  };
}
