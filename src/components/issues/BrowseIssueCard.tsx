import React from "react";
import type { DiscoveredIssue } from "@/core/types/issues";
import { getLanguageColor } from "@/core/language/colors";

interface BrowseIssueCardProps {
  discovered: DiscoveredIssue;
}

export default function BrowseIssueCard({ discovered }: BrowseIssueCardProps) {
  const { issue, signals } = discovered;
  const repoFullName =
    issue.repository.fullName ||
    `${issue.repository.owner}/${issue.repository.name}`;

  const langColor = signals.primaryLanguage
    ? getLanguageColor(signals.primaryLanguage)
    : "#7B838D";

  // Clean excerpt of body (up to 140 chars)
  const bodyExcerpt = issue.body
    ? issue.body.replace(/\r?\n+/g, " ").trim().slice(0, 140)
    : null;

  return (
    <article
      aria-labelledby={`issue-title-${issue.id}`}
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "8px",
        padding: "18px 20px",
        marginBottom: "14px",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      {/* Top Header Row: Repository, Issue Number, Status Badge, Repo Stars */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <a
            href={issue.repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "13px",
              color: "#8B92FF",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {repoFullName}
          </a>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "13px",
              color: "#7B838D",
            }}
          >
            #{issue.number}
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: "#112620",
              color: "#5CE1C6",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {issue.state}
          </span>
        </div>

        {/* Repository Stats (Stars & Forks) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "12px",
            color: "#A5ABB3",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          {signals.repositoryStars > 0 && (
            <span
              title={`${signals.repositoryStars.toLocaleString()} repository stars`}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              ★ {signals.repositoryStars.toLocaleString()}
            </span>
          )}
          {signals.repositoryForks > 0 && (
            <span
              title={`${signals.repositoryForks.toLocaleString()} repository forks`}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#7B838D" }}
            >
              ⑂ {signals.repositoryForks.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Issue Title */}
      <h3
        id={`issue-title-${issue.id}`}
        style={{
          margin: "0 0 10px 0",
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: 1.4,
          color: "#F2F3F5",
        }}
      >
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "inherit",
            textDecoration: "none",
          }}
        >
          {issue.title}
        </a>
      </h3>

      {/* Excerpt if present */}
      {bodyExcerpt && (
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "13px",
            color: "#A5ABB3",
            lineHeight: 1.5,
          }}
        >
          {bodyExcerpt}
          {issue.body && issue.body.length > 140 ? "…" : ""}
        </p>
      )}

      {/* Badges: Language, Contributor Friendly, Topics, Labels */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "14px",
        }}
      >
        {/* Primary Language */}
        {signals.primaryLanguage && (
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              backgroundColor: "#1A1E22",
              border: "1px solid #2A2F35",
              color: "#F2F3F5",
              borderRadius: "4px",
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: langColor,
                display: "inline-block",
              }}
              aria-hidden="true"
            />
            {signals.primaryLanguage}
          </span>
        )}

        {/* Contributor Friendly Badge */}
        {signals.hasHelpWantedOrGoodFirstIssue && (
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#2B2112",
              border: "1px solid #5C451D",
              color: "#E7B65C",
              borderRadius: "4px",
              padding: "2px 8px",
              fontWeight: 500,
            }}
          >
            Contributor friendly
          </span>
        )}

        {/* Repository Topics */}
        {signals.repositoryTopics.slice(0, 4).map((topic) => (
          <span
            key={topic}
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              backgroundColor: "#1A1E22",
              border: "1px solid #2A2F35",
              color: "#A5ABB3",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            #{topic}
          </span>
        ))}

        {/* Issue Labels */}
        {issue.labels.slice(0, 3).map((label) => (
          <span
            key={label.name}
            style={{
              fontSize: "11px",
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              color: "#7B838D",
              borderRadius: "4px",
              padding: "2px 6px",
            }}
          >
            {label.name}
          </span>
        ))}
      </div>

      {/* Bottom Metadata Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "12px",
          color: "#7B838D",
          borderTop: "1px solid #20252A",
          paddingTop: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span>
            {signals.commentsCount} comment
            {signals.commentsCount === 1 ? "" : "s"}
          </span>
          <span>
            {signals.daysSinceUpdated === 0
              ? "Updated today"
              : `Updated ${signals.daysSinceUpdated} day${signals.daysSinceUpdated === 1 ? "" : "s"} ago`}
          </span>
        </div>

        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View issue #${issue.number} on GitHub (opens in new tab)`}
          style={{
            color: "#8B92FF",
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          View on GitHub ↗
        </a>
      </div>
    </article>
  );
}
