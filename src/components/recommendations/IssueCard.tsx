import React from "react";
import type { IssueMatch } from "@/core/types/matching";

interface IssueCardProps {
  match: IssueMatch;
}

export default function IssueCard({ match }: IssueCardProps) {
  const { issue, signals, score, explanation } = match;

  // Semantic color for match score
  let scoreColor = "#A5ABB3";
  let scoreBg = "#1A1E22";
  if (score >= 75) {
    scoreColor = "#5CE1C6";
    scoreBg = "#112620";
  } else if (score >= 50) {
    scoreColor = "#8B92FF";
    scoreBg = "#1A1C32";
  }

  const repoFullName = issue.repository.fullName || `${issue.repository.owner}/${issue.repository.name}`;

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
      {/* Top Header Row: Repository, Issue Number, Status Badge, External Link */}
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

        {/* Match Score Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: scoreBg,
            border: `1px solid ${scoreColor}40`,
            borderRadius: "6px",
            padding: "4px 10px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#A5ABB3",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 500,
            }}
          >
            Match score
          </span>
          <span
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: scoreColor,
            }}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Issue Title */}
      <h3
        id={`issue-title-${issue.id}`}
        style={{
          margin: "0 0 12px 0",
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

      {/* Observable Evidence Badges: Technologies, Language Code Volume, Topics, Labels */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "14px",
        }}
      >
        {/* Matched Technologies from issue labels */}
        {explanation.matchedTechnologies.map((tech) => (
          <span
            key={tech}
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              backgroundColor: "#1A1C32",
              border: "1px solid #3B427A",
              color: "#8B92FF",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            {tech}
          </span>
        ))}

        {/* Matched Languages with analyzed code volume percentage */}
        {explanation.matchedLanguages.map((ml) => (
          <span
            key={ml.language}
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              backgroundColor: "#1C2420",
              border: "1px solid #285444",
              color: "#5CE1C6",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            {ml.language} ({ml.userPercentage}% of analyzed code)
          </span>
        ))}

        {/* Matched Topics from repository */}
        {explanation.matchedTopics.map((topic) => (
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

        {/* Contributor invitation label */}
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
      </div>

      {/* Factual Explanation Details */}
      {explanation.reasons.length > 0 && (
        <div
          style={{
            backgroundColor: "#101214",
            border: "1px solid #20252A",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "12px",
          }}
        >
          <ul
            style={{
              margin: 0,
              paddingLeft: "16px",
              fontSize: "13px",
              color: "#D0D6DE",
              lineHeight: 1.5,
            }}
          >
            {explanation.reasons.map((reason, idx) => (
              <li key={idx} style={{ marginBottom: idx === explanation.reasons.length - 1 ? 0 : "4px" }}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unavailable Components Notice if applicable */}
      {explanation.unavailableComponents.length > 0 && (
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "11px",
            color: "#7B838D",
            fontStyle: "italic",
          }}
        >
          Note: {explanation.unavailableComponents.join(", ")} omitted from score calculation (observable data not provided). Remaining components renormalized.
        </p>
      )}

      {/* Bottom Metadata Bar: Comments, Updated Time, GitHub External Link */}
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
            {signals.commentsCount} comment{signals.commentsCount === 1 ? "" : "s"}
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
