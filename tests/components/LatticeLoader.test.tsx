import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LatticeLoader from "@/components/ui/LatticeLoader";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";

describe("LatticeLoader Component", () => {
  it("renders with role status and accessible screen-reader announcement", () => {
    render(
      <LatticeLoader
        label="Analyzing GitHub profile"
        doneLabel="Done in"
        errorLabel="Failed after"
        status="working"
        pattern="orbit"
        grid={3}
        shape="round"
        color="#A5ABB3"
        doneColor="#5CE1C6"
        errorColor="#F06A6A"
        glow={false}
        showTimer
      />
    );

    const loader = screen.getByRole("status");
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute("data-status", "working");
    expect(loader).toHaveAttribute("data-shape", "round");
    expect(screen.getByText("Analyzing GitHub profile, in progress")).toBeInTheDocument();
    expect(screen.getByText("Analyzing GitHub profile")).toBeInTheDocument();
  });

  it("renders recommendations loading label with timer", () => {
    render(
      <LatticeLoader
        label="Finding matching issues"
        doneLabel="Done in"
        errorLabel="Failed after"
        status="working"
        pattern="orbit"
        grid={3}
        shape="round"
        color="#A5ABB3"
        doneColor="#5CE1C6"
        errorColor="#F06A6A"
        glow={false}
        showTimer
      />
    );

    expect(screen.getByText("Finding matching issues, in progress")).toBeInTheDocument();
    expect(screen.getByText("Finding matching issues")).toBeInTheDocument();
    expect(screen.getByText("0.0s")).toBeInTheDocument();
  });

  it("renders done status and doneLabel", () => {
    render(
      <LatticeLoader
        label="Finding matching issues"
        doneLabel="Done in"
        status="done"
        elapsed={1.5}
        showTimer
      />
    );

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("data-status", "done");
    expect(screen.getByText("Done in")).toBeInTheDocument();
    expect(screen.getByText("1.5s")).toBeInTheDocument();
    expect(screen.getByText("Done in 1.5 seconds")).toBeInTheDocument();
  });
});

describe("ProfileSkeleton with LatticeLoader", () => {
  it("renders both profile analysis and recommendations loading indicators in skeleton", () => {
    render(<ProfileSkeleton />);

    // Both indicators should be present with role status
    expect(screen.getByText("Analyzing GitHub profile, in progress")).toBeInTheDocument();
    expect(screen.getByText("Finding matching issues, in progress")).toBeInTheDocument();
  });
});
