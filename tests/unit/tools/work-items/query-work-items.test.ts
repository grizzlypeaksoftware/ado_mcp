import { queryWorkItems, queryWorkItemsSchema } from "../../../../src/tools/work-items/query-work-items";
import { AdoClient } from "../../../../src/ado-client";
import { z } from "zod";
import {
  createMockWitApi,
  createMockAdoClient,
  mockWorkItemQueryResult,
  mockWorkItemsList,
} from "../../../mocks/work-item-fixtures";

// Use z.input to get the input type (where defaults make fields optional)
type QueryWorkItemsInput = z.input<typeof queryWorkItemsSchema>;

describe("queryWorkItems", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("happy path", () => {
    it("should return work items with no filters (project only)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { project: "TestProject" };
      const result = await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(result).toHaveLength(2);
      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.TeamProject] = 'TestProject'") },
        { project: "TestProject" },
        undefined,
        200
      );
    });

    it("should filter by work item types", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { workItemTypes: ["Bug", "Task"] };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('Bug', 'Task')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should filter by states", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { states: ["Active", "New"] };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.State] IN ('Active', 'New')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should filter by assignee", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { assignedTo: "testuser@example.com" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.AssignedTo] CONTAINS 'testuser@example.com'") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should filter by area path", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { areaPath: "TestProject\\Area1" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.AreaPath] UNDER 'TestProject\\Area1'") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should filter by iteration path", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { iterationPath: "TestProject\\Sprint1" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.IterationPath] UNDER 'TestProject\\Sprint1'") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should filter by tags", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { tags: ["important", "urgent"] };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringMatching(
            /\[System\.Tags\] CONTAINS 'important'.*\[System\.Tags\] CONTAINS 'urgent'/
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should include optional search text", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { searchText: "login bug" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringContaining(
            "([System.Title] CONTAINS 'login bug' OR [System.Description] CONTAINS 'login bug')"
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should combine multiple filters", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = {
        workItemTypes: ["Bug"],
        states: ["Active"],
        assignedTo: "user@example.com",
      };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      const calledQuery = mockWitApi.queryByWiql.mock.calls[0][0].query;
      expect(calledQuery).toContain("[System.WorkItemType] IN ('Bug')");
      expect(calledQuery).toContain("[System.State] IN ('Active')");
      expect(calledQuery).toContain("[System.AssignedTo] CONTAINS 'user@example.com'");
    });

    it("should respect maxResults parameter", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = { maxResults: 50 };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        undefined,
        50
      );
    });

    it("should return empty array when no work items match", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const params: QueryWorkItemsInput = { workItemTypes: ["Epic"] };
      const result = await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(result).toEqual([]);
      expect(mockWitApi.getWorkItems).not.toHaveBeenCalled();
    });

    it("should use default project when not specified", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItemsList);

      const params: QueryWorkItemsInput = {};
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockClient.resolveProject).toHaveBeenCalledWith(undefined);
    });
  });

  describe("SQL injection prevention", () => {
    it("should escape single quotes in search text", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const params: QueryWorkItemsInput = { searchText: "test's value" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("test''s value") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should escape single quotes in assignee", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const params: QueryWorkItemsInput = { assignedTo: "O'Brien" };
      await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("O''Brien") },
        expect.anything(),
        undefined,
        200
      );
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: QueryWorkItemsInput = {};
      await expect(
        queryWorkItems(mockClient as unknown as AdoClient, params)
      ).rejects.toThrow("API Error");
    });

    it("should handle null workItems response", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: null });

      const params: QueryWorkItemsInput = {};
      const result = await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(result).toEqual([]);
    });
  });

  describe("pagination", () => {
    it("should handle large result sets with batching", async () => {
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

      const params: QueryWorkItemsInput = { maxResults: 250 };
      const result = await queryWorkItems(mockClient as unknown as AdoClient, params);

      expect(result).toHaveLength(250);
      expect(mockWitApi.getWorkItems).toHaveBeenCalledTimes(2);
    });
  });
});
