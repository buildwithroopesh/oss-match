import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("LandingPage", () => {
  it("renders hero headline, tagline, and honest framing", () => {
    render(<LandingPage />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Find open-source issues");
    expect(h1.textContent).toContain("that match your experience");

    expect(
      screen.getByText(/OSS Match analyzes your public GitHub repositories/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "How It Works" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "What OSS Match is — and is not" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Ready to analyze your repository footprint?",
      })
    ).toBeInTheDocument();
  });

  it("renders honest disclaimer regarding skill level", () => {
    render(<LandingPage />);
    const notes = screen.getAllByText(
      /Percentages represent proportion of analyzed code by byte count, not skill level/i
    );
    expect(notes.length).toBeGreaterThan(0);
  });

  it("renders quick example demo handles for convenience", () => {
    render(<LandingPage />);
    const exampleButtons = screen.getAllByRole("button", {
      name: /Analyze example user @torvalds/i,
    });
    expect(exampleButtons.length).toBeGreaterThan(0);
  });
});
