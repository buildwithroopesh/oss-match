/**
 * Core types — GitHub domain entities
 *
 * Framework-independent TypeScript models representing validated and normalized
 * GitHub data. These types are consumed by technology detection, language aggregation,
 * and the matching engine.
 */

/** Normalized GitHub user profile */
export interface GitHubUser {
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
export interface GitHubRepository {
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
export interface GitHubLanguages {
  [language: string]: number;
}

/** Normalized GitHub issue label */
export interface GitHubIssueLabel {
  name: string;
  color: string;
  description?: string | null;
}

/** Normalized GitHub issue */
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: GitHubIssueLabel[];
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

/** Neutral activity classification based on observable telemetry */
export type ActivityLevel =
  | "recently-active"
  | "moderately-active"
  | "limited-activity";

/** Telemetry reflecting repository activity */
export interface RepositoryActivity {
  owner: string;
  repo: string;
  pushedAt: string;
  lastCommitDate: string | null;
  daysSinceLastPush: number;
  daysSinceLastCommit: number | null;
  activityLevel: ActivityLevel;
}

/** Rate limit telemetry parsed from response headers */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  reset: number; // Unix epoch seconds
  resource: string;
  retryAfter?: number; // Seconds (if provided by retry-after header)
}

/** Options for fetching repositories */
export interface GetRepositoriesOptions {
  /** Maximum number of repositories to return (default: 30) */
  limit?: number;
  /** Sort order: 'created' | 'updated' | 'pushed' | 'full_name' (default: 'updated') */
  sort?: "created" | "updated" | "pushed" | "full_name";
  /** Direction: 'asc' | 'desc' (default: 'desc') */
  direction?: "asc" | "desc";
  /** Repository type: 'all' | 'owner' | 'member' (default: 'owner') */
  type?: "all" | "owner" | "member";
}

/** Options for searching issues */
export interface SearchIssuesOptions {
  page?: number;
  perPage?: number;
  sort?: "comments" | "reactions" | "reactions-+1" | "reactions--1" | "reactions-smile" | "reactions-thinking_face" | "reactions-heart" | "reactions-tada" | "interactions" | "created" | "updated";
  order?: "asc" | "desc";
}

/** Paginated issue search result */
export interface IssueSearchResult {
  totalCount: number;
  incompleteResults: boolean;
  issues: GitHubIssue[];
}
