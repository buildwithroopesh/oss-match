# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.x (current) | ✓ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a security vulnerability, please email the maintainers directly or use [GitHub's private security advisory feature](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).

Provide:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

You will receive a response within 72 hours. If the vulnerability is accepted, we will work with you on a coordinated disclosure timeline.

---

## Security Design

OSS Match is designed with these security principles:

### Server-side secrets

`GITHUB_API_TOKEN` and all other secrets are server-side only. They are never included in client-side JavaScript bundles, API responses, logs, or fixtures committed to the repository.

### Public data only

OSS Match reads only publicly available GitHub data. No private repositories, no private user information, no OAuth tokens belonging to end users.

### No stored user data

OSS Match V1 does not store any user data. Profile analyses are performed live from GitHub's public API and not persisted.

### External content handling

GitHub issue bodies and other external content are treated as untrusted. They are never rendered as raw HTML. Markdown is either rendered safely or displayed as plain text excerpts.

### Input validation

All user inputs are validated before use. GitHub API responses are validated at the boundary using Zod schemas.

---

## Known Limitations

- OSS Match relies on GitHub's public API. GitHub API responses are trusted as the authoritative source of public repository data.
- Rate limiting is handled gracefully, but unauthenticated deployments are limited to 60 requests/hour by GitHub.
