import Link from "next/link";
import { UsernameForm } from "./UsernameForm";

interface EmptyProfileCardProps {
  username: string;
}

/**
 * Empty Profile Card
 *
 * Rendered when a GitHub user exists but has 0 public repositories to analyze.
 */
export function EmptyProfileCard({ username }: EmptyProfileCardProps) {
  return (
    <section
      aria-labelledby="empty-profile-heading"
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "12px",
        padding: "48px 32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#1A1E22",
          border: "1px solid #2A2F35",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          color: "#7B838D",
          fontSize: "20px",
        }}
        aria-hidden="true"
      >
        ∅
      </div>

      <h2
        id="empty-profile-heading"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          fontWeight: 600,
          color: "#F2F3F5",
          marginBottom: "8px",
        }}
      >
        No Public Repositories Found
      </h2>

      <p
        style={{
          color: "#A5ABB3",
          fontSize: "14px",
          maxWidth: "480px",
          margin: "0 auto 28px",
          lineHeight: 1.6,
        }}
      >
        GitHub user <strong style={{ color: "#F2F3F5" }}>@{username}</strong> does
        not have any public repositories with code activity. OSS Match requires
        public code to compute language footprints and detect technologies.
      </p>

      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto 20px",
          textAlign: "left",
        }}
      >
        <UsernameForm showExamples={true} />
      </div>

      <Link
        href="/"
        style={{
          color: "#8B92FF",
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        ← Return to home page
      </Link>
    </section>
  );
}
