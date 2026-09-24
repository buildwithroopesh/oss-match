import { describe, it, expect } from "vitest";
import { buildIssueSearchQuery } from "@/core/issues/queryBuilder";

describe("buildIssueSearchQuery", () => {
  it("generates default qualifiers when called with empty criteria", () => {
    const query = buildIssueSearchQuery();
    expect(query).toBe("is:issue state:open archived:false");
  });

  it("handles state qualifiers (open, closed, all)", () => {
    expect(buildIssueSearchQuery({ state: "open" })).toContain("state:open");
    expect(buildIssueSearchQuery({ state: "closed" })).toContain("state:closed");
    expect(buildIssueSearchQuery({ state: "all" })).not.toContain("state:");
  });

  it("omits archived:false when excludeArchived is false", () => {
    const query = buildIssueSearchQuery({ excludeArchived: false });
    expect(query).not.toContain("archived:false");
  });

  it("adds language qualifiers", () => {
    const query = buildIssueSearchQuery({
      languages: ["typescript", "rust"],
    });
    expect(query).toContain("language:typescript");
    expect(query).toContain("language:rust");
  });

  it("quotes multi-word labels automatically", () => {
    const query = buildIssueSearchQuery({
      labels: ["good first issue", "help wanted", "bug"],
    });
    expect(query).toContain('label:"good first issue"');
    expect(query).toContain('label:"help wanted"');
    expect(query).toContain("label:bug");
  });

  it("handles repo with full owner/name or separate owner and repo", () => {
    expect(buildIssueSearchQuery({ repo: "facebook/react" })).toContain(
      "repo:facebook/react"
    );
    expect(
      buildIssueSearchQuery({ owner: "vercel", repo: "next.js" })
    ).toContain("repo:vercel/next.js");
  });

  it("handles org qualifier and user qualifier", () => {
    expect(buildIssueSearchQuery({ org: "google" })).toContain("org:google");
    expect(buildIssueSearchQuery({ owner: "torvalds" })).toContain("user:torvalds");
  });

  it("formats comment ranges correctly", () => {
    expect(buildIssueSearchQuery({ minComments: 2, maxComments: 10 })).toContain(
      "comments:2..10"
    );
    expect(buildIssueSearchQuery({ minComments: 5 })).toContain("comments:>=5");
    expect(buildIssueSearchQuery({ maxComments: 3 })).toContain("comments:<=3");
  });

  it("formats updatedAfter and createdAfter qualifiers", () => {
    expect(buildIssueSearchQuery({ updatedAfter: "2025-01-15" })).toContain(
      "updated:>=2025-01-15"
    );
    // Full ISO should extract date
    expect(
      buildIssueSearchQuery({ createdAfter: "2025-06-01T12:00:00.000Z" })
    ).toContain("created:>=2025-06-01");
  });

  it("appends keywords with whitespace and quotes multi-word keywords", () => {
    const query = buildIssueSearchQuery({
      keywords: ["compiler", "memory leak"],
    });
    expect(query).toContain("compiler");
    expect(query).toContain('"memory leak"');
  });
});
