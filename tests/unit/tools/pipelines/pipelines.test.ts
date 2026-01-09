import { listPipelines } from "../../../../src/tools/pipelines/list-pipelines";
import { getPipeline } from "../../../../src/tools/pipelines/get-pipeline";
import { listPipelineRuns } from "../../../../src/tools/pipelines/list-pipeline-runs";
import { getPipelineRun } from "../../../../src/tools/pipelines/get-pipeline-run";
import { runPipeline } from "../../../../src/tools/pipelines/run-pipeline";
import { cancelPipelineRun } from "../../../../src/tools/pipelines/cancel-pipeline-run";
import { getPipelineLogs } from "../../../../src/tools/pipelines/get-pipeline-logs";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockBuildApi,
  createMockAdoClientFull,
  mockBuildDefinition,
  mockBuild,
  mockBuildLog,
} from "../../../mocks/api-fixtures";

describe("Pipeline Tools", () => {
  let mockBuildApi: ReturnType<typeof createMockBuildApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockBuildApi = createMockBuildApi();
    mockClient = createMockAdoClientFull({ buildApi: mockBuildApi });
  });

  describe("listPipelines", () => {
    it("should list YAML pipelines", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([mockBuildDefinition]);

      const result = await listPipelines(mockClient as unknown as AdoClient, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("Test Pipeline");
    });

    it("should filter by folder", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([mockBuildDefinition]);

      await listPipelines(mockClient as unknown as AdoClient, {
        folder: "\\MyFolder",
      });

      expect(mockBuildApi.getDefinitions).toHaveBeenCalled();
    });

    it("should return empty array when no pipelines found", async () => {
      mockBuildApi.getDefinitions.mockResolvedValue([]);

      const result = await listPipelines(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("getPipeline", () => {
    it("should get pipeline details", async () => {
      mockBuildApi.getDefinition.mockResolvedValue(mockBuildDefinition);

      const result = await getPipeline(mockClient as unknown as AdoClient, {
        pipelineId: 1,
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Test Pipeline");
      expect(result.yamlFilename).toBe("azure-pipelines.yml");
    });

    it("should throw error when pipeline not found", async () => {
      mockBuildApi.getDefinition.mockResolvedValue(null);

      await expect(
        getPipeline(mockClient as unknown as AdoClient, { pipelineId: 999 })
      ).rejects.toThrow("Pipeline 999 not found");
    });
  });

  describe("listPipelineRuns", () => {
    it("should list pipeline runs", async () => {
      mockBuildApi.getBuilds.mockResolvedValue([mockBuild]);

      const result = await listPipelineRuns(mockClient as unknown as AdoClient, { maxResults: 50,
        pipelineId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(100);
      expect(result[0].buildNumber).toBe("20240101.1");
    });

    it("should filter by branch", async () => {
      mockBuildApi.getBuilds.mockResolvedValue([mockBuild]);

      await listPipelineRuns(mockClient as unknown as AdoClient, { maxResults: 50,
        pipelineId: 1,
        branch: "feature",
      });

      expect(mockBuildApi.getBuilds).toHaveBeenCalledWith(
        "TestProject",
        [1],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        expect.any(Number),
        undefined,
        undefined,
        undefined,
        undefined,
        "refs/heads/feature"
      );
    });
  });

  describe("getPipelineRun", () => {
    it("should get run details", async () => {
      mockBuildApi.getBuild.mockResolvedValue(mockBuild);
      mockBuildApi.getBuildTimeline.mockResolvedValue({ records: [] });

      const result = await getPipelineRun(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        runId: 100,
      } as any);

      expect(result.id).toBe(100);
      expect(result.status).toBe("completed");
      expect(result.result).toBe("succeeded");
    });

    it("should throw error when run not found", async () => {
      mockBuildApi.getBuild.mockResolvedValue(null);

      await expect(
        getPipelineRun(mockClient as unknown as AdoClient, { pipelineId: 1, runId: 999 } as any)
      ).rejects.toThrow("Pipeline run 999 not found");
    });
  });

  describe("runPipeline", () => {
    it("should trigger a new pipeline run", async () => {
      mockBuildApi.queueBuild.mockResolvedValue({
        ...mockBuild,
        id: 101,
        buildNumber: "20240101.2",
      });

      const result = await runPipeline(mockClient as unknown as AdoClient, {
        pipelineId: 1,
      });

      expect(result.id).toBe(101);
      expect(result.message).toContain("Successfully queued");
    });

    it("should run on specific branch", async () => {
      mockBuildApi.queueBuild.mockResolvedValue(mockBuild);

      await runPipeline(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        branch: "feature",
      });

      const buildArg = mockBuildApi.queueBuild.mock.calls[0][0];
      expect(buildArg.sourceBranch).toBe("refs/heads/feature");
    });

    it("should pass variables", async () => {
      mockBuildApi.queueBuild.mockResolvedValue(mockBuild);

      await runPipeline(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        variables: { VAR1: "value1" },
      });

      const buildArg = mockBuildApi.queueBuild.mock.calls[0][0];
      expect(buildArg.parameters).toContain("VAR1");
    });

    it("should throw error when queue fails", async () => {
      mockBuildApi.queueBuild.mockResolvedValue(null);

      await expect(
        runPipeline(mockClient as unknown as AdoClient, { pipelineId: 1 })
      ).rejects.toThrow("Failed to queue pipeline run");
    });
  });

  describe("cancelPipelineRun", () => {
    it("should cancel a running pipeline", async () => {
      mockBuildApi.updateBuild.mockResolvedValue({
        ...mockBuild,
        status: 4, // cancelling
      });

      const result = await cancelPipelineRun(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        runId: 100,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("cancellation");
    });
  });

  describe("getPipelineLogs", () => {
    it("should get pipeline logs", async () => {
      mockBuildApi.getBuildLogs.mockResolvedValue([mockBuildLog]);
      mockBuildApi.getBuildLogLines.mockResolvedValue(["Log content line 1", "Log content line 2"]);

      const result = await getPipelineLogs(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        runId: 100,
      });

      expect(result.runId).toBe(100);
      expect(result.content).toContain("Log content line 1");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should filter by log ID", async () => {
      mockBuildApi.getBuildLogLines.mockResolvedValue(["Specific log content"]);

      const result = await getPipelineLogs(mockClient as unknown as AdoClient, {
        pipelineId: 1,
        runId: 100,
        logId: 1,
      });

      expect(mockBuildApi.getBuildLogs).not.toHaveBeenCalled();
      expect(result.logId).toBe(1);
      expect(result.content).toContain("Specific log content");
    });
  });
});
