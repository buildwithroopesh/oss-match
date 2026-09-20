import Link from "next/link";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: "1px solid #2A2F35",
        backgroundColor: "#101214",
        marginTop: "auto",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          {/* Brand + disclaimer */}
          <div className="flex flex-col gap-1.5">
            <span
              style={{
                fontFamily: "var(--font-display)",
                color: "#F2F3F5",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              OSS Match
            </span>
            <p style={{ color: "#7B838D", fontSize: "12px", lineHeight: 1.5 }}>
              Not affiliated with GitHub, Inc.
              <br />
              Uses only publicly available GitHub data.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
              style={{ listStyle: "none" }}
            >
              <li>
                <Link
                  href="/issues"
                  style={{ color: "#7B838D", fontSize: "13px" }}
                  className="transition-colors hover:text-fg-muted"
                >
                  Browse Issues
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/buildwithroopesh/oss-match"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7B838D", fontSize: "13px" }}
                  className="transition-colors hover:text-fg-muted"
                  aria-label="OSS Match on GitHub (opens in new tab)"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/buildwithroopesh/oss-match/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7B838D", fontSize: "13px" }}
                  className="transition-colors hover:text-fg-muted"
                  aria-label="Contributing guide (opens in new tab)"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/buildwithroopesh/oss-match/blob/main/SECURITY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7B838D", fontSize: "13px" }}
                  className="transition-colors hover:text-fg-muted"
                  aria-label="Security policy (opens in new tab)"
                >
                  Security
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #2A2F35",
            marginTop: "24px",
            paddingTop: "16px",
            color: "#7B838D",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>Open source — MIT License</span>
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            aria-label="Project version milestone 1"
          >
            v0.1.0 — Milestone 1
          </span>
        </div>
      </div>
    </footer>
  );
}
