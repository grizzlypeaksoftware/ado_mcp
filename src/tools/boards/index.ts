import { AdoClient } from "../../ado-client.js";

// Import all board tools
import { getBoardsTool, getBoards } from "./get-boards.js";
import { getBoardColumnsTool, getBoardColumns } from "./get-board-columns.js";
import { getBoardItemsTool, getBoardItems } from "./get-board-items.js";
import { moveBoardCardTool, moveBoardCard } from "./move-board-card.js";
import { getBoardSwimlanesTool, getBoardSwimlanes } from "./get-board-swimlanes.js";

// Export all tool definitions
export const boardTools = [
  getBoardsTool,
  getBoardColumnsTool,
  getBoardItemsTool,
  moveBoardCardTool,
  getBoardSwimlanesTool,
];

// Tool handler router
export async function handleBoardTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "get_boards":
      return getBoards(client, args as Parameters<typeof getBoards>[1]);
    case "get_board_columns":
      return getBoardColumns(client, args as Parameters<typeof getBoardColumns>[1]);
    case "get_board_items":
      return getBoardItems(client, args as Parameters<typeof getBoardItems>[1]);
    case "move_board_card":
      return moveBoardCard(client, args as Parameters<typeof moveBoardCard>[1]);
    case "get_board_swimlanes":
      return getBoardSwimlanes(client, args as Parameters<typeof getBoardSwimlanes>[1]);
    default:
      throw new Error(`Unknown board tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  getBoardsTool,
  getBoards,
  getBoardColumnsTool,
  getBoardColumns,
  getBoardItemsTool,
  getBoardItems,
  moveBoardCardTool,
  moveBoardCard,
  getBoardSwimlanesTool,
  getBoardSwimlanes,
};
