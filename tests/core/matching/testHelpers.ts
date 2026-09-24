import type { TechnologyProfile } from "@/core/types/technology";
import type { DiscoveredIssue } from "@/core/types/issues";
import type { GitHubIssue } from "@/core/types/github";

export function createMockProfile(overrides: Partial<TechnologyProfile> = {}): TechnologyProfile {
  return {
    userId: "testuser",
    analyzedAt: "2026-09-24T00:00:00Z",
    repositoriesAnalyzed: 10,
    technologies: overrides.technologies ?? [
      {
        id: "react",
        name: "React",
        category: "framework",
        evidenceLevel: "strong",
        evidenceSummary: ["Used in 4 repositories"],
        evidence: [],
        repositoryCount: 4,
        repositories: ["repo-1"],
        mostRecentAt: "2026-09-20T00:00:00Z",
        daysSinceMostRecent: 4,
      },
      {
        id: "docker",
        name: "Docker",
        category: "tool",
        evidenceLevel: "moderate",
        evidenceSummary: ["Dockerfile found"],
        evidence: [],
        repositoryCount: 2,
        repositories: ["repo-2"],
        mostRecentAt: "2026-09-18T00:00:00Z",
        daysSinceMostRecent: 6,
      },
    ],
    languageFootprint: overrides.languageFootprint ?? [
      {
        language: "TypeScript",
        bytes: 80000,
        percentage: 80,
        rawPercentage: 80.0,
        color: "#3178C6",
      },
      {
        language: "Python",
        bytes: 20000,
        percentage: 20,
        rawPercentage: 20.0,
        color: "#3572A5",
      },
    ],
    ...overrides,
  };
}

export function createMockDiscoveredIssue(overrides?: {
  id?: number;
  number?: number;
  title?: string;
  body?: string | null;
  labels?: string[];
  primaryLanguage?: string | null;
  repositoryTopics?: string[];
  isArchived?: boolean;
  commentsCount?: number;
  daysSinceUpdated?: number;
  ageInDays?: number;
  state?: "open" | "closed";
}): DiscoveredIssue {
  const id = overrides?.id ?? 101;
  const number = overrides?.number ?? 42;
  const title = overrides?.title ?? "Implement responsive sidebar";
  const body = overrides?.body !== undefined ? overrides.body : "Please add a collapsible sidebar.";
  const labelNames = overrides?.labels ?? ["help wanted", "good first issue"];
  const primaryLanguage = overrides?.primaryLanguage !== undefined ? overrides.primaryLanguage : "TypeScript";
  const repositoryTopics = overrides?.repositoryTopics ?? ["react", "frontend"];
  const isRepositoryArchived = overrides?.isArchived ?? false;
  const commentsCount = overrides?.commentsCount ?? 2;
  const daysSinceUpdated = overrides?.daysSinceUpdated ?? 3;
  const ageInDays = overrides?.ageInDays ?? 10;
  const state = overrides?.state ?? "open";

  const rawIssue: GitHubIssue = {
    id,
    number,
    title,
    body,
    state,
    labels: labelNames.map((name) => ({ name, color: "7057ff", description: null })),
    createdAt: "2026-09-14T00:00:00Z",
    updatedAt: "2026-09-21T00:00:00Z",
    commentsCount,
    htmlUrl: `https://github.com/facebook/react/issues/${number}`,
    repository: {
      owner: "facebook",
      name: "react",
      fullName: "facebook/react",
      description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      topics: repositoryTopics,
      primaryLanguage: primaryLanguage,
      stars: 220000,
      forks: 45000,
      isArchived: isRepositoryArchived,
      htmlUrl: "https://github.com/facebook/react",
    },
  };

  return {
    issue: rawIssue,
    signals: {
      hasBody: body !== null && body.trim().length > 0,
      bodyLength: body ? body.trim().length : 0,
      labelNames,
      hasHelpWantedOrGoodFirstIssue: labelNames.some(
        (l) => l.includes("help wanted") || l.includes("good first issue")
      ),
      primaryLanguage,
      repositoryTopics,
      repositoryStars: 220000,
      repositoryForks: 45000,
      isRepositoryArchived,
      commentsCount,
      createdAt: rawIssue.createdAt,
      updatedAt: rawIssue.updatedAt,
      ageInDays,
      daysSinceUpdated,
    },
  };
}
