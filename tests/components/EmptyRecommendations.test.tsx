import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyRecommendationsState from "@/components/recommendations/EmptyRecommendationsState";
import PartialDiscoveryBanner from "@/components/recommendations/PartialDiscoveryBanner";

describe("EmptyRecommendationsState component", () => {
  it("renders honest zero-match state for no discovered issues", () => {
    render(<EmptyRecommendationsState reason="no_discovered" />);

    expect(
      screen.getByText("No open issues currently available")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No open issues matching your analyzed primary languages/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not reflect on your development experience/)
    ).toBeInTheDocument();
  });

  it("renders filter empty state with reset button", () => {
    const handleReset = vi.fn();
    render(
      <EmptyRecommendationsState
        reason="filter_empty"
        onResetFilters={handleReset}
      />
    );

    expect(
      screen.getByText("No issues match the selected filters")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Try selecting a different language or clearing active filters/)
    ).toBeInTheDocument();

    const resetButton = screen.getByRole("button", {
      name: "Clear active filters",
    });
    expect(resetButton).toBeInTheDocument();
    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});

describe("PartialDiscoveryBanner component", () => {
  it("returns null when warnings array is empty", () => {
    const { container } = render(<PartialDiscoveryBanner warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders warning message when warnings exist", () => {
    render(
      <PartialDiscoveryBanner
        warnings={["GitHub Search API rate limit was reached during discovery."]}
      />
    );

    expect(
      screen.getByText("Partial Issue Discovery Notice")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /GitHub Search API rate limit was reached during discovery. Displaying matches from candidate issues discovered before the limit was reached./
      )
    ).toBeInTheDocument();
  });
});
