import type { GitHubRepository } from "@/core/types/github";
import { getLanguageColor } from "@/core/language/colors";

interface RepositoryListProps {
  repositories: GitHubRepository[];
}

/**
 * Analyzed Repositories List
 *
 * Displays the public repositories evaluated during profile analysis.
 * Strictly adheres to data honesty: renders real repo attributes from GitHub.
 */
export function RepositoryList({ repositories }: RepositoryListProps) {
  if (repositories.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="analyzed-repositories-heading"
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "12px",
        padding: "24px 28px",
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
            id="analyzed-repositories-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F2F3F5",
              marginBottom: "4px",
            }}
          >
            Analyzed Repositories
          </h2>
          <p style={{ color: "#7B838D", fontSize: "13px" }}>
            Public repositories analyzed for language and technology evidence
            (sorted by recent updates)
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
          {repositories.length} repositories
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {repositories.map((repo) => {
          const langColor = repo.primaryLanguage
            ? getLanguageColor(repo.primaryLanguage)
            : null;

          return (
            <article
              key={repo.id}
              style={{
                backgroundColor: "#1A1E22",
                border: "1px solid #2A2F35",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                {/* Repo Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#8B92FF",
                      textDecoration: "none",
                      wordBreak: "break-word",
                    }}
                    aria-label={`${repo.name} on GitHub (opens in new tab)`}
                  >
                    {repo.name}
                  </a>

                  {/* Status tags */}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    {repo.isArchived && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          color: "#7B838D",
                          border: "1px solid #2A2F35",
                          borderRadius: "4px",
                          padding: "1px 5px",
                        }}
                      >
                        Archived
                      </span>
                    )}
                    {repo.isFork && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          color: "#7B838D",
                          border: "1px solid #2A2F35",
                          borderRadius: "4px",
                          padding: "1px 5px",
                        }}
                      >
                        Fork
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {repo.description && (
                  <p
                    style={{
                      color: "#A5ABB3",
                      fontSize: "13px",
                      lineHeight: 1.45,
                      marginBottom: "10px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {repo.description}
                  </p>
                )}

                {/* Topics */}
                {repo.topics && repo.topics.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          color: "#7B838D",
                          backgroundColor: "#15181B",
                          borderRadius: "4px",
                          padding: "2px 6px",
                        }}
                      >
                        #{topic}
                      </span>
                    ))}
                    {repo.topics.length > 3 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          color: "#7B838D",
                          padding: "2px 4px",
                        }}
                      >
                        +{repo.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Repo Footer: Language, Stars, Forks */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "10px",
                  borderTop: "1px solid #20252A",
                  fontSize: "12px",
                  color: "#7B838D",
                }}
              >
                {/* Language */}
                {repo.primaryLanguage ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: langColor ?? "#7B838D",
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "#F2F3F5",
                      }}
                    >
                      {repo.primaryLanguage}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontStyle: "italic", fontSize: "11px" }}>
                    No primary language
                  </span>
                )}

                {/* Stars and Forks */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title={`${repo.stars} stars`}
                  >
                    ★ {repo.stars}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title={`${repo.forks} forks`}
                  >
                    ⑂ {repo.forks}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
