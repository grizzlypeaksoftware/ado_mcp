import { getWorkItem } from "../../../../src/tools/work-items/get-work-item";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWitApi,
  createMockAdoClient,
  mockWorkItem,
  mockCommentsResult,
} from "../../../mocks/work-item-fixtures";

describe("getWorkItem", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("happy path", () => {
    it("should return work item with full details", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);
      mockWitApi.getComments.mockResolvedValue(mockCommentsResult);

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
        includeAttachments: true,
      });

      expect(result.id).toBe(123);
      expect(result.title).toBe("Test Work Item");
      expect(result.state).toBe("Active");
      expect(result.type).toBe("Bug");
      expect(result.assignedTo).toBe("Test User");
      expect(result.description).toBe("<p>Test description</p>");
      expect(result.areaPath).toBe("TestProject\\Area1");
      expect(result.iterationPath).toBe("TestProject\\Sprint1");
      expect(result.priority).toBe(2);
      expect(result.tags).toEqual(["tag1", "tag2"]);
      expect(result.relations).toHaveLength(1);
      expect(result.relations![0].rel).toBe("System.LinkTypes.Hierarchy-Reverse");
    });

    it("should include comments when available", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);
      mockWitApi.getComments.mockResolvedValue(mockCommentsResult);

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
        includeAttachments: true,
      });

      expect(result.comments).toHaveLength(1);
      expect(result.comments![0].text).toBe("This is a test comment");
    });

    it("should handle work item without relations", async () => {
      const itemWithoutRelations = { ...mockWorkItem, relations: undefined };
      mockWitApi.getWorkItem.mockResolvedValue(itemWithoutRelations);
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
        includeAttachments: true,
      });

      expect(result.relations).toEqual([]);
    });

    it("should exclude relations when includeRelations is false", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: false,
        includeAttachments: false,
      });

      expect(result.relations).toEqual([]);
    });
  });

  describe("parameter validation", () => {
    it("should throw error when id is missing", async () => {
      await expect(
        getWorkItem(mockClient as unknown as AdoClient, {
          includeRelations: true,
          includeAttachments: true,
        } as { id: number; includeRelations: boolean; includeAttachments: boolean })
      ).rejects.toThrow();
    });

    it("should throw error when id is not a number", async () => {
      await expect(
        getWorkItem(mockClient as unknown as AdoClient, {
          id: "abc" as unknown as number,
          includeRelations: true,
          includeAttachments: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw error when work item not found", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(null);

      await expect(
        getWorkItem(mockClient as unknown as AdoClient, {
          id: 999,
          includeRelations: true,
          includeAttachments: true,
        })
      ).rejects.toThrow("Work item 999 not found");
    });

    it("should throw error when work item has no fields", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({ id: 123 });

      await expect(
        getWorkItem(mockClient as unknown as AdoClient, {
          id: 123,
          includeRelations: true,
          includeAttachments: true,
        })
      ).rejects.toThrow("Work item 123 not found");
    });

    it("should handle comments API failure gracefully", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);
      mockWitApi.getComments.mockRejectedValue(new Error("Comments not supported"));

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
        includeAttachments: true,
      });

      expect(result.id).toBe(123);
      expect(result.comments).toBeUndefined();
    });

    it("should handle API errors", async () => {
      mockWitApi.getWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        getWorkItem(mockClient as unknown as AdoClient, {
          id: 123,
          includeRelations: true,
          includeAttachments: true,
        })
      ).rejects.toThrow("API Error");
    });
  });

  describe("attachments", () => {
    it("should parse attachments from relations", async () => {
      const itemWithAttachment = {
        ...mockWorkItem,
        relations: [
          ...mockWorkItem.relations,
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/attachment-guid",
            attributes: {
              name: "screenshot.png",
            },
          },
        ],
      };
      mockWitApi.getWorkItem.mockResolvedValue(itemWithAttachment);
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getWorkItem(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
        includeAttachments: true,
      });

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments![0].name).toBe("screenshot.png");
    });
  });
});
