import { removeWorkItemLink } from "../../../../src/tools/links/remove-work-item-link";
import { AdoClient } from "../../../../src/ado-client";
import { createMockWitApi, createMockAdoClientFull } from "../../../mocks/api-fixtures";

describe("removeWorkItemLink", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({ witApi: mockWitApi });
  });

  describe("happy path", () => {
    it("should remove a link between work items", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "System.LinkTypes.Hierarchy-Forward",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/456",
            attributes: { name: "Child" },
          },
        ],
      });
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await removeWorkItemLink(mockClient as unknown as AdoClient, {
        sourceId: 123,
        targetId: 456,
        linkType: "child",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("removed");
      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });

    it("should throw error when link not found", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [],
      });

      await expect(
        removeWorkItemLink(mockClient as unknown as AdoClient, {
          sourceId: 123,
          targetId: 456,
          linkType: "child",
        })
      ).rejects.toThrow();
    });
  });

  describe("parameter validation", () => {
    it("should throw error when sourceId is missing", async () => {
      await expect(
        removeWorkItemLink(mockClient as unknown as AdoClient, {
          targetId: 456,
          linkType: "child",
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockWitApi.getWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        removeWorkItemLink(mockClient as unknown as AdoClient, {
          sourceId: 123,
          targetId: 456,
          linkType: "child",
        })
      ).rejects.toThrow("API Error");
    });
  });
});
