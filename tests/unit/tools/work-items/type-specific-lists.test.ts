import { listEpics, listEpicsSchema } from "../../../../src/tools/work-items/list-epics";
import { listFeatures, listFeaturesSchema } from "../../../../src/tools/work-items/list-features";
import { listUserStories, listUserStoriesSchema } from "../../../../src/tools/work-items/list-user-stories";
import { listBugs, listBugsSchema } from "../../../../src/tools/work-items/list-bugs";
import { listTasks, listTasksSchema } from "../../../../src/tools/work-items/list-tasks";
import { AdoClient } from "../../../../src/ado-client";
import { z } from "zod";
import {
  createMockWitApi,
  createMockAdoClient,
  mockWorkItemQueryResult,
} from "../../../mocks/work-item-fixtures";

// Define input types using z.input for proper optional handling
type ListEpicsInput = z.input<typeof listEpicsSchema>;
type ListFeaturesInput = z.input<typeof listFeaturesSchema>;
type ListUserStoriesInput = z.input<typeof listUserStoriesSchema>;
type ListBugsInput = z.input<typeof listBugsSchema>;
type ListTasksInput = z.input<typeof listTasksSchema>;

describe("Type-Specific Work Item List Tools", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  const mockEpicsList = [
    {
      id: 1,
      fields: {
        "System.Title": "Epic 1",
        "System.State": "Active",
        "System.WorkItemType": "Epic",
        "System.AssignedTo": { displayName: "User 1" },
      },
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/1",
    },
  ];

  const mockFeaturesList = [
    {
      id: 2,
      fields: {
        "System.Title": "Feature 1",
        "System.State": "Active",
        "System.WorkItemType": "Feature",
        "System.AssignedTo": { displayName: "User 1" },
      },
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/2",
    },
  ];

  const mockUserStoriesList = [
    {
      id: 3,
      fields: {
        "System.Title": "User Story 1",
        "System.State": "Active",
        "System.WorkItemType": "User Story",
        "System.AssignedTo": { displayName: "User 1" },
      },
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/3",
    },
  ];

  const mockBugsList = [
    {
      id: 4,
      fields: {
        "System.Title": "Bug 1",
        "System.State": "Active",
        "System.WorkItemType": "Bug",
        "System.AssignedTo": { displayName: "User 1" },
      },
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/4",
    },
  ];

  const mockTasksList = [
    {
      id: 5,
      fields: {
        "System.Title": "Task 1",
        "System.State": "Active",
        "System.WorkItemType": "Task",
        "System.AssignedTo": { displayName: "User 1" },
      },
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/5",
    },
  ];

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("listEpics", () => {
    it("should query for Epic work item type", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockEpicsList);

      const params: ListEpicsInput = {};
      await listEpics(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('Epic')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should use default states (excluding Removed)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockEpicsList);

      const params: ListEpicsInput = {};
      await listEpics(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringContaining(
            "[System.State] IN ('New', 'Active', 'Resolved', 'Closed')"
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should allow custom states filter", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockEpicsList);

      const params: ListEpicsInput = { states: ["Active"] };
      await listEpics(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.State] IN ('Active')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should pass through optional filters", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockEpicsList);

      const params: ListEpicsInput = {
        assignedTo: "user@example.com",
        areaPath: "Project\\Area1",
        iterationPath: "Project\\Sprint1",
        tags: ["important"],
      };
      await listEpics(mockClient as unknown as AdoClient, params);

      const calledQuery = mockWitApi.queryByWiql.mock.calls[0][0].query;
      expect(calledQuery).toContain("[System.AssignedTo] CONTAINS 'user@example.com'");
      expect(calledQuery).toContain("[System.AreaPath] UNDER 'Project\\Area1'");
      expect(calledQuery).toContain("[System.IterationPath] UNDER 'Project\\Sprint1'");
      expect(calledQuery).toContain("[System.Tags] CONTAINS 'important'");
    });

    it("should return empty array when no epics found", async () => {
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const params: ListEpicsInput = {};
      const result = await listEpics(mockClient as unknown as AdoClient, params);

      expect(result).toEqual([]);
    });
  });

  describe("listFeatures", () => {
    it("should query for Feature work item type", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockFeaturesList);

      const params: ListFeaturesInput = {};
      await listFeatures(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('Feature')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should use default states (excluding Removed)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockFeaturesList);

      const params: ListFeaturesInput = {};
      await listFeatures(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringContaining(
            "[System.State] IN ('New', 'Active', 'Resolved', 'Closed')"
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should allow custom states filter", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockFeaturesList);

      const params: ListFeaturesInput = { states: ["New", "Active"] };
      await listFeatures(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.State] IN ('New', 'Active')") },
        expect.anything(),
        undefined,
        200
      );
    });
  });

  describe("listUserStories", () => {
    it("should query for User Story work item type", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockUserStoriesList);

      const params: ListUserStoriesInput = {};
      await listUserStories(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('User Story')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should use default states (excluding Removed)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockUserStoriesList);

      const params: ListUserStoriesInput = {};
      await listUserStories(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringContaining(
            "[System.State] IN ('New', 'Active', 'Resolved', 'Closed')"
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should pass through assignedTo filter", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockUserStoriesList);

      const params: ListUserStoriesInput = { assignedTo: "developer@example.com" };
      await listUserStories(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.AssignedTo] CONTAINS 'developer@example.com'") },
        expect.anything(),
        undefined,
        200
      );
    });
  });

  describe("listBugs", () => {
    it("should query for Bug work item type", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockBugsList);

      const params: ListBugsInput = {};
      await listBugs(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('Bug')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should use default states (excluding Removed)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockBugsList);

      const params: ListBugsInput = {};
      await listBugs(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        {
          query: expect.stringContaining(
            "[System.State] IN ('New', 'Active', 'Resolved', 'Closed')"
          ),
        },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should allow filtering active bugs only", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockBugsList);

      const params: ListBugsInput = { states: ["Active"] };
      await listBugs(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.State] IN ('Active')") },
        expect.anything(),
        undefined,
        200
      );
    });
  });

  describe("listTasks", () => {
    it("should query for Task work item type", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockTasksList);

      const params: ListTasksInput = {};
      await listTasks(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.WorkItemType] IN ('Task')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should use default states for tasks (New, Active, Closed)", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockTasksList);

      const params: ListTasksInput = {};
      await listTasks(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.State] IN ('New', 'Active', 'Closed')") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should allow filtering by iteration", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockTasksList);

      const params: ListTasksInput = { iterationPath: "Project\\Sprint 5" };
      await listTasks(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: expect.stringContaining("[System.IterationPath] UNDER 'Project\\Sprint 5'") },
        expect.anything(),
        undefined,
        200
      );
    });

    it("should allow custom maxResults", async () => {
      mockWitApi.queryByWiql.mockResolvedValue(mockWorkItemQueryResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockTasksList);

      const params: ListTasksInput = { maxResults: 25 };
      await listTasks(mockClient as unknown as AdoClient, params);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        undefined,
        25
      );
    });
  });

  describe("error handling", () => {
    it("should propagate API errors from listEpics", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: ListEpicsInput = {};
      await expect(listEpics(mockClient as unknown as AdoClient, params)).rejects.toThrow("API Error");
    });

    it("should propagate API errors from listFeatures", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: ListFeaturesInput = {};
      await expect(listFeatures(mockClient as unknown as AdoClient, params)).rejects.toThrow(
        "API Error"
      );
    });

    it("should propagate API errors from listUserStories", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: ListUserStoriesInput = {};
      await expect(listUserStories(mockClient as unknown as AdoClient, params)).rejects.toThrow(
        "API Error"
      );
    });

    it("should propagate API errors from listBugs", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: ListBugsInput = {};
      await expect(listBugs(mockClient as unknown as AdoClient, params)).rejects.toThrow("API Error");
    });

    it("should propagate API errors from listTasks", async () => {
      mockWitApi.queryByWiql.mockRejectedValue(new Error("API Error"));

      const params: ListTasksInput = {};
      await expect(listTasks(mockClient as unknown as AdoClient, params)).rejects.toThrow("API Error");
    });
  });
});
