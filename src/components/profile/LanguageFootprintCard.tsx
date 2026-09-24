import type { LanguageFootprint } from "@/core/types/language";
import { formatBytes } from "@/lib/format";

interface LanguageFootprintCardProps {
  footprint: LanguageFootprint;
}

/**
 * Language Footprint Card
 *
 * Displays the proportional language breakdown across analyzed repositories.
 * Strictly enforces terminology guardrails: "percentage of analyzed code" or
 * "code volume" (never "skill" or "expertise").
 */
export function LanguageFootprintCard({
  footprint,
}: LanguageFootprintCardProps) {
  const hasEntries = footprint.entries.length > 0;

  return (
    <section
      aria-labelledby="language-footprint-heading"
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "12px",
        padding: "24px 28px",
        marginBottom: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            id="language-footprint-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F2F3F5",
              marginBottom: "4px",
            }}
          >
            Language Footprint
          </h2>
          <p style={{ color: "#7B838D", fontSize: "13px" }}>
            Calculated from {footprint.analyzedRepositoriesCount} repositories (
            {formatBytes(footprint.totalBytes)} total analyzed code)
          </p>
        </div>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "#A5ABB3",
            backgroundColor: "#1A1E22",
            border: "1px solid #2A2F35",
            borderRadius: "4px",
            padding: "3px 8px",
          }}
        >
          {footprint.uniqueLanguagesCount} languages
        </span>
      </div>

      {!hasEntries ? (
        <p style={{ color: "#7B838D", fontSize: "14px", fontStyle: "italic" }}>
          No language byte data available from analyzed repositories.
        </p>
      ) : (
        <>
          {/* Proportional Segmented Bar */}
          <div
            role="img"
            aria-label="Visual breakdown of analyzed code by programming language"
            style={{
              display: "flex",
              height: "10px",
              borderRadius: "5px",
              overflow: "hidden",
              backgroundColor: "#20252A",
              marginBottom: "20px",
              gap: "2px",
            }}
          >
            {footprint.entries.map((entry) => (
              <div
                key={entry.language}
                title={`${entry.language}: ${entry.percentage}% of analyzed code`}
                style={{
                  width: `${entry.percentage}%`,
                  backgroundColor: entry.color,
                  minWidth: entry.percentage > 0 ? "4px" : "0px",
                }}
              />
            ))}
          </div>

          {/* Language Breakdown Legend / Table */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {footprint.entries.map((entry) => (
              <div
                key={entry.language}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#1A1E22",
                  border: "1px solid #2A2F35",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: entry.color,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "#F2F3F5",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.language}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#F2F3F5",
                    }}
                    aria-label={`${entry.percentage}% of analyzed code`}
                  >
                    {entry.percentage}%
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "#7B838D",
                    }}
                  >
                    {formatBytes(entry.bytes)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Honest Terminology Note */}
          <p
            style={{
              color: "#7B838D",
              fontSize: "12px",
              marginTop: "16px",
              lineHeight: 1.5,
              borderTop: "1px solid #20252A",
              paddingTop: "12px",
            }}
          >
            Percentages represent proportion of analyzed code volume by byte
            count, not skill level or proficiency.
          </p>
        </>
      )}
    </section>
  );
}
