import Link from "next/link";
import { UsernameForm } from "./UsernameForm";
import {
  PipelineError,
  PipelineUserNotFoundError,
  PipelineRateLimitExhaustedError,
  PipelineInvalidUsernameError,
} from "@/core/pipeline/errors";

interface ProfileErrorStateProps {
  error: PipelineError;
  username: string;
}

/**
 * Profile Error State Component
 *
 * Renders tailored, accessible error cards for pipeline failures,
 * including 404 user not found, rate limit exhaustion, and invalid usernames.
 */
export function ProfileErrorState({
  error,
  username,
}: ProfileErrorStateProps) {
  let title = "Analysis Failed";
  let description = error.message;
  let codeTag = error.code;
  let resetNotice: string | null = null;

  if (error instanceof PipelineUserNotFoundError || error.code === "USER_NOT_FOUND") {
    title = "User Not Found";
    description = `GitHub user "@${username}" was not found. Please verify the username spelling and try again.`;
    codeTag = "404 Not Found";
  } else if (
    error instanceof PipelineRateLimitExhaustedError ||
    error.code === "RATE_LIMIT_EXHAUSTED"
  ) {
    title = "GitHub API Rate Limit Reached";
    description =
      "The GitHub API request quota for unauthenticated requests has been exhausted. Analysis cannot proceed until the quota resets.";
    codeTag = "Rate Limit 403";

    if ("resetTimeEpoch" in error && typeof error.resetTimeEpoch === "number") {
      const resetDate = new Date(error.resetTimeEpoch * 1000);
      resetNotice = `Quota resets at approximately ${resetDate.toLocaleTimeString(
        "en-US",
        { hour: "2-digit", minute: "2-digit", second: "2-digit" }
      )} UTC.`;
    }
  } else if (
    error instanceof PipelineInvalidUsernameError ||
    error.code === "INVALID_USERNAME"
  ) {
    title = "Invalid GitHub Username";
    description = `"${username}" does not match GitHub's username constraints (up to 39 alphanumeric characters or single hyphens).`;
    codeTag = "Validation Error";
  }

  return (
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
      {/* Error icon indicator */}
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

      <span
        style={{
          display: "inline-block",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "#F06A6A",
          backgroundColor: "rgba(240, 106, 106, 0.1)",
          border: "1px solid rgba(240, 106, 106, 0.2)",
          borderRadius: "4px",
          padding: "2px 8px",
          marginBottom: "12px",
        }}
      >
        {codeTag}
      </span>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 700,
          color: "#F2F3F5",
          marginBottom: "8px",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          color: "#A5ABB3",
          fontSize: "14px",
          lineHeight: 1.6,
          maxWidth: "460px",
          margin: "0 auto 12px",
        }}
      >
        {description}
      </p>

      {resetNotice && (
        <p
          style={{
            color: "#E7B65C",
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            marginBottom: "24px",
          }}
        >
          {resetNotice}
        </p>
      )}

      {/* Inline retry form */}
      <div
        style={{
          maxWidth: "420px",
          margin: "24px auto 20px",
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
          marginTop: "8px",
        }}
      >
        ← Return to home page
      </Link>
    </div>
  );
}
