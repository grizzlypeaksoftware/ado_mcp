import { getBoards } from "../../../../src/tools/boards/get-boards";
import { getBoardColumns } from "../../../../src/tools/boards/get-board-columns";
import { getBoardItems } from "../../../../src/tools/boards/get-board-items";
import { getBoardSwimlanes } from "../../../../src/tools/boards/get-board-swimlanes";
import { moveBoardCard } from "../../../../src/tools/boards/move-board-card";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWorkApi,
  createMockWitApi,
  createMockAdoClientFull,
  mockBoard,
  mockBoardColumn,
  mockBoardRow,
} from "../../../mocks/api-fixtures";

describe("Board Tools", () => {
  let mockWorkApi: ReturnType<typeof createMockWorkApi>;
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWorkApi = createMockWorkApi();
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({ workApi: mockWorkApi, witApi: mockWitApi });
  });

  describe("getBoards", () => {
    it("should list boards for a team", async () => {
      mockWorkApi.getBoards.mockResolvedValue([mockBoard]);

      const result = await getBoards(mockClient as unknown as AdoClient, {
        project: "TestProject",
        team: "TestTeam",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("board-1");
      expect(result[0].name).toBe("Stories");
    });

    it("should return empty array when no boards found", async () => {
      mockWorkApi.getBoards.mockResolvedValue([]);

      const result = await getBoards(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });

    it("should use default project when not specified", async () => {
      mockWorkApi.getBoards.mockResolvedValue([mockBoard]);

      await getBoards(mockClient as unknown as AdoClient, {});

      expect(mockClient.resolveProject).toHaveBeenCalledWith(undefined);
    });
  });

  describe("getBoardColumns", () => {
    it("should return board columns", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue([
        mockBoardColumn,
        { id: "col-2", name: "Done", itemLimit: 0 },
      ]);

      const result = await getBoardColumns(mockClient as unknown as AdoClient, {
        board: "Stories",
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Active");
      expect(result[0].itemLimit).toBe(5);
    });

    it("should return empty array when no columns found", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue(null);

      const result = await getBoardColumns(mockClient as unknown as AdoClient, {
        board: "NonExistent",
      });

      expect(result).toEqual([]);
    });
  });

  describe("getBoardSwimlanes", () => {
    it("should return board swimlanes", async () => {
      mockWorkApi.getBoardRows.mockResolvedValue([
        mockBoardRow,
        { id: "row-2", name: "Default" },
      ]);

      const result = await getBoardSwimlanes(mockClient as unknown as AdoClient, {
        board: "Stories",
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Expedite");
    });

    it("should return empty array when no swimlanes defined", async () => {
      mockWorkApi.getBoardRows.mockResolvedValue(null);

      const result = await getBoardSwimlanes(mockClient as unknown as AdoClient, {
        board: "Stories",
      });

      expect(result).toEqual([]);
    });
  });

  describe("getBoardItems", () => {
    it("should return work items on a board", async () => {
      mockWorkApi.getBoard.mockResolvedValue(mockBoard);
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: [
          { id: 123 },
          { id: 456 },
        ],
      });
      mockWitApi.getWorkItems.mockResolvedValue([
        {
          id: 123,
          fields: {
            "System.Title": "Item 1",
            "System.State": "Active",
            "System.WorkItemType": "User Story",
            "System.BoardColumn": "Active",
          },
        },
        {
          id: 456,
          fields: {
            "System.Title": "Item 2",
            "System.State": "New",
            "System.WorkItemType": "Bug",
            "System.BoardColumn": "New",
          },
        },
      ]);

      const result = await getBoardItems(mockClient as unknown as AdoClient, {
        board: "Stories",
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(123);
      expect(result[0].column).toBe("Active");
    });

    it("should return empty array when no items on board", async () => {
      mockWorkApi.getBoard.mockResolvedValue(mockBoard);
      mockWitApi.queryByWiql.mockResolvedValue({ workItems: [] });

      const result = await getBoardItems(mockClient as unknown as AdoClient, {
        board: "Stories",
      });

      expect(result).toEqual([]);
    });
  });

  describe("moveBoardCard", () => {
    it("should move a card to a new column", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue([
        { name: "New", stateMappings: { "User Story": "New" } },
        { name: "Done", stateMappings: { "User Story": "Done" } },
      ]);
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await moveBoardCard(mockClient as unknown as AdoClient, {
        id: 123,
        board: "Stories",
        column: "Done",
      });

      expect(result.success).toBe(true);
      expect(result.column).toBe("Done");
      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });

    it("should move a card to a new column and swimlane", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue([
        { name: "Active", stateMappings: { "User Story": "Active" } },
      ]);
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await moveBoardCard(mockClient as unknown as AdoClient, {
        id: 123,
        board: "Stories",
        column: "Active",
        swimlane: "Expedite",
      });

      expect(result.success).toBe(true);
      expect(result.column).toBe("Active");
      expect(result.swimlane).toBe("Expedite");
    });

    it("should throw error when column not found", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue([
        { name: "Active", stateMappings: {} },
      ]);

      await expect(
        moveBoardCard(mockClient as unknown as AdoClient, {
          id: 123,
          board: "Stories",
          column: "NonExistent",
        })
      ).rejects.toThrow("Column NonExistent not found");
    });

    it("should handle API errors", async () => {
      mockWorkApi.getBoardColumns.mockResolvedValue([
        { name: "Done", stateMappings: {} },
      ]);
      mockWitApi.updateWorkItem.mockRejectedValue(new Error("Update failed"));

      await expect(
        moveBoardCard(mockClient as unknown as AdoClient, {
          id: 123,
          board: "Stories",
          column: "Done",
        })
      ).rejects.toThrow("Update failed");
    });
  });
});
