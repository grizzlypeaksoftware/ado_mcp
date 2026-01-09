import { AdoClient } from "../../ado-client.js";

// Import all work item tools
import { listWorkItemsTool, listWorkItems } from "./list-work-items.js";
import { getWorkItemTool, getWorkItem } from "./get-work-item.js";
import { createWorkItemTool, createWorkItem } from "./create-work-item.js";
import { updateWorkItemTool, updateWorkItem } from "./update-work-item.js";
import { deleteWorkItemTool, deleteWorkItem } from "./delete-work-item.js";
import { addWorkItemCommentTool, addWorkItemComment } from "./add-comment.js";
import { searchWorkItemsTool, searchWorkItems } from "./search-work-items.js";

// Export all tool definitions
export const workItemTools = [
  listWorkItemsTool,
  getWorkItemTool,
  createWorkItemTool,
  updateWorkItemTool,
  deleteWorkItemTool,
  addWorkItemCommentTool,
  searchWorkItemsTool,
];

// Tool handler router
export async function handleWorkItemTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_work_items":
      return listWorkItems(client, args as Parameters<typeof listWorkItems>[1]);
    case "get_work_item":
      return getWorkItem(client, args as Parameters<typeof getWorkItem>[1]);
    case "create_work_item":
      return createWorkItem(client, args as Parameters<typeof createWorkItem>[1]);
    case "update_work_item":
      return updateWorkItem(client, args as Parameters<typeof updateWorkItem>[1]);
    case "delete_work_item":
      return deleteWorkItem(client, args as Parameters<typeof deleteWorkItem>[1]);
    case "add_work_item_comment":
      return addWorkItemComment(client, args as Parameters<typeof addWorkItemComment>[1]);
    case "search_work_items":
      return searchWorkItems(client, args as Parameters<typeof searchWorkItems>[1]);
    default:
      throw new Error(`Unknown work item tool: ${toolName}`);
  }
}

// Re-export individual tools for direct use
export {
  listWorkItemsTool,
  listWorkItems,
  getWorkItemTool,
  getWorkItem,
  createWorkItemTool,
  createWorkItem,
  updateWorkItemTool,
  updateWorkItem,
  deleteWorkItemTool,
  deleteWorkItem,
  addWorkItemCommentTool,
  addWorkItemComment,
  searchWorkItemsTool,
  searchWorkItems,
};
