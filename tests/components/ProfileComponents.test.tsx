import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ProfileHeader,
  AnalysisSummary,
  LanguageFootprintCard,
  TechnologyFootprintCard,
  RepositoryList,
  EmptyProfileCard,
} from "@/components/profile";
import type { GitHubUser, GitHubRepository } from "@/core/types/github";
import type { LanguageFootprint } from "@/core/types/language";
import type { DetectedTechnology } from "@/core/types/technology";
import type { ProfileAnalysisMetadata } from "@/core/types/pipeline";

// Mock router for subcomponents that include UsernameForm
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockUser: GitHubUser = {
  login: "testdev",
  id: 12345,
  avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
  name: "Test Developer",
  bio: "Open-source contributor & software engineer",
  publicRepos: 18,
  followers: 42,
  following: 10,
  createdAt: "2020-01-01T00:00:00Z",
  updatedAt: "2026-09-24T00:00:00Z",
  htmlUrl: "https://github.com/testdev",
};

const mockMetadataComplete: ProfileAnalysisMetadata = {
  analyzedAt: "2026-09-25T00:00:00.000Z",
  repositoriesRequested: 30,
  repositoriesFound: 18,
  repositoriesAnalyzed: 16,
  repositoriesSkipped: 2,
  languagesFetchedCount: 16,
  warnings: [],
  status: "complete",
};

const mockMetadataPartial: ProfileAnalysisMetadata = {
  analyzedAt: "2026-09-25T00:00:00.000Z",
  repositoriesRequested: 30,
  repositoriesFound: 18,
  repositoriesAnalyzed: 12,
  repositoriesSkipped: 6,
  languagesFetchedCount: 12,
  rateLimitRemaining: 0,
  warnings: [
    'GitHub rate limit reached while fetching languages for repository "heavy-repo". Proceeding with partial data.',
  ],
  status: "partial",
};

const mockFootprint: LanguageFootprint = {
  entries: [
    {
      language: "TypeScript",
      bytes: 600000,
      percentage: 60,
      rawPercentage: 60,
      color: "#3178C6",
    },
    {
      language: "Python",
      bytes: 300000,
      percentage: 30,
      rawPercentage: 30,
      color: "#3776AB",
    },
    {
      language: "Rust",
      bytes: 100000,
      percentage: 10,
      rawPercentage: 10,
      color: "#DEA584",
    },
  ],
  totalBytes: 1000000,
  uniqueLanguagesCount: 3,
  analyzedRepositoriesCount: 16,
  skippedRepositoriesCount: 2,
  totalRepositoriesCount: 18,
  skippedRepositories: ["empty-repo", "no-code"],
};

const mockTechnologies: DetectedTechnology[] = [
  {
    id: "react",
    name: "React",
    category: "framework",
    evidenceLevel: "strong",
    evidenceSummary: ["Detected in package.json (dependencies)"],
    evidence: [],
    repositoryCount: 4,
    repositories: ["web-app", "dashboard"],
    mostRecentAt: "2026-09-20T00:00:00Z",
    daysSinceMostRecent: 5,
  },
  {
    id: "fastapi",
    name: "FastAPI",
    category: "framework",
    evidenceLevel: "moderate",
    evidenceSummary: ["Detected repository topic 'fastapi'"],
    evidence: [],
    repositoryCount: 1,
    repositories: ["api-service"],
    mostRecentAt: "2026-09-25T00:00:00Z",
    daysSinceMostRecent: 0,
  },
  {
    id: "docker",
    name: "Docker",
    category: "tool",
    evidenceLevel: "limited",
    evidenceSummary: ["Detected configuration file 'Dockerfile'"],
    evidence: [],
    repositoryCount: 2,
    repositories: ["infra"],
    mostRecentAt: null,
    daysSinceMostRecent: null,
  },
];

const mockRepositories: GitHubRepository[] = [
  {
    id: 101,
    owner: "testdev",
    name: "web-app",
    fullName: "testdev/web-app",
    description: "Next.js and React dashboard application",
    topics: ["react", "nextjs", "typescript"],
    primaryLanguage: "TypeScript",
    stars: 120,
    forks: 15,
    openIssuesCount: 3,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
    pushedAt: "2026-09-20T00:00:00Z",
    defaultBranch: "main",
    isArchived: false,
    isFork: false,
    htmlUrl: "https://github.com/testdev/web-app",
  },
  {
    id: 102,
    owner: "testdev",
    name: "legacy-tool",
    fullName: "testdev/legacy-tool",
    description: "Archived CLI tool",
    topics: [],
    primaryLanguage: "Python",
    stars: 5,
    forks: 1,
    openIssuesCount: 0,
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    pushedAt: "2024-01-01T00:00:00Z",
    defaultBranch: "master",
    isArchived: true,
    isFork: true,
    htmlUrl: "https://github.com/testdev/legacy-tool",
  },
];

describe("ProfileHeader", () => {
  it("renders user information, avatar, bio, stats, and complete status", () => {
    render(<ProfileHeader user={mockUser} metadata={mockMetadataComplete} />);

    expect(screen.getByText("Test Developer")).toBeInTheDocument();
    expect(screen.getByText("@testdev")).toBeInTheDocument();
    expect(
      screen.getByText("Open-source contributor & software engineer")
    ).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Analysis Complete")).toBeInTheDocument();

    const link = screen.getByLabelText("View @testdev on GitHub (opens in new tab)");
    expect(link).toHaveAttribute("href", "https://github.com/testdev");
  });

  it("renders partial analysis badge when status is partial", () => {
    render(<ProfileHeader user={mockUser} metadata={mockMetadataPartial} />);
    expect(screen.getByText("Partial Analysis")).toBeInTheDocument();
  });
});

describe("AnalysisSummary", () => {
  it("renders metrics when analysis is complete", () => {
    render(
      <AnalysisSummary
        metadata={mockMetadataComplete}
        totalLanguagesCount={mockFootprint.uniqueLanguagesCount}
      />
    );

    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("/ 18 found")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders warning banner with reason and rate limit info when status is partial", () => {
    render(
      <AnalysisSummary
        metadata={mockMetadataPartial}
        totalLanguagesCount={mockFootprint.uniqueLanguagesCount}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Partial Analysis Notice")).toBeInTheDocument();
    expect(
      screen.getByText(/GitHub rate limit reached while fetching languages/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Remaining GitHub API quota: 0 requests/i)
    ).toBeInTheDocument();
  });
});

describe("LanguageFootprintCard", () => {
  it("renders language percentages and byte volume", () => {
    render(<LanguageFootprintCard footprint={mockFootprint} />);

    expect(screen.getByText("Language Footprint")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByLabelText("60% of analyzed code")).toBeInTheDocument();
    expect(screen.getByLabelText("30% of analyzed code")).toBeInTheDocument();
    expect(screen.getByLabelText("10% of analyzed code")).toBeInTheDocument();

    // Verify percentages sum to 100%
    const sum = mockFootprint.entries.reduce((acc, e) => acc + e.percentage, 0);
    expect(sum).toBe(100);
  });

  it("strictly avoids presenting code volume as skill or expertise", () => {
    const { container } = render(<LanguageFootprintCard footprint={mockFootprint} />);
    const text = container.textContent?.toLowerCase() ?? "";

    expect(text).not.toContain("skill rating");
    expect(text).not.toContain("expertise rating");
    expect(text).toContain("not skill level or proficiency");
  });

  it("handles empty language footprint gracefully", () => {
    const emptyFootprint: LanguageFootprint = {
      entries: [],
      totalBytes: 0,
      uniqueLanguagesCount: 0,
      analyzedRepositoriesCount: 0,
      skippedRepositoriesCount: 0,
      totalRepositoriesCount: 0,
      skippedRepositories: [],
    };
    render(<LanguageFootprintCard footprint={emptyFootprint} />);
    expect(
      screen.getByText(/No language byte data available/i)
    ).toBeInTheDocument();
  });
});

describe("TechnologyFootprintCard", () => {
  it("renders detected technologies with evidence badges and categories", () => {
    render(<TechnologyFootprintCard technologies={mockTechnologies} />);

    expect(screen.getByText("Detected Technologies")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Strong Evidence")).toBeInTheDocument();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    expect(screen.getByText("Moderate Evidence")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("Limited Evidence")).toBeInTheDocument();
  });

  it("renders recency notes only when daysSinceMostRecent is non-null", () => {
    render(<TechnologyFootprintCard technologies={mockTechnologies} />);

    expect(screen.getByText("Active 5 days ago")).toBeInTheDocument();
    expect(screen.getByText("Active today")).toBeInTheDocument();
    // Docker has daysSinceMostRecent: null, so it shouldn't have an "Active" note
    expect(screen.queryByText(/Active null/i)).not.toBeInTheDocument();
  });

  it("handles empty technologies list", () => {
    render(<TechnologyFootprintCard technologies={[]} />);
    expect(
      screen.getByText(/No registered framework or tool technologies were identified/i)
    ).toBeInTheDocument();
  });
});

describe("RepositoryList", () => {
  it("renders repository cards with links, primary languages, stars, and tags", () => {
    render(<RepositoryList repositories={mockRepositories} />);

    expect(screen.getByText("Analyzed Repositories")).toBeInTheDocument();
    expect(screen.getByText("web-app")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("★ 120")).toBeInTheDocument();
    expect(screen.getByText("⑂ 15")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();

    // Check archived and fork tags
    expect(screen.getByText("legacy-tool")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("Fork")).toBeInTheDocument();
  });
});

describe("EmptyProfileCard", () => {
  it("renders message when user has no public repositories", () => {
    render(<EmptyProfileCard username="emptyuser" />);

    expect(screen.getByText("No Public Repositories Found")).toBeInTheDocument();
    expect(screen.getByText("@emptyuser")).toBeInTheDocument();
    expect(screen.getByText(/Return to home page/i)).toBeInTheDocument();
  });
});
