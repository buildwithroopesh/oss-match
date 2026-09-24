import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UsernameForm } from "@/components/profile/UsernameForm";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("UsernameForm Component", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders with input, prefix, and submit button", () => {
    render(<UsernameForm />);
    expect(screen.getByLabelText("GitHub username")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Analyze GitHub profile" })
    ).toBeInTheDocument();
  });

  it("displays validation error for empty submission", () => {
    render(<UsernameForm />);
    const button = screen.getByRole("button", { name: "Analyze GitHub profile" });
    fireEvent.click(button);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a GitHub username.");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("displays error for invalid username characters", () => {
    render(<UsernameForm />);
    const input = screen.getByLabelText("GitHub username");
    fireEvent.change(input, { target: { value: "-invalid-start" } });
    const button = screen.getByRole("button", { name: "Analyze GitHub profile" });
    fireEvent.click(button);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid GitHub username");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("displays error when username exceeds 39 characters", () => {
    render(<UsernameForm />);
    const input = screen.getByLabelText("GitHub username");
    fireEvent.change(input, { target: { value: "a".repeat(40) } });
    const button = screen.getByRole("button", { name: "Analyze GitHub profile" });
    fireEvent.click(button);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "GitHub usernames are 39 characters or fewer."
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("successfully navigates on valid username submission", () => {
    const onSubmit = vi.fn();
    render(<UsernameForm onSubmit={onSubmit} />);
    const input = screen.getByLabelText("GitHub username");
    fireEvent.change(input, { target: { value: "torvalds" } });
    const button = screen.getByRole("button", { name: "Analyze GitHub profile" });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith("torvalds");
    expect(pushMock).toHaveBeenCalledWith("/profile/torvalds");
  });

  it("renders and triggers quick demo example buttons when showExamples is true", () => {
    const onSubmit = vi.fn();
    render(<UsernameForm showExamples={true} onSubmit={onSubmit} />);

    expect(screen.getByText("Try an example:")).toBeInTheDocument();
    const exampleButton = screen.getByRole("button", {
      name: "Analyze example user @torvalds",
    });
    expect(exampleButton).toBeInTheDocument();

    fireEvent.click(exampleButton);
    expect(onSubmit).toHaveBeenCalledWith("torvalds");
    expect(pushMock).toHaveBeenCalledWith("/profile/torvalds");
  });
});
