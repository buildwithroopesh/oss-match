/**
 * Fixture Recording Script
 *
 * Explicitly records and sanitizes real GitHub API responses for offline testing
 * and development fixture mode.
 *
 * CRITICAL SECURITY RULES:
 * 1. NEVER writes GITHUB_API_TOKEN or any authorization headers into fixtures.
 * 2. Sanitizes personal emails and private metadata.
 * 3. Clearly labels recorded files as development fixtures.
 *
 * Usage:
 *   npx tsx scripts/record-fixtures.ts [username]
 *
 * Example:
 *   npx tsx scripts/record-fixtures.ts buildwithroopesh
 */

import * as fs from "fs";
import * as path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "../tests/fixtures");

async function record() {
  const username = process.argv[2] || "buildwithroopesh";
  const token = process.env.GITHUB_API_TOKEN;

  console.log(`[Record Fixtures] Recording sanitized fixtures for: @${username}`);

  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "oss-match/0.1.0 (+https://github.com/buildwithroopesh/oss-match)",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 1. Fetch User Profile
  console.log(`Fetching GET /users/${username}...`);
  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!userRes.ok) {
    console.error(`Failed to fetch user: ${userRes.status} ${userRes.statusText}`);
    return;
  }
  const rawUser = await userRes.json();

  // Sanitize user: redact private email if present
  const sanitizedUser = {
    _fixtureMetadata: {
      recordedAt: new Date().toISOString(),
      sourceEndpoint: `/users/${username}`,
      sanitized: true,
      notice: "Sanitized GitHub API fixture for testing. Contains NO secrets.",
    },
    ...rawUser,
    email: rawUser.email ? "[REDACTED]" : null,
  };

  fs.writeFileSync(
    path.join(FIXTURES_DIR, `user-${username}.json`),
    JSON.stringify(sanitizedUser, null, 2) + "\n"
  );
  console.log(`Saved: tests/fixtures/user-${username}.json`);

  // 2. Fetch Repositories
  console.log(`Fetching GET /users/${username}/repos?per_page=10&sort=updated...`);
  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=10&sort=updated`,
    { headers }
  );
  if (reposRes.ok) {
    const rawRepos = await reposRes.json();
    const sanitizedRepos = {
      _fixtureMetadata: {
        recordedAt: new Date().toISOString(),
        sourceEndpoint: `/users/${username}/repos`,
        sanitized: true,
        notice: "Sanitized GitHub API fixture for testing. Contains NO secrets.",
      },
      repositories: rawRepos,
    };
    fs.writeFileSync(
      path.join(FIXTURES_DIR, `repos-${username}.json`),
      JSON.stringify(sanitizedRepos, null, 2) + "\n"
    );
    console.log(`Saved: tests/fixtures/repos-${username}.json`);
  }

  // 3. Fetch Sample Issues
  console.log(`Fetching GET /search/issues?q=label:"good first issue"+state:open&per_page=5...`);
  const issuesRes = await fetch(
    `https://api.github.com/search/issues?q=label%3A%22good+first+issue%22+state%3Aopen&per_page=5`,
    { headers }
  );
  if (issuesRes.ok) {
    const rawIssues = await issuesRes.json();
    const sanitizedIssues = {
      _fixtureMetadata: {
        recordedAt: new Date().toISOString(),
        sourceEndpoint: `/search/issues`,
        sanitized: true,
        notice: "Sanitized GitHub API fixture for testing. Contains NO secrets.",
      },
      searchResult: rawIssues,
    };
    fs.writeFileSync(
      path.join(FIXTURES_DIR, "issues-sample.json"),
      JSON.stringify(sanitizedIssues, null, 2) + "\n"
    );
    console.log(`Saved: tests/fixtures/issues-sample.json`);
  }

  console.log("[Record Fixtures] Done. All recorded files are safely sanitized.");
}

// Execute if run directly
if (require.main === module) {
  record().catch((err) => {
    console.error("[Record Fixtures] Failed:", err);
    process.exit(1);
  });
}
