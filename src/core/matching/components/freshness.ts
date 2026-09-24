/**
 * Freshness Component Scorer (Base Weight: 5%)
 *
 * Evaluates the temporal freshness of an issue relative to an injected reference time.
 * Freshly created or recently updated issues have higher likelihood of being active and unassigned.
 */

import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";

export interface FreshnessScorerResult {
  component: MatchComponentScore;
  freshnessSummary: string;
}

export function evaluateFreshnessComponent(
  issue: DiscoveredIssue,
  baseWeight = 0.05
): FreshnessScorerResult {
  const { signals } = issue;

  if (isNaN(signals.daysSinceUpdated) || signals.daysSinceUpdated < 0) {
    return {
      component: {
        name: "freshness",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "Issue update timestamp is unavailable.",
      },
      freshnessSummary: "Freshness unavailable",
    };
  }

  const days = signals.daysSinceUpdated;
  let score = 0.05;
  let desc = `updated over a year ago (${days} days)`;

  if (days <= 7) {
    score = 1.0;
    desc = `updated ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}`;
  } else if (days <= 30) {
    score = 0.8;
    desc = `updated ${days} days ago (within 1 month)`;
  } else if (days <= 60) {
    score = 0.6;
    desc = `updated ${days} days ago (within 2 months)`;
  } else if (days <= 120) {
    score = 0.4;
    desc = `updated ${days} days ago (within 4 months)`;
  } else if (days <= 365) {
    score = 0.2;
    desc = `updated ${days} days ago (within 1 year)`;
  }

  const explanation = `Issue was ${desc}.`;

  return {
    component: {
      name: "freshness",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    freshnessSummary: `Issue was ${desc}`,
  };
}
