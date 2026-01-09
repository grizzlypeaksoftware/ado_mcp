import { AdoClient } from "../../ado-client.js";

// Import all project tools
import { listProjectsTool, listProjects } from "./list-projects.js";
import { getProjectTool, getProject } from "./get-project.js";
import { listTeamsTool, listTeams } from "./list-teams.js";
import { getTeamMembersTool, getTeamMembers } from "./get-team-members.js";
import { listIterationsTool, listIterations } from "./list-iterations.js";
import { getCurrentIterationTool, getCurrentIteration } from "./get-current-iteration.js";
import { listAreaPathsTool, listAreaPaths } from "./list-area-paths.js";

// Export all tool definitions
export const projectTools = [
  listProjectsTool,
  getProjectTool,
  listTeamsTool,
  getTeamMembersTool,
  listIterationsTool,
  getCurrentIterationTool,
  listAreaPathsTool,
];

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
    case "list_teams":
      return listTeams(client, args as Parameters<typeof listTeams>[1]);
    case "get_team_members":
      return getTeamMembers(client, args as Parameters<typeof getTeamMembers>[1]);
    case "list_iterations":
      return listIterations(client, args as Parameters<typeof listIterations>[1]);
    case "get_current_iteration":
      return getCurrentIteration(client, args as Parameters<typeof getCurrentIteration>[1]);
    case "list_area_paths":
      return listAreaPaths(client, args as Parameters<typeof listAreaPaths>[1]);
    default:
      throw new Error(`Unknown project tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listProjectsTool,
  listProjects,
  getProjectTool,
  getProject,
  listTeamsTool,
  listTeams,
  getTeamMembersTool,
  getTeamMembers,
  listIterationsTool,
  listIterations,
  getCurrentIterationTool,
  getCurrentIteration,
  listAreaPathsTool,
  listAreaPaths,
};
