/**
 * Core types — GitHub entities
 *
 * These types represent normalized GitHub data after Zod validation.
 * They are framework-independent and used across the entire core pipeline.
 *
 * Implemented in Milestone 2 (GitHub API client).
 */

export type { GitHubUser, GitHubRepository, GitHubIssue, GitHubLanguages };

/** Normalized GitHub user from GET /users/{username} */
interface GitHubUser {
  login: string;
  id: number;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

/** Normalized GitHub repository */
interface GitHubRepository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  topics: string[];
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  openIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  defaultBranch: string;
  isArchived: boolean;
  isFork: boolean;
  htmlUrl: string;
}

/** Language byte counts from GET /repos/{owner}/{repo}/languages */
interface GitHubLanguages {
  [language: string]: number;
}

/** Normalized GitHub issue */
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
  htmlUrl: string;
  repository: Pick<
    GitHubRepository,
    | "owner"
    | "name"
    | "fullName"
    | "description"
    | "topics"
    | "primaryLanguage"
    | "stars"
    | "forks"
    | "isArchived"
    | "htmlUrl"
  >;
}
