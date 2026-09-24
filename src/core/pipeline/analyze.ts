/**
 * Profile Analysis Pipeline
 *
 * Connects the GitHub API client, language footprint aggregator, and technology
 * detection engine into an audited, deterministic profile analysis pipeline.
 */

import type { GitHubClient } from "../github/client";
import type { GitHubUser, GitHubRepository, GitHubLanguages } from "../types/github";
import type { RepositoryLanguageData } from "../types/language";
import type {
  RepositoryDetectionInput,
  TechnologyEvidence,
  TechnologyProfile,
} from "../types/technology";
import type {
  ProfileAnalysisOptions,
  ProfileAnalysisResult,
  ProfileAnalysisMetadata,
} from "../types/pipeline";
import {
  PipelineInvalidUsernameError,
  mapGitHubErrorToPipelineError,
} from "./errors";
import { GitHubRateLimitError } from "../github/errors";
import { aggregateLanguageFootprint } from "../language/aggregator";
import { defaultTechnologyRegistry } from "../technology/registry";
import { detectRepositoryTechnologies } from "../technology/detector";
import { aggregateDetectedTechnologies } from "../technology/aggregator";

/** Standard GitHub username validation regex */
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const DEFAULT_REPO_LIMIT = 30;
const DEFAULT_CONCURRENCY = 5;

/**
 * Executes the complete profile analysis pipeline for a GitHub user.
 *
 * @param client Instantiated GitHubClient (Milestone 2)
 * @param username GitHub username to analyze
 * @param options Pipeline configuration options including injected `now`
 * @returns Comprehensive ProfileAnalysisResult
 */
export async function analyzeProfile(
  client: GitHubClient,
  username: string,
  options?: ProfileAnalysisOptions
): Promise<ProfileAnalysisResult> {
  const startTime = Date.now();

  // 1. Validate username input
  const trimmedUsername = username.trim();
  if (!trimmedUsername) {
    throw new PipelineInvalidUsernameError("GitHub username must not be empty.", {
      username,
    });
  }

  if (trimmedUsername.length > 39 || !GITHUB_USERNAME_REGEX.test(trimmedUsername)) {
    throw new PipelineInvalidUsernameError(
      `"${trimmedUsername}" is not a valid GitHub username. GitHub usernames may contain up to 39 alphanumeric characters or single hyphens.`,
      { username: trimmedUsername }
    );
  }

  // 2. Reference time for deterministic calculations
  const now = options?.now ?? new Date();
  const registry = options?.registry ?? defaultTechnologyRegistry;
  const requestedLimit = options?.repositoryLimit ?? DEFAULT_REPO_LIMIT;
  const targetLimit = Math.max(1, Math.min(requestedLimit, DEFAULT_REPO_LIMIT));
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? DEFAULT_CONCURRENCY, 10));

  // 3. Validate and fetch user profile
  let user: GitHubUser;
  try {
    user = await client.getUser(trimmedUsername);
  } catch (error) {
    throw mapGitHubErrorToPipelineError(error, trimmedUsername);
  }

  // 4. Fetch up to 30 public repositories, sorted by recent updates
  let repositories: GitHubRepository[] = [];
  try {
    repositories = await client.getRepositories(trimmedUsername, {
      limit: targetLimit,
      sort: "updated",
      direction: "desc",
      type: "owner",
    });
  } catch (error) {
    throw mapGitHubErrorToPipelineError(error, trimmedUsername);
  }

  // Early return if user has zero public repositories
  if (repositories.length === 0) {
    const emptyFootprint = aggregateLanguageFootprint([], { topLimit: 8 });

    const emptyProfile: TechnologyProfile = {
      userId: user.login,
      analyzedAt: now.toISOString(),
      repositoriesAnalyzed: 0,
      technologies: [],
      languageFootprint: [],
    };

    const emptyMetadata: ProfileAnalysisMetadata = {
      analyzedAt: now.toISOString(),
      repositoriesRequested: targetLimit,
      repositoriesFound: 0,
      repositoriesAnalyzed: 0,
      repositoriesSkipped: 0,
      languagesFetchedCount: 0,
      rateLimitRemaining: client.lastRateLimit?.remaining,
      warnings: [],
      status: "complete",
      durationMs: Date.now() - startTime,
    };

    return {
      user,
      repositories: [],
      languageFootprint: emptyFootprint,
      technologies: [],
      profile: emptyProfile,
      metadata: emptyMetadata,
    };
  }

  // 5. Fetch language byte breakdowns with bounded concurrency
  // Deterministic preservation: language results are keyed by repository name
  const languageDataMap = new Map<string, GitHubLanguages>();
  const warnings: string[] = [];
  let partialFailure = false;
  let rateLimitHit = false;

  for (let i = 0; i < repositories.length; i += concurrency) {
    if (rateLimitHit) break;

    const chunk = repositories.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (repo) => {
      try {
        const langs = await client.getLanguages(repo.owner, repo.name);
        return { repo, langs, error: null };
      } catch (err) {
        return { repo, langs: null, error: err };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const res of chunkResults) {
      if (res.error) {
        partialFailure = true;
        if (res.error instanceof GitHubRateLimitError) {
          rateLimitHit = true;
          warnings.push(
            `GitHub rate limit reached while fetching languages for repository "${res.repo.name}". Proceeding with partial data.`
          );
        } else {
          const msg = res.error instanceof Error ? res.error.message : String(res.error);
          warnings.push(
            `Failed to fetch language data for repository "${res.repo.owner}/${res.repo.name}": ${msg}`
          );
        }
        languageDataMap.set(res.repo.name, {});
      } else if (res.langs) {
        languageDataMap.set(res.repo.name, res.langs);
      }
    }
  }

  // 6. Aggregate language footprint using Largest-Remainder rounding
  const repoLanguageList: RepositoryLanguageData[] = repositories.map((repo) => ({
    repositoryName: repo.name,
    languages: languageDataMap.get(repo.name) ?? {},
  }));

  const languageFootprint = aggregateLanguageFootprint(repoLanguageList, { topLimit: 8 });

  // 7. Detect technologies across repository evidence
  const allEvidence: TechnologyEvidence[] = [];

  for (const repo of repositories) {
    const repoDetectionInput: RepositoryDetectionInput = {
      name: repo.name,
      owner: repo.owner,
      pushedAt: repo.pushedAt,
      updatedAt: repo.updatedAt,
      languages: languageDataMap.get(repo.name) ?? {},
      topics: repo.topics ?? [],
      filePaths: [],
    };

    const repoEvidence = detectRepositoryTechnologies(repoDetectionInput, registry);
    allEvidence.push(...repoEvidence);
  }

  // 8. Aggregate detected technologies and compute recency relative to `now`
  const technologies = aggregateDetectedTechnologies(allEvidence, {
    now,
    registry,
  });

  // 9. Assemble TechnologyProfile
  const profile: TechnologyProfile = {
    userId: user.login,
    analyzedAt: now.toISOString(),
    repositoriesAnalyzed: languageFootprint.analyzedRepositoriesCount,
    technologies,
    languageFootprint: languageFootprint.entries,
  };

  // Count repositories where languages were successfully obtained (even if 0 bytes)
  let languagesFetchedCount = 0;
  for (const repo of repositories) {
    const data = languageDataMap.get(repo.name);
    if (data !== undefined) {
      languagesFetchedCount += 1;
    }
  }

  // 10. Assemble execution metadata
  const metadata: ProfileAnalysisMetadata = {
    analyzedAt: now.toISOString(),
    repositoriesRequested: targetLimit,
    repositoriesFound: repositories.length,
    repositoriesAnalyzed: languageFootprint.analyzedRepositoriesCount,
    repositoriesSkipped: languageFootprint.skippedRepositoriesCount,
    languagesFetchedCount,
    rateLimitRemaining: client.lastRateLimit?.remaining,
    warnings,
    status: partialFailure ? "partial" : "complete",
    durationMs: Date.now() - startTime,
  };

  return {
    user,
    repositories,
    languageFootprint,
    technologies,
    profile,
    metadata,
  };
}
