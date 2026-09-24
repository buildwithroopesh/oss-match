import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import {
  PipelineUserNotFoundError,
  PipelineRateLimitExhaustedError,
  PipelineInvalidUsernameError,
  PipelineApiError,
} from "@/core/pipeline/errors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("ProfileErrorState", () => {
  it("renders 404 user not found error with helpful guidance", () => {
    const error = new PipelineUserNotFoundError("nonexistent-user");
    render(<ProfileErrorState error={error} username="nonexistent-user" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("User Not Found")).toBeInTheDocument();
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/GitHub user "@nonexistent-user" was not found/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Return to home page/i)).toBeInTheDocument();
  });

  it("renders rate limit exhausted error with reset time", () => {
    const error = new PipelineRateLimitExhaustedError(
      "API rate limit exceeded",
      "primary",
      {
        resetTimeEpoch: 1774483200, // Unix epoch seconds
      }
    );
    render(<ProfileErrorState error={error} username="active-user" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("GitHub API Rate Limit Reached")
    ).toBeInTheDocument();
    expect(screen.getByText("Rate Limit 403")).toBeInTheDocument();
    expect(
      screen.getByText(/Quota resets at approximately/i)
    ).toBeInTheDocument();
  });

  it("renders invalid username format error", () => {
    const error = new PipelineInvalidUsernameError(
      '"-bad-username" is not a valid GitHub username.'
    );
    render(<ProfileErrorState error={error} username="-bad-username" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Invalid GitHub Username")).toBeInTheDocument();
    expect(screen.getByText("Validation Error")).toBeInTheDocument();
    expect(
      screen.getByText(
        /"-bad-username" does not match GitHub's username constraints/i
      )
    ).toBeInTheDocument();
  });

  it("renders general API error cleanly", () => {
    const error = new PipelineApiError("Internal GitHub connection error.");
    render(<ProfileErrorState error={error} username="testuser" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Analysis Failed")).toBeInTheDocument();
    expect(screen.getByText("API_ERROR")).toBeInTheDocument();
    expect(
      screen.getByText("Internal GitHub connection error.")
    ).toBeInTheDocument();
  });
});
