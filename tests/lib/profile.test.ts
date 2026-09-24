import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfileAnalysis } from "@/lib/profile";
import * as pipelineModule from "@/core/pipeline";
import {
  PipelineUserNotFoundError,
  PipelineInvalidUsernameError,
} from "@/core/pipeline/errors";
import type { ProfileAnalysisResult } from "@/core/types/pipeline";

vi.mock("@/core/pipeline", () => ({
  analyzeProfile: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getGitHubClient: vi.fn(() => ({})),
}));

describe("getProfileAnalysis helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success state with data when analyzeProfile resolves", async () => {
    const mockResult = {
      user: { login: "testuser" },
      repositories: [],
      languageFootprint: { entries: [] },
      technologies: [],
      metadata: { status: "complete" },
    } as unknown as ProfileAnalysisResult;

    vi.mocked(pipelineModule.analyzeProfile).mockResolvedValueOnce(mockResult);

    const result = await getProfileAnalysis("testuser");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.user.login).toBe("testuser");
    }
  });

  it("captures PipelineError and returns error state without throwing", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockRejectedValueOnce(
      new PipelineUserNotFoundError("missing-user")
    );

    const result = await getProfileAnalysis("missing-user");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(PipelineUserNotFoundError);
      expect(result.error.code).toBe("USER_NOT_FOUND");
    }
  });

  it("captures unexpected error and wraps in PipelineApiError without throwing", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockRejectedValueOnce(
      new Error("Network timeout")
    );

    const result = await getProfileAnalysis("slow-user");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.code).toBe("API_ERROR");
      expect(result.error.message).toContain("Network timeout");
    }
  });

  it("captures PipelineInvalidUsernameError for invalid inputs", async () => {
    vi.mocked(pipelineModule.analyzeProfile).mockRejectedValueOnce(
      new PipelineInvalidUsernameError("Username empty")
    );

    const result = await getProfileAnalysis("");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(PipelineInvalidUsernameError);
    }
  });
});
