/**
 * Server-side Recommendations Integration Helper
 *
 * NOTE: This file belongs to the application infrastructure layer (src/lib),
 * NOT src/core. It orchestrates Profile Analysis (Milestone 5), Issue Discovery (Milestone 7),
 * and the Matching Engine (Milestone 8) using the server's GitHubClient.
 */

import { analyzeProfile } from "@/core/pipeline";
import { PipelineError, PipelineApiError } from "@/core/pipeline/errors";
import { discoverIssues } from "@/core/issues/discover";
import { matchIssues } from "@/core/matching/engine";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";
import type { DiscoveryMetadata, IssueSearchCriteria } from "@/core/types/issues";
import type { MatchingResult } from "@/core/types/matching";
import { getGitHubClient } from "@/lib/github";

export type RecommendationsState =
  | {
      status: "success";
      profile: ProfileAnalysisResult;
      discovery: DiscoveryMetadata;
      recommendations: MatchingResult;
    }
  | {
      status: "error";
      error: PipelineError;
      username: string;
    };

export interface GetRecommendationsOptions {
  /** Injected reference time for deterministic calculations */
  now?: Date;
  /** Maximum number of issues to discover (default: 30) */
  discoveryLimit?: number;
}

/**
 * Executes the complete recommendations pipeline on the server:
 * Profile Analysis -> Issue Discovery -> Matching Engine -> Ranked Recommendations.
 *
 * @param username GitHub username to analyze and match
 * @param options Execution options including reference time
 */
export async function getProfileAndRecommendations(
  username: string,
  options: GetRecommendationsOptions = {}
): Promise<RecommendationsState> {
  const now = options.now ?? new Date();
  const discoveryLimit = options.discoveryLimit ?? 30;

  try {
    const client = getGitHubClient();

    // 1. Run Profile Analysis (Milestone 5)
    const profileResult = await analyzeProfile(client, username, { now });

    // 2. If the user has 0 repositories, return early with zero matches
    if (profileResult.repositories.length === 0) {
      const emptyDiscovery: DiscoveryMetadata = {
        searchedAt: now.toISOString(),
        query: "",
        totalAvailableCount: 0,
        returnedCount: 0,
        pagesFetched: 0,
        hasMore: false,
        status: "complete",
        warnings: [],
      };

      const emptyMatching: MatchingResult = {
        matches: [],
        profile: profileResult.profile,
        metadata: {
          matchedAt: now.toISOString(),
          totalCandidateIssues: 0,
          matchedIssuesCount: 0,
          referenceNow: now.toISOString(),
        },
      };

      return {
        status: "success",
        profile: profileResult,
        discovery: emptyDiscovery,
        recommendations: emptyMatching,
      };
    }

    // 3. Formulate IssueSearchCriteria using the broadest sensible deterministic V1 strategy
    // In accordance with Milestone 7 & 8 architecture:
    // - state: "open"
    // - excludeArchived: true
    // - limit: discoveryLimit (capped at 30)
    // - no language restriction
    // - no "good first issue only" restriction
    // - no minimum stars/forks
    // Downstream, Milestone 8 evaluates matching scores from observable candidate signals
    // (where presence of "good first issue" or "help wanted" continues to contribute to difficulty/suitability).
    const criteria: IssueSearchCriteria = {
      state: "open",
      excludeArchived: true,
      limit: discoveryLimit,
      now,
    };

    // 4. Run Issue Discovery (Milestone 7) with resilience
    let discoveryMetadata: DiscoveryMetadata;
    let candidateIssues: Parameters<typeof matchIssues>[1] = [];

    try {
      const discoveryResult = await discoverIssues(client, criteria);
      discoveryMetadata = discoveryResult.metadata;
      candidateIssues = discoveryResult.issues;
    } catch (discErr) {
      // If issue discovery fails (e.g. rate limit), preserve profile analysis with partial notice
      const warningMessage =
        discErr instanceof Error
          ? discErr.message
          : "Issue discovery could not be completed.";

      discoveryMetadata = {
        searchedAt: now.toISOString(),
        query: "is:issue state:open archived:false",
        totalAvailableCount: 0,
        returnedCount: 0,
        pagesFetched: 0,
        hasMore: false,
        status: "partial",
        warnings: [warningMessage],
      };
    }

    // 5. Run Matching Engine (Milestone 8)
    const matchingResult = matchIssues(profileResult.profile, candidateIssues, {
      now,
    });

    return {
      status: "success",
      profile: profileResult,
      discovery: discoveryMetadata,
      recommendations: matchingResult,
    };
  } catch (err) {
    if (err instanceof PipelineError) {
      return { status: "error", error: err, username };
    }
    return {
      status: "error",
      error: new PipelineApiError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during profile analysis and matching.",
        { username, cause: err }
      ),
      username,
    };
  }
}
