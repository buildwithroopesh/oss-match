/**
 * Language Component Scorer (Base Weight: 20%)
 *
 * Compares the issue's primary repository language against the user's analyzed
 * language footprint (code volume percentage).
 *
 * Grounded strictly in observable code volume facts — never skill or expertise.
 */

import type { TechnologyProfile } from "../../types/technology";
import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";

export interface LanguageScorerResult {
  component: MatchComponentScore;
  matchedLanguages: Array<{ language: string; userPercentage: number }>;
}

export function evaluateLanguageComponent(
  profile: TechnologyProfile,
  issue: DiscoveredIssue,
  baseWeight = 0.20
): LanguageScorerResult {
  const primaryLanguage = issue.signals.primaryLanguage;

  // If GitHub did not report a primary language for the repository, mark component unavailable
  if (!primaryLanguage) {
    return {
      component: {
        name: "language",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "Repository primary language is not available from GitHub.",
      },
      matchedLanguages: [],
    };
  }

  const cleanPrimary = primaryLanguage.trim().toLowerCase();

  // Find corresponding entry in user's language footprint
  const footprintEntry = profile.languageFootprint.find(
    (entry) => entry.language.toLowerCase() === cleanPrimary
  );

  if (!footprintEntry || footprintEntry.percentage <= 0) {
    return {
      component: {
        name: "language",
        baseWeight,
        effectiveWeight: 0,
        score: 0.0,
        isAvailable: true,
        explanation: `Primary repository language ${primaryLanguage} was not observed in your analyzed public repositories.`,
      },
      matchedLanguages: [],
    };
  }

  // Map user code volume percentage to a normalized [0, 1] component score
  const pct = footprintEntry.percentage;
  let score = 0.4;
  if (pct >= 50) {
    score = 1.0;
  } else if (pct >= 20) {
    score = 0.8;
  } else if (pct >= 5) {
    score = 0.6;
  }

  const explanation = `Primary repository language ${footprintEntry.language} represents ${pct}% of your analyzed code volume.`;

  return {
    component: {
      name: "language",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    matchedLanguages: [
      {
        language: footprintEntry.language,
        userPercentage: pct,
      },
    ],
  };
}
