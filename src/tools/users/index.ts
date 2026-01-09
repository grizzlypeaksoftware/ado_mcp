import { AdoClient } from "../../ado-client.js";

// Import all user tools
import { getCurrentUserTool, getCurrentUser } from "./get-current-user.js";
import { searchUsersTool, searchUsers } from "./search-users.js";
import { getUserTool, getUser } from "./get-user.js";

// Export all tool definitions
export const userTools = [
  getCurrentUserTool,
  searchUsersTool,
  getUserTool,
];

// Tool handler router
export async function handleUserTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "get_current_user":
      return getCurrentUser(client, args as Parameters<typeof getCurrentUser>[1]);
    case "search_users":
      return searchUsers(client, args as Parameters<typeof searchUsers>[1]);
    case "get_user":
      return getUser(client, args as Parameters<typeof getUser>[1]);
    default:
      throw new Error(`Unknown user tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  getCurrentUserTool,
  getCurrentUser,
  searchUsersTool,
  searchUsers,
  getUserTool,
  getUser,
};
