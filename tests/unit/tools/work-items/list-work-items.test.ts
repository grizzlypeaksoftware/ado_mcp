import { listWorkItems } from "../../../../src/tools/work-items/list-work-items";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWitApi,
  createMockAdoClient,
  mockWorkItemQueryResult,
  mockWorkItemsList,
} from "../../../mocks/work-item-fixtures";

describe("listWorkItems", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("happy path", () => {
    it("should return work items matching WIQL query", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const result = await listWorkItems(mockClient as unknown as AdoClient, {
        query: "SELECT [System.Id] FROM WorkItems WHERE [System.State] = 'Active'",
        project: "TestProject",
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 123,
        title: "Bug 1",
        state: "Active",
        type: "Bug",
        assignedTo: "User 1",
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
      });
      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.any(String) },
        { project: "TestProject" }
      );
    });

    it("should use default project when not specified", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      await listWorkItems(mockClient as unknown as AdoClient, {
        query: "SELECT [System.Id] FROM WorkItems",
      });

      expect(mockClient.resolveProject).toHaveBeenCalledWith(undefined);
    });

    it("should return empty array when no work items match", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const result = await listWorkItems(mockClient as unknown as AdoClient, {
        query: "SELECT [System.Id] FROM WorkItems WHERE 1=0",
      });

      expect(result).toEqual([]);
      expect(mockWitApi.getWorkItems).not.toHaveBeenCalled();
    });
  });

  describe("parameter validation", () => {
    it("should throw error when query is missing", async () => {
      await expect(
        listWorkItems(mockClient as unknown as AdoClient, {} as { query: string })
      ).rejects.toThrow();
    });

    it("should throw error when query is empty string", async () => {
      await expect(
        listWorkItems(mockClient as unknown as AdoClient, { query: "" })
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      await expect(
        listWorkItems(mockClient as unknown as AdoClient, {
          query: "SELECT [System.Id] FROM WorkItems",
        })
      ).rejects.toThrow("API Error");
    });

    it("should handle null workItems response", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: null });

      const result = await listWorkItems(mockClient as unknown as AdoClient, {
        query: "SELECT [System.Id] FROM WorkItems",
      });

      expect(result).toEqual([]);
    });
  });

  describe("pagination", () => {
    it("should handle large result sets with batching", async () => {
      // Create 250 work items to test batching
      const manyWorkItems = Array.from({ length: 250 }, (_, i) => ({
        id: i + 1,
        url: `https://dev.azure.com/testorg/_apis/wit/workItems/${i + 1}`,
      }));

      mockWitApi.queryByWiql.mockResolvedValue({ workItems: manyWorkItems });
      mockWitApi.getWorkItems.mockImplementation((ids: number[]) => {
        return Promise.resolve(
          ids.map((id) => ({
            id,
            fields: {
              "System.Title": `Item ${id}`,
              "System.State": "Active",
              "System.WorkItemType": "Task",
            },
            url: `https://dev.azure.com/testorg/_apis/wit/workItems/${id}`,
          }))
        );
      });

      const result = await listWorkItems(mockClient as unknown as AdoClient, {
        query: "SELECT [System.Id] FROM WorkItems",
      });

      expect(result).toHaveLength(250);
      // Should batch into 2 calls (200 + 50)
      expect(mockWitApi.getWorkItems).toHaveBeenCalledTimes(2);
    });
  });
});
