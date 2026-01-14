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

// Import type-specific get tools
import { getEpicTool, getEpic } from "./get-epic.js";
import { getFeatureTool, getFeature } from "./get-feature.js";
import { getUserStoryTool, getUserStory } from "./get-user-story.js";
import { getBugTool, getBug } from "./get-bug.js";
import { getTaskTool, getTask } from "./get-task.js";

// Import type-specific create tools
import { createEpicTool, createEpic } from "./create-epic.js";
import { createFeatureTool, createFeature } from "./create-feature.js";
import { createUserStoryTool, createUserStory } from "./create-user-story.js";
import { createBugTool, createBug } from "./create-bug.js";
import { createTaskTool, createTask } from "./create-task.js";

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
  // Type-specific get tools
  getEpicTool,
  getFeatureTool,
  getUserStoryTool,
  getBugTool,
  getTaskTool,
  // Type-specific create tools
  createEpicTool,
  createFeatureTool,
  createUserStoryTool,
  createBugTool,
  createTaskTool,
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
    // Type-specific get tools
    case "get_epic":
      return getEpic(client, args as Parameters<typeof getEpic>[1]);
    case "get_feature":
      return getFeature(client, args as Parameters<typeof getFeature>[1]);
    case "get_user_story":
      return getUserStory(client, args as Parameters<typeof getUserStory>[1]);
    case "get_bug":
      return getBug(client, args as Parameters<typeof getBug>[1]);
    case "get_task":
      return getTask(client, args as Parameters<typeof getTask>[1]);
    // Type-specific create tools
    case "create_epic":
      return createEpic(client, args as Parameters<typeof createEpic>[1]);
    case "create_feature":
      return createFeature(client, args as Parameters<typeof createFeature>[1]);
    case "create_user_story":
      return createUserStory(client, args as Parameters<typeof createUserStory>[1]);
    case "create_bug":
      return createBug(client, args as Parameters<typeof createBug>[1]);
    case "create_task":
      return createTask(client, args as Parameters<typeof createTask>[1]);
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
  // Type-specific get tools
  getEpicTool,
  getEpic,
  getFeatureTool,
  getFeature,
  getUserStoryTool,
  getUserStory,
  getBugTool,
  getBug,
  getTaskTool,
  getTask,
  // Type-specific create tools
  createEpicTool,
  createEpic,
  createFeatureTool,
  createFeature,
  createUserStoryTool,
  createUserStory,
  createBugTool,
  createBug,
  createTaskTool,
  createTask,
};
