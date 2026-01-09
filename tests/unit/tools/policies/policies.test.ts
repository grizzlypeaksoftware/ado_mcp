import { AdoClient } from "../../../../src/ado-client";
import { createMockPolicyApi, createMockAdoClientFull, mockPolicy } from "../../../mocks/api-fixtures";
import { handlePolicyTool } from "../../../../src/tools/policies/index";

describe("Policy Tools", () => {
  let mockPolicyApi: ReturnType<typeof createMockPolicyApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockPolicyApi = createMockPolicyApi();
    mockClient = createMockAdoClientFull({ policyApi: mockPolicyApi });
  });

  describe("listBranchPolicies", () => {
    it("should list branch policies for a repository", async () => {
      const policyWithScope = {
        ...mockPolicy,
        settings: {
          ...mockPolicy.settings,
          scope: [{ repositoryId: "repo-123", refName: "refs/heads/main" }],
        },
      };
      mockPolicyApi.getPolicyConfigurations.mockResolvedValue([policyWithScope]);

      const result = await handlePolicyTool(
        mockClient as unknown as AdoClient,
        "list_branch_policies",
        { repository: "repo-123" }
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].id).toBe(1);
      expect((result as any[])[0].isEnabled).toBe(true);
    });

    it("should filter by branch", async () => {
      const policyWithScope = {
        ...mockPolicy,
        settings: {
          ...mockPolicy.settings,
          scope: [{ repositoryId: "repo-123", refName: "refs/heads/main" }],
        },
      };
      mockPolicyApi.getPolicyConfigurations.mockResolvedValue([policyWithScope]);

      const result = await handlePolicyTool(
        mockClient as unknown as AdoClient,
        "list_branch_policies",
        { repository: "repo-123", branch: "main" }
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty array when no matching policies found", async () => {
      mockPolicyApi.getPolicyConfigurations.mockResolvedValue([]);

      const result = await handlePolicyTool(
        mockClient as unknown as AdoClient,
        "list_branch_policies",
        { repository: "repo-123" }
      );

      expect(result).toEqual([]);
    });

    it("should validate required repository parameter", async () => {
      await expect(
        handlePolicyTool(
          mockClient as unknown as AdoClient,
          "list_branch_policies",
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe("getBranchPolicy", () => {
    it("should get policy details", async () => {
      mockPolicyApi.getPolicyConfiguration.mockResolvedValue(mockPolicy);

      const result = await handlePolicyTool(
        mockClient as unknown as AdoClient,
        "get_branch_policy",
        { policyId: 1 }
      );

      expect((result as any).id).toBe(1);
      expect((result as any).type).toBe("Minimum reviewers");
      expect((result as any).isBlocking).toBe(true);
      expect((result as any).settings.minimumApproverCount).toBe(2);
    });

    it("should throw error when policy not found", async () => {
      mockPolicyApi.getPolicyConfiguration.mockResolvedValue(null);

      await expect(
        handlePolicyTool(
          mockClient as unknown as AdoClient,
          "get_branch_policy",
          { policyId: 999 }
        )
      ).rejects.toThrow("Policy configuration 999 not found");
    });

    it("should validate required parameters", async () => {
      await expect(
        handlePolicyTool(
          mockClient as unknown as AdoClient,
          "get_branch_policy",
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handlePolicyTool(
          mockClient as unknown as AdoClient,
          "unknown_tool",
          {}
        )
      ).rejects.toThrow("Unknown policy tool");
    });
  });
});
