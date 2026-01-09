import { AdoClient } from "../../ado-client.js";

// Import all release tools
import { listReleaseDefinitionsTool, listReleaseDefinitions } from "./list-release-definitions.js";
import { getReleaseDefinitionTool, getReleaseDefinition } from "./get-release-definition.js";
import { listReleasesTool, listReleases } from "./list-releases.js";
import { getReleaseTool, getRelease } from "./get-release.js";
import { createReleaseTool, createRelease } from "./create-release.js";
import { deployReleaseTool, deployRelease } from "./deploy-release.js";
import { getReleaseEnvironmentTool, getReleaseEnvironment } from "./get-release-environment.js";
import { approveReleaseTool, approveRelease } from "./approve-release.js";
import { getReleaseLogsTool, getReleaseLogs } from "./get-release-logs.js";

// Export all tool definitions
export const releaseTools = [
  listReleaseDefinitionsTool,
  getReleaseDefinitionTool,
  listReleasesTool,
  getReleaseTool,
  createReleaseTool,
  deployReleaseTool,
  getReleaseEnvironmentTool,
  approveReleaseTool,
  getReleaseLogsTool,
];

// Tool handler router
export async function handleReleaseTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_release_definitions":
      return listReleaseDefinitions(client, args as Parameters<typeof listReleaseDefinitions>[1]);
    case "get_release_definition":
      return getReleaseDefinition(client, args as Parameters<typeof getReleaseDefinition>[1]);
    case "list_releases":
      return listReleases(client, args as Parameters<typeof listReleases>[1]);
    case "get_release":
      return getRelease(client, args as Parameters<typeof getRelease>[1]);
    case "create_release":
      return createRelease(client, args as Parameters<typeof createRelease>[1]);
    case "deploy_release":
      return deployRelease(client, args as Parameters<typeof deployRelease>[1]);
    case "get_release_environment":
      return getReleaseEnvironment(client, args as Parameters<typeof getReleaseEnvironment>[1]);
    case "approve_release":
      return approveRelease(client, args as Parameters<typeof approveRelease>[1]);
    case "get_release_logs":
      return getReleaseLogs(client, args as Parameters<typeof getReleaseLogs>[1]);
    default:
      throw new Error(`Unknown release tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listReleaseDefinitionsTool,
  listReleaseDefinitions,
  getReleaseDefinitionTool,
  getReleaseDefinition,
  listReleasesTool,
  listReleases,
  getReleaseTool,
  getRelease,
  createReleaseTool,
  createRelease,
  deployReleaseTool,
  deployRelease,
  getReleaseEnvironmentTool,
  getReleaseEnvironment,
  approveReleaseTool,
  approveRelease,
  getReleaseLogsTool,
  getReleaseLogs,
};
