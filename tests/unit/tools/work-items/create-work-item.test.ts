import { createWorkItem } from "../../../../src/tools/work-items/create-work-item";
import { AdoClient } from "../../../../src/ado-client";
import { createMockWitApi, createMockAdoClient } from "../../../mocks/work-item-fixtures";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";

describe("createWorkItem", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("happy path", () => {
    it("should create a work item with required fields only", async () => {
      const createdItem = {
        id: 123,
        fields: {
          "System.Title": "New Bug",
          "System.WorkItemType": "Bug",
          "System.State": "New",
        },
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
      };
      mockWitApi.createWorkItem.mockResolvedValue(createdItem);

      const result = await createWorkItem(mockClient as unknown as AdoClient, {
        type: "Bug",
        title: "New Bug",
      });

      expect(result).toEqual({
        id: 123,
        title: "New Bug",
        type: "Bug",
        state: "New",
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            op: Operation.Add,
            path: "/fields/System.Title",
            value: "New Bug",
          }),
        ]),
        "TestProject",
        "Bug"
      );
    });

    it("should create a work item with all optional fields", async () => {
      const createdItem = {
        id: 124,
        fields: {
          "System.Title": "Full Bug",
          "System.WorkItemType": "Bug",
          "System.State": "New",
        },
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/124",
      };
      mockWitApi.createWorkItem.mockResolvedValue(createdItem);

      await createWorkItem(mockClient as unknown as AdoClient, {
        type: "Bug",
        title: "Full Bug",
        description: "Bug description",
        assignedTo: "user@example.com",
        areaPath: "TestProject\\Area",
        iterationPath: "TestProject\\Sprint1",
        tags: ["tag1", "tag2"],
        priority: 1,
        additionalFields: {
          "Custom.Field": "value",
        },
      });

      const patchDoc = mockWitApi.createWorkItem.mock.calls[0][1];

      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/System.Description", value: "Bug description" })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/System.AssignedTo", value: "user@example.com" })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/System.AreaPath", value: "TestProject\\Area" })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/System.IterationPath", value: "TestProject\\Sprint1" })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/System.Tags", value: "tag1; tag2" })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/Microsoft.VSTS.Common.Priority", value: 1 })
      );
      expect(patchDoc).toContainEqual(
        expect.objectContaining({ path: "/fields/Custom.Field", value: "value" })
      );
    });

    it("should link to parent work item when parentId is provided", async () => {
      const createdItem = {
        id: 125,
        fields: {
          "System.Title": "Child Task",
          "System.WorkItemType": "Task",
          "System.State": "New",
        },
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/125",
      };
      mockWitApi.createWorkItem.mockResolvedValue(createdItem);

      await createWorkItem(mockClient as unknown as AdoClient, {
        type: "Task",
        title: "Child Task",
        parentId: 100,
      });

      const patchDoc = mockWitApi.createWorkItem.mock.calls[0][1];

      expect(patchDoc).toContainEqual(
        expect.objectContaining({
          path: "/relations/-",
          value: expect.objectContaining({
            rel: "System.LinkTypes.Hierarchy-Reverse",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/100",
          }),
        })
      );
    });
  });

  describe("parameter validation", () => {
    it("should throw error when type is missing", async () => {
      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          title: "Test",
        } as { type: string; title: string })
      ).rejects.toThrow();
    });

    it("should throw error when title is missing", async () => {
      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          type: "Bug",
        } as { type: string; title: string })
      ).rejects.toThrow();
    });

    it("should throw error when priority is out of range", async () => {
      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          type: "Bug",
          title: "Test",
          priority: 5,
        })
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw error when API returns null", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(null);

      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          type: "Bug",
          title: "Test",
        })
      ).rejects.toThrow("Failed to create work item");
    });

    it("should throw error when API returns item without id", async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ fields: {} });

      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          type: "Bug",
          title: "Test",
        })
      ).rejects.toThrow("Failed to create work item");
    });

    it("should handle API errors", async () => {
      mockWitApi.createWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        createWorkItem(mockClient as unknown as AdoClient, {
          type: "Bug",
          title: "Test",
        })
      ).rejects.toThrow("API Error");
    });
  });
});
