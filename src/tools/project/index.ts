import { AdoClient } from "../../ado-client.js";

// Import all project tools
import { listProjectsTool, listProjects } from "./list-projects.js";
import { getProjectTool, getProject } from "./get-project.js";

// Export all tool definitions
export const projectTools = [listProjectsTool, getProjectTool];

// Tool handler router
export async function handleProjectTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_projects":
      return listProjects(client, args as Parameters<typeof listProjects>[1]);
    case "get_project":
      return getProject(client, args as Parameters<typeof getProject>[1]);
    default:
      throw new Error(`Unknown project tool: ${toolName}`);
  }
}

// Re-export individual tools
export { listProjectsTool, listProjects, getProjectTool, getProject };
