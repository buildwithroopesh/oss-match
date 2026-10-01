import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrowseIssuesSection } from "@/components/issues";
import { getBrowseIssues } from "@/lib/issues";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Browse Open Source Issues — OSS Match",
  description:
    "Discover open GitHub issues from active repositories. Filter by language or contributor-friendly labels, or match directly to your profile.",
};

interface IssuesPageProps {
  searchParams: Promise<{
    lang?: string;
    friendly?: string;
    q?: string;
  }>;
}

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const params = await searchParams;
  const lang = params.lang;
  const friendlyOnly = params.friendly === "true";
  const query = params.q;

  const state = await getBrowseIssues({
    language: lang,
    friendlyOnly,
    query,
  });

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
          maxWidth: "960px",
          margin: "0 auto",
          padding: "40px 16px 64px",
          width: "100%",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display), var(--font-geist), sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              color: "#F2F3F5",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Browse Open Source Issues
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#A5ABB3",
              lineHeight: 1.6,
              maxWidth: "680px",
            }}
          >
            Discover real open issues across verified open-source repositories.
            Filter by language or contributor-friendly labels, or enter your GitHub
            username to calculate personalized match scores.
          </p>
        </div>

        {/* Content State */}
        {state.status === "error" ? (
          <div
            role="alert"
            style={{
              maxWidth: "600px",
              margin: "40px auto",
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "12px",
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(240, 106, 106, 0.1)",
                border: "1px solid rgba(240, 106, 106, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#F06A6A",
                fontSize: "20px",
                fontFamily: "var(--font-mono)",
              }}
              aria-hidden="true"
            >
              !
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "#F2F3F5",
                marginBottom: "8px",
              }}
            >
              Discovery Unavailable
            </h2>

            <p
              style={{
                color: "#A5ABB3",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 auto 20px",
              }}
            >
              {state.error}
            </p>

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
          </div>
        ) : (
          <BrowseIssuesSection
            initialIssues={state.issues}
            metadata={state.metadata}
            initialLanguage={lang}
            initialFriendlyOnly={friendlyOnly}
            initialQuery={query}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
