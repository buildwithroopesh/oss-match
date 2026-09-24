/**
 * Server-side Profile Analysis Integration Helper
 *
 * NOTE: This file is part of the application infrastructure layer (src/lib),
 * NOT src/core. It handles server-side error mapping and invokes the pure
 * pipeline with the server's GitHubClient.
 */

import { analyzeProfile } from "@/core/pipeline";
import { PipelineError, PipelineApiError } from "@/core/pipeline/errors";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";
import { getGitHubClient } from "@/lib/github";

export type ProfileAnalysisState =
  | { status: "success"; data: ProfileAnalysisResult }
  | { status: "error"; error: PipelineError };

/**
 * Executes profile analysis on the server and returns a discriminated union.
 * Safely captures typed PipelineErrors for client rendering without throwing.
 */
export async function getProfileAnalysis(
  username: string
): Promise<ProfileAnalysisState> {
  try {
    const client = getGitHubClient();
    const data = await analyzeProfile(client, username);
    return { status: "success", data };
  } catch (err) {
    if (err instanceof PipelineError) {
      return { status: "error", error: err };
    }
    return {
      status: "error",
      error: new PipelineApiError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during profile analysis.",
        { username, cause: err }
      ),
    };
  }
}
