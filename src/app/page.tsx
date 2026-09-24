import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { UsernameForm } from "@/components/profile/UsernameForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSS Match — Find open-source issues that match your experience",
  description:
    "OSS Match analyzes your public GitHub repositories to build a verified technology footprint and match relevant open-source issues.",
};

/* ─────────────────────────────────────────────────────────────────────────────
   How It Works steps — static data, not fetched from any external source
   ───────────────────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your GitHub username",
    description:
      "OSS Match analyzes your public repositories. No account required. No OAuth. Just your public handle.",
  },
  {
    step: "02",
    title: "Build your technology footprint",
    description:
      "We aggregate language byte counts and detect frameworks and tools from real evidence — package manifests, config files, and repository metadata.",
  },
  {
    step: "03",
    title: "Discover matched issues",
    description:
      "A deterministic scoring engine will match open issues to your verified footprint with transparent explanations (coming in next milestones).",
  },
];

const EXAMPLE_FOOTPRINT = [
  { lang: "TypeScript", pct: 57, color: "#3178C6" },
  { lang: "JavaScript", pct: 22, color: "#F7DF1E" },
  { lang: "Python", pct: 10, color: "#3776AB" },
  { lang: "CSS", pct: 8, color: "#1572B6" },
  { lang: "HTML", pct: 3, color: "#E34F26" },
];

export default function LandingPage() {
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

      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          style={{ padding: "80px 16px 64px" }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            {/* Eyebrow label */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#1A1C32",
                border: "1px solid rgba(139,146,255,0.25)",
                borderRadius: "20px",
                padding: "5px 14px",
                marginBottom: "32px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#8B92FF",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  color: "#8B92FF",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Open Source Developer Tool
              </span>
            </div>

            {/* Main heading */}
            <h1
              id="hero-heading"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700,
                color: "#F2F3F5",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: "20px",
              }}
            >
              Find open-source issues
              <br />
              that match your experience.
            </h1>

            {/* Subheading */}
            <p
              style={{
                color: "#A5ABB3",
                fontSize: "clamp(15px, 2.5vw, 18px)",
                lineHeight: 1.65,
                maxWidth: "560px",
                margin: "0 auto 40px",
              }}
            >
              OSS Match analyzes your public GitHub repositories to build a
              verified technology footprint, then surfaces open issues you can
              realistically contribute to — with a transparent explanation of
              why each one matches.
            </p>

            {/* Username form with quick examples */}
            <div
              style={{
                maxWidth: "540px",
                margin: "0 auto",
                textAlign: "left",
              }}
            >
              <UsernameForm size="large" showExamples={true} />
            </div>

            {/* Social proof & privacy disclaimer */}
            <p
              style={{
                color: "#7B838D",
                fontSize: "12px",
                marginTop: "24px",
                lineHeight: 1.5,
              }}
            >
              Reads only public repository data · No account or OAuth required ·
              Rate limits apply to unauthenticated requests
            </p>
          </div>
        </section>

        {/* ── Technology Footprint Preview ──────────────────────────────────── */}
        <section
          aria-labelledby="footprint-heading"
          style={{
            padding: "0 16px 80px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "12px",
              padding: "28px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <h2
                id="footprint-heading"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#7B838D",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Technology Footprint Preview
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#7B838D",
                  backgroundColor: "#20252A",
                  border: "1px solid #2A2F35",
                  borderRadius: "4px",
                  padding: "2px 8px",
                }}
                aria-label="This is an illustrative preview"
              >
                Example
              </span>
            </div>

            {/* Footprint bars */}
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {EXAMPLE_FOOTPRINT.map(({ lang, pct, color }) => (
                <li key={lang}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "#F2F3F5",
                        }}
                      >
                        {lang}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "#A5ABB3",
                      }}
                      aria-label={`${pct}% of analyzed code`}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${lang}: ${pct}% of analyzed code`}
                    style={{
                      height: "4px",
                      backgroundColor: "#20252A",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: color,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p
              style={{
                color: "#7B838D",
                fontSize: "11px",
                marginTop: "16px",
                fontFamily: "var(--font-mono)",
              }}
            >
              Percentages represent proportion of analyzed code by byte count,
              not skill level or proficiency.
            </p>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="how-it-works-heading"
          style={{
            padding: "0 16px 96px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h2
            id="how-it-works-heading"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#7B838D",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            How It Works
          </h2>

          <ol
            style={{
              listStyle: "none",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <li
                key={step}
                style={{
                  backgroundColor: "#15181B",
                  border: "1px solid #2A2F35",
                  borderRadius: "10px",
                  padding: "24px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#8B92FF",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "10px",
                  }}
                  aria-label={`Step ${step}`}
                >
                  {step}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#F2F3F5",
                    marginBottom: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    color: "#A5ABB3",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Honest Framing ───────────────────────────────────────────────── */}
        <section
          aria-labelledby="honest-framing-heading"
          style={{
            padding: "0 16px 96px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "10px",
              padding: "28px 32px",
            }}
          >
            <h2
              id="honest-framing-heading"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color: "#7B838D",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              What OSS Match is — and is not
            </h2>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  term: "Technology footprint",
                  description:
                    "Language percentages represent proportion of analyzed code by byte count. They reflect observable activity, not subjective expertise.",
                },
                {
                  term: "Evidence-based detection",
                  description:
                    "Technologies are detected from observable signals — package manifests, configuration files, and repository metadata.",
                },
                {
                  term: "Deterministic matching",
                  description:
                    "Matching uses a transparent, deterministic algorithm with visible weights. The same repository data always produces the same profile.",
                },
                {
                  term: "Public data only",
                  description:
                    "OSS Match reads only public GitHub repositories. No private data is accessed, stored, or required.",
                },
              ].map(({ term, description }) => (
                <div key={term}>
                  <dt
                    style={{
                      color: "#F2F3F5",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    {term}
                  </dt>
                  <dd
                    style={{
                      color: "#7B838D",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          style={{ padding: "0 16px 96px", textAlign: "center" }}
        >
          <h2
            id="cta-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color: "#F2F3F5",
              letterSpacing: "-0.02em",
              marginBottom: "16px",
            }}
          >
            Ready to analyze your repository footprint?
          </h2>
          <p
            style={{
              color: "#A5ABB3",
              fontSize: "16px",
              marginBottom: "32px",
            }}
          >
            Enter your GitHub username to inspect your language breakdown and
            detected technologies.
          </p>
          <div
            style={{ maxWidth: "480px", margin: "0 auto", textAlign: "left" }}
          >
            <UsernameForm showExamples={true} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
