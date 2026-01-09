import { AdoClient } from "../../../../src/ado-client";
import {
  createMockTestApi,
  createMockAdoClientFull,
  mockTestRun,
  mockTestResult,
} from "../../../mocks/api-fixtures";

// Import all test plan tools
import { handleTestPlanTool } from "../../../../src/tools/test-plans/index";

describe("Test Plan Tools", () => {
  let mockTestApi: ReturnType<typeof createMockTestApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockTestApi = createMockTestApi();
    mockClient = createMockAdoClientFull({ testApi: mockTestApi });
  });

  // Note: Most test plan operations return REST API guidance as the SDK doesn't fully support them
  describe("listTestPlans", () => {
    it("should return REST API guidance", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_plans", {});

      expect(result).toHaveProperty("message");
      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("testplan/plans");
    });

    it("should include project in response", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_plans", {
        project: "CustomProject",
      });

      expect((result as any).project).toBe("CustomProject");
    });
  });

  describe("getTestPlan", () => {
    it("should return REST API guidance", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "get_test_plan", {
        planId: 1,
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).planId).toBe(1);
    });

    it("should validate required parameters", async () => {
      await expect(
        handleTestPlanTool(mockClient as unknown as AdoClient, "get_test_plan", {})
      ).rejects.toThrow();
    });
  });

  describe("listTestSuites", () => {
    it("should return REST API guidance", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_suites", {
        planId: 1,
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("suites");
    });
  });

  describe("getTestSuite", () => {
    it("should return REST API guidance", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "get_test_suite", {
        planId: 1,
        suiteId: 1,
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).suiteId).toBe(1);
    });
  });

  describe("listTestCases", () => {
    it("should return REST API guidance", async () => {
      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_cases", {
        planId: 1,
        suiteId: 1,
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("TestCase");
    });
  });

  // These tools use SDK methods that exist
  describe("getTestResults", () => {
    it("should get test results for a run", async () => {
      mockTestApi.getTestResults.mockResolvedValue([mockTestResult]);

      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "get_test_results", {
        runId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].testCaseTitle).toBe("Test Case 1");
      expect((result as any[])[0].outcome).toBe("Passed");
    });

    it("should return empty array when no results", async () => {
      mockTestApi.getTestResults.mockResolvedValue([]);

      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "get_test_results", {
        runId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe("listTestRuns", () => {
    it("should list test runs", async () => {
      mockTestApi.getTestRuns.mockResolvedValue([mockTestRun]);

      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_runs", {});

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].id).toBe(1);
      expect((result as any[])[0].name).toBe("Test Run 1");
      expect((result as any[])[0].totalTests).toBe(10);
      expect((result as any[])[0].passedTests).toBe(8);
    });

    it("should respect maxResults limit", async () => {
      const manyRuns = Array.from({ length: 100 }, (_, i) => ({
        ...mockTestRun,
        id: i + 1,
        name: `Test Run ${i + 1}`,
      }));
      mockTestApi.getTestRuns.mockResolvedValue(manyRuns);

      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_runs", {
        maxResults: 10,
      });

      expect((result as any[]).length).toBe(10);
    });

    it("should return empty array when no runs found", async () => {
      mockTestApi.getTestRuns.mockResolvedValue([]);

      const result = await handleTestPlanTool(mockClient as unknown as AdoClient, "list_test_runs", {});

      expect(result).toEqual([]);
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleTestPlanTool(mockClient as unknown as AdoClient, "unknown_tool", {})
      ).rejects.toThrow("Unknown test plan tool");
    });
  });
});
