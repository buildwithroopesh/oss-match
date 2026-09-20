# GitHub API Architecture & Reference

> Internal developer documentation for OSS Match's GitHub API transport layer (`src/core/github/`).

---

## 1. Overview & Core Boundary

All communication with `https://api.github.com` is strictly isolated inside `src/core/github/`.
The core is completely framework-independent:
- **No React / Next.js dependencies**
- **No browser APIs**
- **No `process.env` references inside `src/core`** (credentials and options are dependency-injected via `GitHubClientConfig`)
- **Strictly typed boundary validation with Zod**
- **Pure domain model outputs (`src/core/types/github.ts`)**

---

## 2. Centralized Request Standards

All HTTP requests dispatched by `GitHubClient` pass through a single centralized transport pipeline that automatically attaches standardized headers:

```http
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2026-03-10
User-Agent: oss-match/0.1.0 (+https://github.com/buildwithroopesh/oss-match)
```

### Authentication
- Configured via `token` option passed to `GitHubClient` constructor.
- Application credential: `GITHUB_API_TOKEN` (read in `src/lib/github.ts` on the server).
- Attached as `Authorization: Bearer <token>` when present.
- **Unauthenticated**: 60 requests/hour per IP.
- **Authenticated**: 5,000 requests/hour.

---

## 3. Implemented API Operations

| Method | Endpoint | Description | Cache TTL |
|---|---|---|---|
| `getUser(username)` | `GET /users/{username}` | Fetches user profile metadata | 10 minutes |
| `getRepositories(username, options)` | `GET /users/{username}/repos` | Fetches recently updated repos, capped to 30 by default | 5 minutes |
| `getRepository(owner, repo)` | `GET /repos/{owner}/{repo}` | Fetches repository details | 10 minutes |
| `getLanguages(owner, repo)` | `GET /repos/{owner}/{repo}/languages` | Fetches language byte breakdown | 15 minutes |
| `searchIssues(query, options)` | `GET /search/issues` | Searches open issues matching query | 3 minutes |
| `getIssue(owner, repo, number)` | `GET /repos/{owner}/{repo}/issues/{number}` | Fetches specific issue details | 5 minutes |
| `getRepositoryActivity(owner, repo)` | `GET /repos/{owner}/{repo}` + `GET .../commits` | Computes neutral activity telemetry | 5 minutes |
| `getRateLimitStatus()` | `GET /rate_limit` | Diagnostic-only status check | Skipped |

---

## 4. Rate-Limit Handling Policy

OSS Match adheres to strict rate-limit discipline:

### Header Telemetry
Every single response parses:
- `x-ratelimit-limit`
- `x-ratelimit-remaining`
- `x-ratelimit-used`
- `x-ratelimit-reset` (epoch seconds)
- `x-ratelimit-resource`
- `retry-after`

The latest parsed telemetry is stored in `client.lastRateLimit` and made available without issuing diagnostic network calls.

### Non-Blind Retry Rules
1. **Primary Rate Limit**: If `remaining === 0` on a 403 or 429 response, the client **never retries**. It immediately throws `GitHubRateLimitError` containing `resetEpochSeconds` and human-readable reset duration.
2. **`Retry-After` Header**: If a `retry-after` header is received, the client honors the backoff and raises `GitHubRateLimitError` with `retryAfterSeconds`.
3. **Secondary Rate Limits**: For transient secondary limit warnings (e.g. concurrency spikes) without `retry-after` and `remaining > 0`, the client performs at most **one** conservative retry after backoff.
4. **No Polling**: `GET /rate_limit` is never invoked during regular application workflows.

---

## 5. Performance: Caching & Deduplication

### Request Deduplication
Identical concurrent requests (same URL and parameters) are automatically coalesced into a single in-flight Promise via an internal `inFlight` Map. Once the request settles, all awaiting callers receive the identical result.

### In-Memory TTL Cache (`MemoryCache`)
- Lightweight, zero-dependency in-memory cache.
- Bounded to `maxEntries` (default: 200 items) to avoid memory leaks.
- Stored items automatically expire based on their endpoint-specific TTL.

---

## 6. Error Taxonomy (`src/core/github/errors.ts`)

All errors extend `GitHubError`:

```
GitHubError
├── GitHubInvalidInputError        (400: empty username, bad input)
├── GitHubUserNotFoundError        (404: user profile not found)
├── GitHubResourceNotFoundError    (404: repository/issue not found)
├── GitHubUnauthorizedError        (401: bad token or revoked credential)
├── GitHubForbiddenError           (403: permission denied)
├── GitHubRateLimitError           (403/429: primary or secondary limit reached)
├── GitHubNetworkError             (transport / connection dropped)
├── GitHubMalformedResponseError   (Zod validation failure / corrupt JSON)
└── GitHubApiError                 (5xx or other unhandled GitHub response)
```

---

## 7. Pagination Strategy

For repository fetching (`getRepositories`):
- V1 requires analyzing the **30 most recently updated repositories**.
- The client requests `per_page=30` (or `limit`), fetching only the required count.
- If `limit > 30`, it paginates in small batches up to `limit` and stops as soon as the target count is satisfied or no further pages remain.
- **It never fetches 100 repositories to discard 70.**

---

## 8. Fixture Recording (`scripts/record-fixtures.ts`)

Sanitized development fixtures can be recorded using:

```bash
npx tsx scripts/record-fixtures.ts [username]
```

### Sanitization Guarantee
- Sensitive tokens and authorization headers are never recorded.
- Private emails are automatically redacted to `[REDACTED]`.
- Output is saved to `tests/fixtures/` with explicit `_fixtureMetadata` annotations.

---

## 9. Security Considerations

- **Server-Side Only**: `GITHUB_API_TOKEN` must only be accessed in Node.js server environments (`src/lib/github.ts` or API routes).
- **No Client Exposure**: Never prefix server secrets with `NEXT_PUBLIC_`.
- **Zero Secrets in Git**: Enforced via `.gitignore`, `.env.example`, and GitHub Actions CI.
- **Untrusted Content**: Markdown bodies returned by `getIssue()` or `searchIssues()` are validated and treated as untrusted strings, never injected as unescaped HTML.
