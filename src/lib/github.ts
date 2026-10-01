/**
 * Server-side GitHub Client Factory & Instance
 *
 * NOTE: This file is part of the application infrastructure layer (src/lib),
 * NOT src/core. It is responsible for injecting environment variables (GITHUB_API_TOKEN)
 * into the pure framework-independent GitHubClient.
 */

import { GitHubClient } from "@/core/github";

let globalClient: GitHubClient | undefined;

/**
 * Returns a shared GitHubClient instance for the lifetime of the server process.
 *
 * ARCHITECTURAL NOTE — why a module-level singleton:
 * The GitHubClient carries an in-memory cache (MemoryCache) and an in-flight
 * deduplication map. Sharing one instance across concurrent Next.js server
 * requests means that simultaneous requests for the same resource (e.g. two
 * concurrent page loads for the same username) deduplicate into a single
 * outgoing GitHub API call, and cached responses are reused across requests.
 *
 * This is safe for data correctness because every cache key is the full
 * request URL, which always includes the resource path and username
 * (e.g. GET:/users/alice, GET:/repos/alice/app/languages). Keys for different
 * users are completely distinct — no user can read another user's cached data.
 *
 * The token is read once from process.env.GITHUB_API_TOKEN at construction
 * time and stored as a private readonly field. It is never serialized, logged,
 * or exposed to client-side code.
 */
export function getGitHubClient(): GitHubClient {
  if (!globalClient) {
    globalClient = new GitHubClient({
      token: process.env.GITHUB_API_TOKEN,
    });
  }
  return globalClient;
}

/**
 * Creates a fresh GitHubClient instance with custom options.
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient({
    token: token ?? process.env.GITHUB_API_TOKEN,
  });
}
