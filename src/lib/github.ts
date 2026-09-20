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
 * Returns a configured GitHubClient instance.
 * Reads process.env.GITHUB_API_TOKEN safely on the server side.
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
