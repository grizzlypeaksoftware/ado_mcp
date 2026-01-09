import { AdoClient } from "../../../../src/ado-client";
import { createMockTaskAgentApi, createMockAdoClientFull, mockVariableGroup } from "../../../mocks/api-fixtures";
import { handleVariableGroupTool } from "../../../../src/tools/variable-groups/index";

describe("Variable Group Tools", () => {
  let mockTaskAgentApi: ReturnType<typeof createMockTaskAgentApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockTaskAgentApi = createMockTaskAgentApi();
    mockClient = createMockAdoClientFull({ taskAgentApi: mockTaskAgentApi });
  });

  describe("listVariableGroups", () => {
    it("should list variable groups", async () => {
      mockTaskAgentApi.getVariableGroups.mockResolvedValue([mockVariableGroup]);

      const result = await handleVariableGroupTool(
        mockClient as unknown as AdoClient,
        "list_variable_groups",
        {}
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].id).toBe(1);
      expect((result as any[])[0].name).toBe("Test Variables");
      expect((result as any[])[0].variableCount).toBe(2);
    });

    it("should filter by name", async () => {
      mockTaskAgentApi.getVariableGroups.mockResolvedValue([mockVariableGroup]);

      await handleVariableGroupTool(
        mockClient as unknown as AdoClient,
        "list_variable_groups",
        { groupName: "Test" }
      );

      expect(mockTaskAgentApi.getVariableGroups).toHaveBeenCalledWith(
        "TestProject",
        "Test"
      );
    });

    it("should return empty array when no groups found", async () => {
      mockTaskAgentApi.getVariableGroups.mockResolvedValue([]);

      const result = await handleVariableGroupTool(
        mockClient as unknown as AdoClient,
        "list_variable_groups",
        {}
      );

      expect(result).toEqual([]);
    });
  });

  describe("getVariableGroup", () => {
    it("should get variable group details", async () => {
      mockTaskAgentApi.getVariableGroup.mockResolvedValue(mockVariableGroup);

      const result = await handleVariableGroupTool(
        mockClient as unknown as AdoClient,
        "get_variable_group",
        { groupId: 1 }
      );

      expect((result as any).id).toBe(1);
      expect((result as any).name).toBe("Test Variables");
      expect((result as any).variables.VAR1.value).toBe("value1");
      expect((result as any).variables.VAR1.isSecret).toBe(false);
    });

    it("should mask secret variables", async () => {
      mockTaskAgentApi.getVariableGroup.mockResolvedValue(mockVariableGroup);

      const result = await handleVariableGroupTool(
        mockClient as unknown as AdoClient,
        "get_variable_group",
        { groupId: 1 }
      );

      expect((result as any).variables.SECRET_VAR.value).toBe("***");
      expect((result as any).variables.SECRET_VAR.isSecret).toBe(true);
    });

    it("should throw error when group not found", async () => {
      mockTaskAgentApi.getVariableGroup.mockResolvedValue(null);

      await expect(
        handleVariableGroupTool(
          mockClient as unknown as AdoClient,
          "get_variable_group",
          { groupId: 999 }
        )
      ).rejects.toThrow("Variable group 999 not found");
    });

    it("should validate required parameters", async () => {
      await expect(
        handleVariableGroupTool(
          mockClient as unknown as AdoClient,
          "get_variable_group",
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleVariableGroupTool(
          mockClient as unknown as AdoClient,
          "unknown_tool",
          {}
        )
      ).rejects.toThrow("Unknown variable group tool");
    });
  });
});
