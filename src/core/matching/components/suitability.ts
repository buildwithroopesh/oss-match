/**
 * Issue Suitability Component Scorer (Base Weight: 10%)
 *
 * Evaluates observable issue facts (body description presence/length, comment volume,
 * contributor invitation labels, and open/closed state) without subjective quality judgments.
 */

import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";

export interface SuitabilityScorerResult {
  component: MatchComponentScore;
  highlights: string[];
}

export function evaluateSuitabilityComponent(
  issue: DiscoveredIssue,
  baseWeight = 0.10
): SuitabilityScorerResult {
  const { signals, issue: rawIssue } = issue;
  const highlights: string[] = [];

  // Closed issues are unsuitable for active contribution
  if (rawIssue.state !== "open") {
    return {
      component: {
        name: "suitability",
        baseWeight,
        effectiveWeight: 0,
        score: 0.0,
        isAvailable: true,
        explanation: "Issue is closed and not available for new contributions.",
      },
      highlights: ["Issue is closed"],
    };
  }

  let rawScore = 0;

  // 1. Body description presence and volume
  if (signals.hasBody) {
    rawScore += 0.4;
    highlights.push(`Descriptive issue body (${signals.bodyLength} characters)`);

    if (signals.bodyLength >= 300) {
      rawScore += 0.3;
    } else if (signals.bodyLength >= 100) {
      rawScore += 0.2;
    }
  } else {
    highlights.push("No issue body description provided");
  }

  // 2. Comment volume (moderate volume indicates active but uncrowded issue)
  if (signals.commentsCount <= 5) {
    rawScore += 0.2;
    highlights.push(
      signals.commentsCount === 0
        ? "No prior comments (unclaimed)"
        : `${signals.commentsCount} comment${signals.commentsCount === 1 ? "" : "s"} (low contention)`
    );
  } else if (signals.commentsCount <= 15) {
    rawScore += 0.1;
    highlights.push(`${signals.commentsCount} comments (active discussion)`);
  } else {
    highlights.push(`${signals.commentsCount} comments (high contention)`);
  }

  // 3. Contributor invitation labels
  if (signals.hasHelpWantedOrGoodFirstIssue) {
    rawScore += 0.1;
    highlights.push("Explicit contributor invitation label attached");
  }

  const score = Math.min(1.0, Math.round(rawScore * 100) / 100);
  const explanation = `Issue is open with ${highlights.slice(0, 2).join(", ").toLowerCase()}.`;

  return {
    component: {
      name: "suitability",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    highlights,
  };
}
