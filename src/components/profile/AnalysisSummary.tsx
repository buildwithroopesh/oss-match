import type { ProfileAnalysisMetadata } from "@/core/types/pipeline";

interface AnalysisSummaryProps {
  metadata: ProfileAnalysisMetadata;
  totalLanguagesCount: number;
}

/**
 * Analysis Summary Bar and Partial Notice
 *
 * Displays high-level repository and language metrics from the pipeline run.
 * If status is partial or warnings occurred, renders an accessible warning banner
 * detailing the specific non-fatal issues (and rate limit context if applicable).
 */
export function AnalysisSummary({
  metadata,
  totalLanguagesCount,
}: AnalysisSummaryProps) {
  const isPartial =
    metadata.status === "partial" || metadata.warnings.length > 0;

  return (
    <section aria-labelledby="analysis-summary-heading" style={{ marginBottom: "24px" }}>
      <h2 id="analysis-summary-heading" className="sr-only">
        Analysis Summary
      </h2>

      {/* Partial Warning Banner */}
      {isPartial && (
        <div
          role="alert"
          style={{
            backgroundColor: "rgba(231, 182, 92, 0.08)",
            border: "1px solid rgba(231, 182, 92, 0.3)",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span
              style={{
                color: "#E7B65C",
                fontSize: "16px",
                lineHeight: 1,
                marginTop: "2px",
              }}
              aria-hidden="true"
            >
              ⚠
            </span>
            <div>
              <h3
                style={{
                  color: "#E7B65C",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Partial Analysis Notice
              </h3>
              <p
                style={{
                  color: "#A5ABB3",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  marginBottom: metadata.warnings.length > 0 ? "8px" : "0",
                }}
              >
                Some repository data could not be fully fetched. Analysis was
                completed using all successfully collected evidence.
              </p>

              {metadata.warnings.length > 0 && (
                <ul
                  style={{
                    listStyle: "disc",
                    paddingLeft: "20px",
                    color: "#A5ABB3",
                    fontSize: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {metadata.warnings.map((warning, idx) => (
                    <li key={idx} style={{ fontFamily: "var(--font-mono)" }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              )}

              {metadata.rateLimitRemaining !== undefined && (
                <p
                  style={{
                    color: "#7B838D",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    marginTop: "8px",
                  }}
                >
                  Remaining GitHub API quota: {metadata.rateLimitRemaining}{" "}
                  requests.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            backgroundColor: "#15181B",
            border: "1px solid #2A2F35",
            borderRadius: "8px",
            padding: "14px 18px",
          }}
        >
          <span
            style={{
              color: "#7B838D",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Repositories Analyzed
          </span>
          <span
            style={{
              color: "#F2F3F5",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            {metadata.repositoriesAnalyzed}
            <span
              style={{
                color: "#7B838D",
                fontSize: "13px",
                fontWeight: 400,
                marginLeft: "4px",
              }}
            >
              / {metadata.repositoriesFound} found
            </span>
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#15181B",
            border: "1px solid #2A2F35",
            borderRadius: "8px",
            padding: "14px 18px",
          }}
        >
          <span
            style={{
              color: "#7B838D",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Languages Detected
          </span>
          <span
            style={{
              color: "#F2F3F5",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            {totalLanguagesCount}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#15181B",
            border: "1px solid #2A2F35",
            borderRadius: "8px",
            padding: "14px 18px",
          }}
        >
          <span
            style={{
              color: "#7B838D",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Repositories Skipped
          </span>
          <span
            style={{
              color: "#F2F3F5",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            {metadata.repositoriesSkipped}
            <span
              style={{
                color: "#7B838D",
                fontSize: "12px",
                fontWeight: 400,
                marginLeft: "4px",
              }}
            >
              (empty or 0 bytes)
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
