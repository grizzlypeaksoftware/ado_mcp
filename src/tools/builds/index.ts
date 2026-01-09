import { AdoClient } from "../../ado-client.js";

// Import all build tools
import { listBuildDefinitionsTool, listBuildDefinitions } from "./list-build-definitions.js";
import { listBuildsTool, listBuilds } from "./list-builds.js";
import { getBuildTool, getBuild } from "./get-build.js";
import { queueBuildTool, queueBuild } from "./queue-build.js";
import { cancelBuildTool, cancelBuild } from "./cancel-build.js";
import { getBuildLogsTool, getBuildLogs } from "./get-build-logs.js";

// Export all tool definitions
export const buildTools = [
  listBuildDefinitionsTool,
  listBuildsTool,
  getBuildTool,
  queueBuildTool,
  cancelBuildTool,
  getBuildLogsTool,
];

// Tool handler router
export async function handleBuildTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_build_definitions":
      return listBuildDefinitions(client, args as Parameters<typeof listBuildDefinitions>[1]);
    case "list_builds":
      return listBuilds(client, args as Parameters<typeof listBuilds>[1]);
    case "get_build":
      return getBuild(client, args as Parameters<typeof getBuild>[1]);
    case "queue_build":
      return queueBuild(client, args as Parameters<typeof queueBuild>[1]);
    case "cancel_build":
      return cancelBuild(client, args as Parameters<typeof cancelBuild>[1]);
    case "get_build_logs":
      return getBuildLogs(client, args as Parameters<typeof getBuildLogs>[1]);
    default:
      throw new Error(`Unknown build tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listBuildDefinitionsTool,
  listBuildDefinitions,
  listBuildsTool,
  listBuilds,
  getBuildTool,
  getBuild,
  queueBuildTool,
  queueBuild,
  cancelBuildTool,
  cancelBuild,
  getBuildLogsTool,
  getBuildLogs,
};
