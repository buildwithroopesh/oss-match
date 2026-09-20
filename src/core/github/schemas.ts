/**
 * GitHub API Response Zod Boundary Validation Schemas
 *
 * Validates untrusted external payloads from api.github.com before
 * transforming them into application domain entities.
 */

import { z } from "zod";

/** Schema for GET /users/{username} */
export const GitHubUserResponseSchema = z.object({
  login: z.string().min(1),
  id: z.number(),
  avatar_url: z.string(),
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  public_repos: z.number().nonnegative(),
  followers: z.number().nonnegative(),
  following: z.number().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
});

export type GitHubUserResponse = z.infer<typeof GitHubUserResponseSchema>;

/** Schema for a repository item from GET /users/{username}/repos or GET /repos/{owner}/{repo} */
export const GitHubRepoResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
  }),
  description: z.string().nullable().optional(),
  topics: z.array(z.string()).optional().default([]),
  language: z.string().nullable().optional(),
  stargazers_count: z.number().nonnegative(),
  forks_count: z.number().nonnegative(),
  open_issues_count: z.number().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  default_branch: z.string(),
  archived: z.boolean(),
  fork: z.boolean(),
  html_url: z.string(),
});

export type GitHubRepoResponse = z.infer<typeof GitHubRepoResponseSchema>;

/** Schema for list of repositories */
export const GitHubReposListResponseSchema = z.array(GitHubRepoResponseSchema);

/** Schema for GET /repos/{owner}/{repo}/languages */
export const GitHubLanguagesResponseSchema = z.record(z.string(), z.number().nonnegative());

export type GitHubLanguagesResponse = z.infer<typeof GitHubLanguagesResponseSchema>;

/** Schema for issue label object or string */
export const GitHubLabelObjectSchema = z.object({
  name: z.string(),
  color: z.string(),
  description: z.string().nullable().optional(),
});

/** Schema for an issue from GET /repos/{owner}/{repo}/issues/{number} */
export const GitHubIssueResponseSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().optional(),
  state: z.string(),
  labels: z
    .array(
      z.union([
        z.string().transform((name) => ({ name, color: "ededed" })),
        GitHubLabelObjectSchema,
      ])
    )
    .optional()
    .default([]),
  created_at: z.string(),
  updated_at: z.string(),
  comments: z.number().nonnegative().optional().default(0),
  html_url: z.string(),
  repository_url: z.string().optional(),
  repository: z
    .object({
      owner: z.object({ login: z.string() }).optional(),
      name: z.string().optional(),
      full_name: z.string().optional(),
      description: z.string().nullable().optional(),
      topics: z.array(z.string()).optional(),
      language: z.string().nullable().optional(),
      stargazers_count: z.number().optional(),
      forks_count: z.number().optional(),
      archived: z.boolean().optional(),
      html_url: z.string().optional(),
    })
    .optional(),
});

export type GitHubIssueResponse = z.infer<typeof GitHubIssueResponseSchema>;

/** Schema for GET /search/issues */
export const GitHubSearchIssuesResponseSchema = z.object({
  total_count: z.number().nonnegative(),
  incomplete_results: z.boolean(),
  items: z.array(GitHubIssueResponseSchema),
});

export type GitHubSearchIssuesResponse = z.infer<typeof GitHubSearchIssuesResponseSchema>;

/** Schema for GET /repos/{owner}/{repo}/commits?per_page=1 item */
export const GitHubCommitItemResponseSchema = z.object({
  sha: z.string(),
  commit: z.object({
    committer: z
      .object({
        date: z.string().optional(),
      })
      .nullable()
      .optional(),
    author: z
      .object({
        date: z.string().optional(),
      })
      .nullable()
      .optional(),
  }),
});

export const GitHubCommitsListResponseSchema = z.array(GitHubCommitItemResponseSchema);

export type GitHubCommitItemResponse = z.infer<typeof GitHubCommitItemResponseSchema>;

/** Schema for GET /rate_limit response */
export const GitHubRateLimitResponseSchema = z.object({
  resources: z.object({
    core: z.object({
      limit: z.number(),
      remaining: z.number(),
      reset: z.number(),
      used: z.number(),
    }),
    search: z
      .object({
        limit: z.number(),
        remaining: z.number(),
        reset: z.number(),
        used: z.number(),
      })
      .optional(),
  }),
});

export type GitHubRateLimitResponse = z.infer<typeof GitHubRateLimitResponseSchema>;
