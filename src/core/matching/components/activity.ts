/**
 * Repository Activity Component Scorer (Base Weight: 10%)
 *
 * Evaluates observable repository activity signals (archive status, recent update recency)
 * without arbitrary star/fork thresholds or subjective health claims.
 */

import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";

export interface ActivityScorerResult {
  component: MatchComponentScore;
  activitySummary: string;
}

export function evaluateActivityComponent(
  issue: DiscoveredIssue,
  baseWeight = 0.10
): ActivityScorerResult {
  const { signals } = issue;

  // If update timestamps are missing or invalid, mark unavailable
  if (isNaN(signals.daysSinceUpdated) || signals.daysSinceUpdated < 0) {
    return {
      component: {
        name: "activity",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "Repository activity timestamps are unavailable.",
      },
      activitySummary: "Activity telemetry unavailable",
    };
  }

  // Archived repositories are read-only; no new contributions can be merged
  if (signals.isRepositoryArchived) {
    return {
      component: {
        name: "activity",
        baseWeight,
        effectiveWeight: 0,
        score: 0.0,
        isAvailable: true,
        explanation: "Parent repository is archived and read-only.",
      },
      activitySummary: "Parent repository is archived",
    };
  }

  // Evaluated by update recency in days
  const days = signals.daysSinceUpdated;
  let score = 0.1;
  let activityLevelText = "limited activity (last updated > 180 days ago)";

  if (days <= 30) {
    score = 1.0;
    activityLevelText = `recently active (updated ${days} day${days === 1 ? "" : "s"} ago)`;
  } else if (days <= 90) {
    score = 0.7;
    activityLevelText = `moderately active (updated ${days} days ago)`;
  } else if (days <= 180) {
    score = 0.4;
    activityLevelText = `periodic activity (updated ${days} days ago)`;
  }

  const explanation = `Parent repository exhibits ${activityLevelText}.`;

  return {
    component: {
      name: "activity",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    activitySummary: `Repository ${activityLevelText}`,
  };
}
