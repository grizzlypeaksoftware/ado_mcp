import { AdoClient } from "../../ado-client.js";

// Import all work item tools
import { listWorkItemsTool, listWorkItems } from "./list-work-items.js";
import { getWorkItemTool, getWorkItem } from "./get-work-item.js";
import { createWorkItemTool, createWorkItem } from "./create-work-item.js";
import { updateWorkItemTool, updateWorkItem } from "./update-work-item.js";
import { deleteWorkItemTool, deleteWorkItem } from "./delete-work-item.js";
import { addWorkItemCommentTool, addWorkItemComment } from "./add-comment.js";
import { searchWorkItemsTool, searchWorkItems } from "./search-work-items.js";
import { queryWorkItemsTool, queryWorkItems } from "./query-work-items.js";
import { listEpicsTool, listEpics } from "./list-epics.js";
import { listFeaturesTool, listFeatures } from "./list-features.js";
import { listUserStoriesTool, listUserStories } from "./list-user-stories.js";
import { listBugsTool, listBugs } from "./list-bugs.js";
import { listTasksTool, listTasks } from "./list-tasks.js";

// Export all tool definitions
export const workItemTools = [
  listWorkItemsTool,
  getWorkItemTool,
  createWorkItemTool,
  updateWorkItemTool,
  deleteWorkItemTool,
  addWorkItemCommentTool,
  searchWorkItemsTool,
  queryWorkItemsTool,
  listEpicsTool,
  listFeaturesTool,
  listUserStoriesTool,
  listBugsTool,
  listTasksTool,
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
    case "query_work_items":
      return queryWorkItems(client, args as Parameters<typeof queryWorkItems>[1]);
    case "list_epics":
      return listEpics(client, args as Parameters<typeof listEpics>[1]);
    case "list_features":
      return listFeatures(client, args as Parameters<typeof listFeatures>[1]);
    case "list_user_stories":
      return listUserStories(client, args as Parameters<typeof listUserStories>[1]);
    case "list_bugs":
      return listBugs(client, args as Parameters<typeof listBugs>[1]);
    case "list_tasks":
      return listTasks(client, args as Parameters<typeof listTasks>[1]);
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
  queryWorkItemsTool,
  queryWorkItems,
  listEpicsTool,
  listEpics,
  listFeaturesTool,
  listFeatures,
  listUserStoriesTool,
  listUserStories,
  listBugsTool,
  listBugs,
  listTasksTool,
  listTasks,
};
