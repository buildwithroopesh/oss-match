"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export const DEFAULT_DEMO_HANDLES = [
  "torvalds",
  "gaearon",
  "sindresorhus",
  "antfu",
];

interface UsernameFormProps {
  /** Called when the form successfully validates and navigates */
  onSubmit?: (username: string) => void;
  size?: "default" | "large";
  initialValue?: string;
  showExamples?: boolean;
  demoHandles?: string[];
}

// GitHub username constraints
// https://docs.github.com/en/get-started/learning-about-github/github-glossary#username
const GITHUB_USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

function validateUsername(value: string): string | null {
  if (!value) return "Enter a GitHub username.";
  if (value.length > 39) return "GitHub usernames are 39 characters or fewer.";
  if (!GITHUB_USERNAME_RE.test(value))
    return "Invalid GitHub username. Use letters, numbers, or hyphens (not starting or ending with a hyphen).";
  return null;
}

/**
 * The primary GitHub username input form.
 *
 * Validates the username client-side, then navigates to /profile/[username].
 * Does not make any API calls — analysis happens server-side on the profile page.
 */
export function UsernameForm({
  onSubmit,
  size = "default",
  initialValue = "",
  showExamples = false,
  demoHandles = DEFAULT_DEMO_HANDLES,
}: UsernameFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLarge = size === "large";

  function submitUsername(targetUsername: string) {
    const username = targetUsername.trim();
    const validationError = validateUsername(username);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    onSubmit?.(username);
    router.push(`/profile/${encodeURIComponent(username)}`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitUsername(value);
  }

  function handleChange(newValue: string) {
    setValue(newValue);
    if (error) {
      const validationError = validateUsername(newValue.trim());
      setError(validationError);
    }
  }

  function handleDemoClick(handle: string) {
    setValue(handle);
    submitUsername(handle);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Analyze a GitHub profile"
      noValidate
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isLarge ? "12px" : "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexDirection: "column",
          }}
        >
          <label
            htmlFor="github-username"
            style={{
              color: "#A5ABB3",
              fontSize: isLarge ? "13px" : "12px",
              fontWeight: 500,
            }}
          >
            GitHub username
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* @ prefix */}
            <span
              aria-hidden="true"
              style={{
                color: "#7B838D",
                fontFamily: "var(--font-mono)",
                fontSize: isLarge ? "18px" : "14px",
                userSelect: "none",
              }}
            >
              @
            </span>

            <div style={{ flex: "1 1 180px", minWidth: 0 }}>
              <input
                id="github-username"
                type="text"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="torvalds"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby={error ? "username-error" : "username-hint"}
                aria-invalid={error ? "true" : undefined}
                aria-label="GitHub username"
                disabled={isLoading}
                style={{
                  backgroundColor: "#15181B",
                  border: `1px solid ${error ? "#F06A6A" : "#2A2F35"}`,
                  borderRadius: "8px",
                  color: "#F2F3F5",
                  fontFamily: "var(--font-mono)",
                  fontSize: isLarge ? "18px" : "14px",
                  padding: isLarge ? "14px 18px" : "10px 14px",
                  width: "100%",
                  outline: "none",
                  transition: "border-color 150ms",
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-label={
                isLoading ? "Analyzing profile…" : "Analyze GitHub profile"
              }
              style={{
                backgroundColor: "#8B92FF",
                border: "none",
                borderRadius: "8px",
                color: "#0E1012",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: isLarge ? "15px" : "14px",
                fontWeight: 600,
                opacity: isLoading ? 0.6 : 1,
                padding: isLarge ? "14px 28px" : "10px 20px",
                transition: "background-color 150ms, opacity 150ms",
                whiteSpace: "nowrap",
              }}
            >
              {isLoading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            id="username-error"
            role="alert"
            style={{ color: "#F06A6A", fontSize: "12px", marginTop: "2px" }}
          >
            {error}
          </p>
        )}

        {/* Hint message (hidden when error shown) */}
        {!error && (
          <p
            id="username-hint"
            style={{ color: "#7B838D", fontSize: "12px" }}
          >
            Enter a public GitHub username to analyze public repository activity.
          </p>
        )}

        {/* Quick-select convenience handles */}
        {showExamples && demoHandles.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                color: "#7B838D",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Try an example:
            </span>
            <div
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
              role="group"
              aria-label="Example GitHub usernames"
            >
              {demoHandles.map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => handleDemoClick(handle)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: "#1A1E22",
                    border: "1px solid #2A2F35",
                    borderRadius: "6px",
                    color: "#A5ABB3",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    padding: "3px 8px",
                    transition: "color 150ms, border-color 150ms",
                  }}
                  aria-label={`Analyze example user @${handle}`}
                >
                  @{handle}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
