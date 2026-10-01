import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IssuesPage, { metadata } from "@/app/issues/page";
import * as issuesLib from "@/lib/issues";
import type { DiscoveredIssue, DiscoveryMetadata } from "@/core/types/issues";

vi.mock("@/lib/issues", () => ({
  getBrowseIssues: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockIssue: DiscoveredIssue = {
  issue: {
    id: 901,
    number: 77,
    title: "Implement accessible keyboard shortcuts",
    body: "Please add standard Esc and Tab trap keyboard support.",
    state: "open",
    htmlUrl: "https://github.com/facebook/react/issues/77",
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    commentsCount: 4,
    labels: [
      { name: "good first issue", color: "7057ff", description: null },
      { name: "a11y", color: "1d76db", description: null },
    ],
    repository: {
      owner: "facebook",
      name: "react",
      fullName: "facebook/react",
      description: "The React library",
      topics: ["react", "ui"],
      primaryLanguage: "TypeScript",
      stars: 220000,
      forks: 45000,
      isArchived: false,
      htmlUrl: "https://github.com/facebook/react",
    },
  },
  signals: {
    hasBody: true,
    bodyLength: 54,
    labelNames: ["good first issue", "a11y"],
    hasHelpWantedOrGoodFirstIssue: true,
    primaryLanguage: "TypeScript",
    repositoryTopics: ["react", "ui"],
    repositoryStars: 220000,
    repositoryForks: 45000,
    isRepositoryArchived: false,
    commentsCount: 4,
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    ageInDays: 4,
    daysSinceUpdated: 0,
  },
};

const mockMetadata: DiscoveryMetadata = {
  searchedAt: "2026-09-24T00:00:00Z",
  query: "is:issue state:open archived:false",
  totalAvailableCount: 1,
  returnedCount: 1,
  pagesFetched: 1,
  hasMore: false,
  status: "complete",
  warnings: [],
};

describe("IssuesPage Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports appropriate page metadata", () => {
    expect(metadata.title).toBe("Browse Open Source Issues — OSS Match");
    expect(metadata.description).toContain("Discover open GitHub issues");
  });

  it("renders page title, issues list, and issue details on success", async () => {
    vi.mocked(issuesLib.getBrowseIssues).mockResolvedValueOnce({
      status: "success",
      issues: [mockIssue],
      metadata: mockMetadata,
    });

    const jsx = await IssuesPage({
      searchParams: Promise.resolve({}),
    });

    render(jsx);

    expect(screen.getByText("Browse Open Source Issues")).toBeDefined();
    expect(screen.getByText("Implement accessible keyboard shortcuts")).toBeDefined();
    expect(screen.getByText("facebook/react")).toBeDefined();
    expect(screen.getByText("#77")).toBeDefined();
    expect(screen.getByText("Contributor friendly")).toBeDefined();
  });

  it("renders error state when issue discovery returns an error", async () => {
    vi.mocked(issuesLib.getBrowseIssues).mockResolvedValueOnce({
      status: "error",
      error: "GitHub API rate limit exceeded.",
    });

    const jsx = await IssuesPage({
      searchParams: Promise.resolve({}),
    });

    render(jsx);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Discovery Unavailable")).toBeDefined();
    expect(screen.getByText("GitHub API rate limit exceeded.")).toBeDefined();
  });

  it("renders empty state when zero issues are returned", async () => {
    vi.mocked(issuesLib.getBrowseIssues).mockResolvedValueOnce({
      status: "success",
      issues: [],
      metadata: { ...mockMetadata, totalAvailableCount: 0, returnedCount: 0 },
    });

    const jsx = await IssuesPage({
      searchParams: Promise.resolve({}),
    });

    render(jsx);

    expect(screen.getByText("No open issues discovered")).toBeDefined();
  });

  it("allows filtering by language using language buttons", async () => {
    vi.mocked(issuesLib.getBrowseIssues).mockResolvedValueOnce({
      status: "success",
      issues: [mockIssue],
      metadata: mockMetadata,
    });

    const jsx = await IssuesPage({
      searchParams: Promise.resolve({}),
    });

    render(jsx);

    // Initial state: shows issue
    expect(screen.getByText("Implement accessible keyboard shortcuts")).toBeDefined();

    // Click on "Python" filter
    const pythonBtn = screen.getByRole("button", { name: "Python" });
    fireEvent.click(pythonBtn);

    // The TypeScript issue should now be filtered out
    expect(screen.queryByText("Implement accessible keyboard shortcuts")).toBeNull();
    expect(screen.getByText("No issues match your current filters")).toBeDefined();

    // Reset filters
    const clearBtn = screen.getByRole("button", { name: "Clear all filters" });
    fireEvent.click(clearBtn);

    // Issue reappears
    expect(screen.getByText("Implement accessible keyboard shortcuts")).toBeDefined();
  });
});
