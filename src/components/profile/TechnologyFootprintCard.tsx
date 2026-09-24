import type {
  DetectedTechnology,
  EvidenceLevel,
} from "@/core/types/technology";

interface TechnologyFootprintCardProps {
  technologies: DetectedTechnology[];
}

function getEvidenceBadgeStyle(level: EvidenceLevel) {
  switch (level) {
    case "strong":
      return {
        bg: "rgba(92, 225, 198, 0.1)",
        color: "#5CE1C6",
        border: "rgba(92, 225, 198, 0.3)",
        label: "Strong Evidence",
      };
    case "moderate":
      return {
        bg: "rgba(231, 182, 92, 0.1)",
        color: "#E7B65C",
        border: "rgba(231, 182, 92, 0.3)",
        label: "Moderate Evidence",
      };
    case "limited":
    case "detected":
    default:
      return {
        bg: "rgba(165, 171, 179, 0.1)",
        color: "#A5ABB3",
        border: "rgba(165, 171, 179, 0.3)",
        label: "Limited Evidence",
      };
  }
}

/**
 * Technology Footprint Card
 *
 * Displays technologies detected through deterministic multi-signal evidence.
 * Strictly adheres to data honesty:
 * - Badges reflect explicit evidenceLevel from registry matches.
 * - Recency is only rendered if daysSinceMostRecent is non-null (computed from injected `now`).
 */
export function TechnologyFootprintCard({
  technologies,
}: TechnologyFootprintCardProps) {
  const hasTech = technologies.length > 0;

  return (
    <section
      aria-labelledby="tech-footprint-heading"
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
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            id="tech-footprint-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F2F3F5",
              marginBottom: "4px",
            }}
          >
            Detected Technologies
          </h2>
          <p style={{ color: "#7B838D", fontSize: "13px" }}>
            Identified through package manifests, configuration files, and
            repository metadata
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
          {technologies.length} detected
        </span>
      </div>

      {!hasTech ? (
        <p style={{ color: "#7B838D", fontSize: "14px", fontStyle: "italic" }}>
          No registered framework or tool technologies were identified from
          analyzed repository manifests.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {technologies.map((tech) => {
            const badge = getEvidenceBadgeStyle(tech.evidenceLevel);

            return (
              <div
                key={tech.id}
                style={{
                  backgroundColor: "#1A1E22",
                  border: "1px solid #2A2F35",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#F2F3F5",
                      }}
                    >
                      {tech.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "var(--font-mono)",
                      color: "#8B92FF",
                      marginBottom: "10px",
                    }}
                  >
                    {tech.category}
                  </span>

                  {/* Evidence Summaries */}
                  {tech.evidenceSummary.length > 0 && (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {tech.evidenceSummary.map((summary, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: "12px",
                            color: "#A5ABB3",
                            lineHeight: 1.4,
                            display: "flex",
                            alignItems: "baseline",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              color: "#7B838D",
                              fontSize: "10px",
                              lineHeight: 1,
                            }}
                            aria-hidden="true"
                          >
                            ▪
                          </span>
                          <span>{summary}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer metadata: Repo count & deterministic recency */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "10px",
                    borderTop: "1px solid #20252A",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "#7B838D",
                  }}
                >
                  <span>
                    {tech.repositoryCount}{" "}
                    {tech.repositoryCount === 1 ? "repo" : "repos"}
                  </span>

                  {tech.daysSinceMostRecent !== null && (
                    <span>
                      {tech.daysSinceMostRecent === 0
                        ? "Active today"
                        : tech.daysSinceMostRecent === 1
                        ? "Active 1 day ago"
                        : `Active ${tech.daysSinceMostRecent} days ago`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
