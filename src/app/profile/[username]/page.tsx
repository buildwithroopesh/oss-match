import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — Profile Analysis`,
    description: `Technology footprint and issue recommendations for GitHub user @${username}.`,
  };
}

/**
 * Profile page — /profile/[username]
 *
 * Milestone 1: Placeholder only.
 * The full profile analysis pipeline (GitHub API + technology detection +
 * matching engine) will be implemented in Milestones 2–9.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0E1012",
      }}
    >
      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          maxWidth: "900px",
          margin: "0 auto",
          padding: "48px 16px",
          width: "100%",
        }}
      >
        {/* Username header */}
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#7B838D",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Profile Analysis
          </p>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "28px",
              fontWeight: 700,
              color: "#F2F3F5",
              letterSpacing: "-0.02em",
            }}
          >
            @{username}
          </h1>
        </div>

        {/* Milestone placeholder */}
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#15181B",
            border: "1px solid #2A2F35",
            borderRadius: "10px",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#1A1C32",
              border: "1px solid rgba(139,146,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="9" stroke="#8B92FF" strokeWidth="1.5" />
              <circle cx="10" cy="10" r="3" fill="#8B92FF" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F2F3F5",
              marginBottom: "8px",
            }}
          >
            Profile analysis coming soon
          </h2>
          <p
            style={{
              color: "#7B838D",
              fontSize: "14px",
              maxWidth: "420px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            The GitHub API client, technology detection, and matching engine are
            being built in Milestones 2–8. This page will show your technology
            footprint and matched issues when ready.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#7B838D",
              marginTop: "20px",
              backgroundColor: "#20252A",
              border: "1px solid #2A2F35",
              borderRadius: "4px",
              padding: "4px 10px",
              display: "inline-block",
            }}
          >
            Milestone 1 of 11
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
