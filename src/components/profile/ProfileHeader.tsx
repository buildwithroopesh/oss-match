import type { GitHubUser } from "@/core/types/github";
import type { ProfileAnalysisMetadata } from "@/core/types/pipeline";
import { formatDate } from "@/lib/format";

interface ProfileHeaderProps {
  user: GitHubUser;
  metadata: ProfileAnalysisMetadata;
}

/**
 * Profile Header Component
 *
 * Renders verified GitHub profile details and analysis completion status.
 * Strictly adheres to data honesty: renders only real GitHubUser attributes.
 */
export function ProfileHeader({ user, metadata }: ProfileHeaderProps) {
  const isComplete = metadata.status === "complete";
  const formattedDate = formatDate(metadata.analyzedAt);

  return (
    <header
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "12px",
        padding: "24px 28px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        {/* User Info Group */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
          {/* Avatar with fallback styling */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #2A2F35",
              backgroundColor: "#1A1E22",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt={`@${user.login}'s GitHub avatar`}
              width={72}
              height={72}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: "8px 12px",
                marginBottom: "4px",
              }}
            >
              {user.name && (
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#F2F3F5",
                    lineHeight: 1.2,
                  }}
                >
                  {user.name}
                </h1>
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: user.name ? "16px" : "24px",
                  fontWeight: user.name ? 500 : 700,
                  color: user.name ? "#A5ABB3" : "#F2F3F5",
                }}
              >
                @{user.login}
              </span>
            </div>

            {user.bio && (
              <p
                style={{
                  color: "#A5ABB3",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  maxWidth: "580px",
                  marginBottom: "12px",
                }}
              >
                {user.bio}
              </p>
            )}

            {/* User Meta Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "12px",
                fontSize: "13px",
                color: "#7B838D",
              }}
            >
              <span>
                <strong style={{ color: "#F2F3F5", fontWeight: 600 }}>
                  {user.publicRepos}
                </strong>{" "}
                public repos
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong style={{ color: "#F2F3F5", fontWeight: 600 }}>
                  {user.followers}
                </strong>{" "}
                followers
              </span>
              <span aria-hidden="true">·</span>
              <a
                href={user.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#8B92FF",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                }}
                aria-label={`View @${user.login} on GitHub (opens in new tab)`}
              >
                View on GitHub
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 3h7v7" />
                  <path d="M13 3L7 9" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Status Badge & Timestamp */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              backgroundColor: isComplete
                ? "rgba(92, 225, 198, 0.1)"
                : "rgba(231, 182, 92, 0.1)",
              color: isComplete ? "#5CE1C6" : "#E7B65C",
              border: `1px solid ${
                isComplete
                  ? "rgba(92, 225, 198, 0.3)"
                  : "rgba(231, 182, 92, 0.3)"
              }`,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isComplete ? "#5CE1C6" : "#E7B65C",
              }}
              aria-hidden="true"
            />
            {isComplete ? "Analysis Complete" : "Partial Analysis"}
          </span>

          <span
            style={{
              color: "#7B838D",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Analyzed {formattedDate}
          </span>
        </div>
      </div>
    </header>
  );
}
