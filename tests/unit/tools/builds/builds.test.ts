import { listBuildDefinitions } from "../../../../src/tools/builds/list-build-definitions";
import { listBuilds } from "../../../../src/tools/builds/list-builds";
import { getBuild } from "../../../../src/tools/builds/get-build";
import { queueBuild } from "../../../../src/tools/builds/queue-build";
import { cancelBuild } from "../../../../src/tools/builds/cancel-build";
import { getBuildLogs } from "../../../../src/tools/builds/get-build-logs";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockBuildApi,
  createMockAdoClientFull,
  mockBuildDefinition,
  mockBuild,
  mockBuildLog,
} from "../../../mocks/api-fixtures";

describe("Build Tools", () => {
  let mockBuildApi: ReturnType<typeof createMockBuildApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockBuildApi = createMockBuildApi();
    mockClient = createMockAdoClientFull({ buildApi: mockBuildApi });
  });

  describe("listBuildDefinitions", () => {
    it("should list build definitions", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([mockBuildDefinition]);

      const result = await listBuildDefinitions(mockClient as unknown as AdoClient, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("Test Pipeline");
    });

    it("should filter by path", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([mockBuildDefinition]);

      await listBuildDefinitions(mockClient as unknown as AdoClient, {
        path: "\\MyFolder",
      });

      expect(mockBuildApi.getDefinitions).toHaveBeenCalled();
    });

    it("should return empty array when no definitions found", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([]);

      const result = await listBuildDefinitions(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("listBuilds", () => {
    it("should list builds", async () => {
      mockBuildApi.getBuilds.mockResolvedValue([mockBuild]);

      const result = await listBuilds(mockClient as unknown as AdoClient, {} as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(100);
      expect(result[0].buildNumber).toBe("20240101.1");
    });

    it("should filter by definition", async () => {
      mockBuildApi.getBuilds.mockResolvedValue([mockBuild]);

      await listBuilds(mockClient as unknown as AdoClient, {
        definitionId: 1,
      } as any);

      expect(mockBuildApi.getBuilds).toHaveBeenCalled();
    });

    it("should filter by status", async () => {
      mockBuildApi.getBuilds.mockResolvedValue([mockBuild]);

      await listBuilds(mockClient as unknown as AdoClient, {
        status: "completed",
      } as any);

      expect(mockBuildApi.getBuilds).toHaveBeenCalled();
    });
  });

  describe("getBuild", () => {
    it("should get build details", async () => {
      mockBuildApi.getBuild.mockResolvedValue(mockBuild);

      const result = await getBuild(mockClient as unknown as AdoClient, {
        buildId: 100,
      });

      expect(result.id).toBe(100);
      expect(result.buildNumber).toBe("20240101.1");
      expect(result.status).toBe("completed");
      expect(result.result).toBe("succeeded");
    });

    it("should throw error when build not found", async () => {
      mockBuildApi.getBuild.mockResolvedValue(null);

      await expect(
        getBuild(mockClient as unknown as AdoClient, { buildId: 999 })
      ).rejects.toThrow("Build 999 not found");
    });
  });

  describe("queueBuild", () => {
    it("should queue a new build", async () => {
      mockBuildApi.queueBuild.mockResolvedValue({
        ...mockBuild,
        id: 101,
        buildNumber: "20240101.2",
      });

      const result = await queueBuild(mockClient as unknown as AdoClient, {
        definitionId: 1,
      });

      expect(result.id).toBe(101);
      expect(result.message).toContain("Successfully queued");
    });

    it("should queue on specific branch", async () => {
      mockBuildApi.queueBuild.mockResolvedValue(mockBuild);

      await queueBuild(mockClient as unknown as AdoClient, {
        definitionId: 1,
        branch: "feature",
      });

      const buildArg = mockBuildApi.queueBuild.mock.calls[0][0];
      expect(buildArg.sourceBranch).toBe("refs/heads/feature");
    });

    it("should throw error when queue fails", async () => {
      mockBuildApi.queueBuild.mockResolvedValue(null);

      await expect(
        queueBuild(mockClient as unknown as AdoClient, { definitionId: 1 })
      ).rejects.toThrow("Failed to queue build");
    });
  });

  describe("cancelBuild", () => {
    it("should cancel a running build", async () => {
      mockBuildApi.updateBuild.mockResolvedValue({
        ...mockBuild,
        status: 4, // cancelling
      });

      const result = await cancelBuild(mockClient as unknown as AdoClient, {
        buildId: 100,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("cancellation");
    });

    it("should handle API errors", async () => {
      mockBuildApi.updateBuild.mockRejectedValue(new Error("API Error"));

      await expect(
        cancelBuild(mockClient as unknown as AdoClient, { buildId: 100 })
      ).rejects.toThrow("API Error");
    });
  });

  describe("getBuildLogs", () => {
    it("should get build logs", async () => {
      mockBuildApi.getBuildLogs.mockResolvedValue([mockBuildLog]);
      mockBuildApi.getBuildLogLines.mockResolvedValue(["Log content line 1", "Log content line 2"]);

      const result = await getBuildLogs(mockClient as unknown as AdoClient, {
        buildId: 100,
      });

      expect(result.buildId).toBe(100);
      expect(result.content).toContain("Log content line 1");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should get specific log by ID", async () => {
      mockBuildApi.getBuildLogLines.mockResolvedValue(["Specific log content"]);

      const result = await getBuildLogs(mockClient as unknown as AdoClient, {
        buildId: 100,
        logId: 1,
      });

      expect(result.logId).toBe(1);
      expect(result.content).toContain("Specific log content");
      expect(mockBuildApi.getBuildLogs).not.toHaveBeenCalled();
    });
  });
});
