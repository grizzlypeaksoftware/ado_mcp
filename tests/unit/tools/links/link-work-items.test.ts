import { linkWorkItems } from "../../../../src/tools/links/link-work-items";
import { AdoClient } from "../../../../src/ado-client";
import { createMockWitApi, createMockAdoClientFull, mockWorkItem } from "../../../mocks/api-fixtures";

describe("linkWorkItems", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({ witApi: mockWitApi });
  });

  describe("happy path", () => {
    it("should link two work items with parent relationship", async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ ...mockWorkItem, id: 123 });

      const result = await linkWorkItems(mockClient as unknown as AdoClient, {
        sourceId: 123,
        targetId: 456,
        linkType: "parent",
      });

      expect(result.success).toBe(true);
      expect(result.sourceId).toBe(123);
      expect(result.targetId).toBe(456);
      expect(result.linkType).toBe("parent");
      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });

    it("should link work items with related relationship", async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ ...mockWorkItem, id: 123 });

      const result = await linkWorkItems(mockClient as unknown as AdoClient, {
        sourceId: 123,
        targetId: 789,
        linkType: "related",
      });

      expect(result.success).toBe(true);
      expect(result.linkType).toBe("related");
    });

    it("should include comment when provided", async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ ...mockWorkItem, id: 123 });

      await linkWorkItems(mockClient as unknown as AdoClient, {
        sourceId: 123,
        targetId: 456,
        linkType: "child",
        comment: "Linked for testing",
      });

      const patchDoc = mockWitApi.updateWorkItem.mock.calls[0][1];
      expect(patchDoc[0].value.attributes.comment).toBe("Linked for testing");
    });
  });

  describe("parameter validation", () => {
    it("should throw error when sourceId is missing", async () => {
      await expect(
        linkWorkItems(mockClient as unknown as AdoClient, {
          targetId: 456,
          linkType: "parent",
        } as any)
      ).rejects.toThrow();
    });

    it("should throw error when targetId is missing", async () => {
      await expect(
        linkWorkItems(mockClient as unknown as AdoClient, {
          sourceId: 123,
          linkType: "parent",
        } as any)
      ).rejects.toThrow();
    });

    it("should throw error when linkType is missing", async () => {
      await expect(
        linkWorkItems(mockClient as unknown as AdoClient, {
          sourceId: 123,
          targetId: 456,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockWitApi.updateWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        linkWorkItems(mockClient as unknown as AdoClient, {
          sourceId: 123,
          targetId: 456,
          linkType: "parent",
        })
      ).rejects.toThrow("API Error");
    });
  });
});
