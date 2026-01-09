import { AdoClient } from "../../ado-client.js";

// Import all user tools
import { getCurrentUserTool, getCurrentUser } from "./get-current-user.js";

// Export all tool definitions
export const userTools = [getCurrentUserTool];

// Tool handler router
export async function handleUserTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "get_current_user":
      return getCurrentUser(client, args as Parameters<typeof getCurrentUser>[1]);
    default:
      throw new Error(`Unknown user tool: ${toolName}`);
  }
}

// Re-export individual tools
export { getCurrentUserTool, getCurrentUser };
