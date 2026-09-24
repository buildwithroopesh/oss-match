/**
 * Framework / Topic Component Scorer (Base Weight: 15%)
 *
 * Compares observable repository topics against detected frameworks, libraries,
 * and platforms from the user's technology profile.
 *
 * Strict Data-Honesty & Evidence Boundary:
 * - Matches strictly against verified repository topics.
 * - Does NOT use issue labels (labels are reserved for the Technology component).
 * - Does NOT inspect issue title or body prose.
 */

import type { TechnologyProfile } from "../../types/technology";
import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";

export interface FrameworkScorerResult {
  component: MatchComponentScore;
  matchedTopics: string[];
}

export function evaluateFrameworkComponent(
  profile: TechnologyProfile,
  issue: DiscoveredIssue,
  baseWeight = 0.15
): FrameworkScorerResult {
  const topics = issue.signals.repositoryTopics ?? [];

  // If issue repository has no topics, framework/topic evidence is unavailable
  if (topics.length === 0) {
    return {
      component: {
        name: "framework",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "No repository topics are available for this issue.",
      },
      matchedTopics: [],
    };
  }

  // Collect frameworks, libraries, and tools from user's profile
  const userFrameworks = profile.technologies.filter(
    (t) => t.category === "framework" || t.category === "library" || t.category === "platform"
  );

  const userTokens = new Set<string>();
  for (const tech of userFrameworks) {
    userTokens.add(tech.id.toLowerCase());
    userTokens.add(tech.name.toLowerCase());
  }

  const matchedTopics: string[] = [];
  for (const topic of topics) {
    const cleanTopic = topic.toLowerCase().trim();
    if (userTokens.has(cleanTopic)) {
      matchedTopics.push(topic);
    }
  }

  if (matchedTopics.length === 0) {
    return {
      component: {
        name: "framework",
        baseWeight,
        effectiveWeight: 0,
        score: 0.0,
        isAvailable: true,
        explanation: "None of the repository topics matched detected frameworks or libraries in your profile.",
      },
      matchedTopics: [],
    };
  }

  // 1 topic match -> 0.7, 2+ matches -> 1.0
  const score = matchedTopics.length >= 2 ? 1.0 : 0.7;
  const topicListStr = matchedTopics.join(", ");
  const explanation = `Repository topics matched observed framework(s) from your profile: ${topicListStr}.`;

  return {
    component: {
      name: "framework",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    matchedTopics,
  };
}
