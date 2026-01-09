import { getLinkedWorkItems } from "../../../../src/tools/links/get-linked-work-items";
import { AdoClient } from "../../../../src/ado-client";
import { createMockWitApi, createMockAdoClientFull } from "../../../mocks/api-fixtures";

describe("getLinkedWorkItems", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({ witApi: mockWitApi });
  });

  describe("happy path", () => {
    it("should return linked work items", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "System.LinkTypes.Hierarchy-Forward",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/456",
            attributes: { name: "Child" },
          },
          {
            rel: "System.LinkTypes.Related",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/789",
            attributes: { name: "Related" },
          },
        ],
      });
      mockWitApi.getWorkItems.mockResolvedValue([
        { id: 456, fields: { "System.Title": "Child Item", "System.State": "Active", "System.WorkItemType": "Task" } },
        { id: 789, fields: { "System.Title": "Related Item", "System.State": "New", "System.WorkItemType": "Bug" } },
      ]);

      const result = await getLinkedWorkItems(mockClient as unknown as AdoClient, {
        id: 123,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(456);
      expect(result[0].linkType).toBe("child");
    });

    it("should return empty array when no relations exist", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: null,
      });

      const result = await getLinkedWorkItems(mockClient as unknown as AdoClient, {
        id: 123,
      });

      expect(result).toEqual([]);
    });

    it("should filter by link type when specified", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "System.LinkTypes.Hierarchy-Forward",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/456",
            attributes: { name: "Child" },
          },
          {
            rel: "System.LinkTypes.Related",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/789",
            attributes: { name: "Related" },
          },
        ],
      });
      mockWitApi.getWorkItems.mockResolvedValue([
        { id: 456, fields: { "System.Title": "Child Item", "System.State": "Active", "System.WorkItemType": "Task" } },
      ]);

      const result = await getLinkedWorkItems(mockClient as unknown as AdoClient, {
        id: 123,
        linkType: "child",
      });

      expect(result).toHaveLength(1);
      expect(result[0].linkType).toBe("child");
    });
  });

  describe("parameter validation", () => {
    it("should throw error when id is missing", async () => {
      await expect(
        getLinkedWorkItems(mockClient as unknown as AdoClient, {} as any)
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockWitApi.getWorkItem.mockRejectedValue(new Error("Work item not found"));

      await expect(
        getLinkedWorkItems(mockClient as unknown as AdoClient, { id: 999 })
      ).rejects.toThrow("Work item not found");
    });
  });
});
