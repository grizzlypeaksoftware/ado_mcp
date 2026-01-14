import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { AdoClient } from "./ado-client.js";
import { HttpTransport } from "./transports/http-transport.js";

// Import tool registrations
import { workItemTools, handleWorkItemTool } from "./tools/work-items/index.js";
import { gitTools, handleGitTool } from "./tools/git/index.js";
import { projectTools, handleProjectTool } from "./tools/project/index.js";
import { userTools, handleUserTool } from "./tools/users/index.js";
import { linkTools, handleLinkTool } from "./tools/links/index.js";
import { attachmentTools, handleAttachmentTool } from "./tools/attachments/index.js";
import { boardTools, handleBoardTool } from "./tools/boards/index.js";
import { pullRequestTools, handlePullRequestTool } from "./tools/pull-requests/index.js";
import { pipelineTools, handlePipelineTool } from "./tools/pipelines/index.js";
import { buildTools, handleBuildTool } from "./tools/builds/index.js";
import { releaseTools, handleReleaseTool } from "./tools/releases/index.js";
import { wikiTools, handleWikiTool } from "./tools/wiki/index.js";
import { testPlanTools, handleTestPlanTool } from "./tools/test-plans/index.js";
import { artifactTools, handleArtifactTool } from "./tools/artifacts/index.js";
import { serviceConnectionTools, handleServiceConnectionTool } from "./tools/service-connections/index.js";
import { variableGroupTools, handleVariableGroupTool } from "./tools/variable-groups/index.js";
import { notificationTools, handleNotificationTool } from "./tools/notifications/index.js";
import { dashboardTools, handleDashboardTool } from "./tools/dashboards/index.js";
import { policyTools, handlePolicyTool } from "./tools/policies/index.js";

// Validate required environment variables
function validateEnv(): { orgUrl: string; pat: string; defaultProject?: string; port: number; sessionTimeout: number } {
  const orgUrl = process.env.ADO_ORG_URL;
  const pat = process.env.ADO_PAT;
  const defaultProject = process.env.ADO_PROJECT;
  const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
  const sessionTimeout = parseInt(process.env.MCP_SESSION_TIMEOUT || "30", 10);

  if (!orgUrl) {
    throw new Error("ADO_ORG_URL environment variable is required");
  }
  if (!pat) {
    throw new Error("ADO_PAT environment variable is required");
  }

  return { orgUrl, pat, defaultProject, port, sessionTimeout };
}

async function main() {
  const env = validateEnv();

  console.log("Starting Azure DevOps MCP Server (HTTP mode)...");

  // Initialize ADO client
  const adoClient = new AdoClient(env.orgUrl, env.pat, env.defaultProject);

  // Validate connection
  try {
    await adoClient.validateConnection();
    console.log("Successfully connected to Azure DevOps");
  } catch (error) {
    console.error("Failed to connect to Azure DevOps:", error);
    process.exit(1);
  }

  // Create MCP server
  const server = new Server(
    {
      name: "azure-devops-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Collect all tools
  const allTools = [
    ...workItemTools,
    ...linkTools,
    ...attachmentTools,
    ...boardTools,
    ...projectTools,
    ...gitTools,
    ...pullRequestTools,
    ...pipelineTools,
    ...buildTools,
    ...releaseTools,
    ...wikiTools,
    ...testPlanTools,
    ...artifactTools,
    ...serviceConnectionTools,
    ...variableGroupTools,
    ...userTools,
    ...notificationTools,
    ...dashboardTools,
    ...policyTools,
  ];

  console.log(`Loaded ${allTools.length} tools`);

  // Create HTTP transport
  const httpTransport = new HttpTransport(server, {
    port: env.port,
    sessionTimeoutMinutes: env.sessionTimeout,
  });

  // Set up tools list handler
  httpTransport.setToolsHandler(async () => {
    return { tools: allTools };
  });

  // Set up tool call handler
  httpTransport.setCallToolHandler(async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      // Route to appropriate handler
      if (workItemTools.some((t) => t.name === name)) {
        result = await handleWorkItemTool(adoClient, name, args);
      } else if (linkTools.some((t) => t.name === name)) {
        result = await handleLinkTool(adoClient, name, args);
      } else if (attachmentTools.some((t) => t.name === name)) {
        result = await handleAttachmentTool(adoClient, name, args);
      } else if (boardTools.some((t) => t.name === name)) {
        result = await handleBoardTool(adoClient, name, args);
      } else if (projectTools.some((t) => t.name === name)) {
        result = await handleProjectTool(adoClient, name, args);
      } else if (gitTools.some((t) => t.name === name)) {
        result = await handleGitTool(adoClient, name, args);
      } else if (pullRequestTools.some((t) => t.name === name)) {
        result = await handlePullRequestTool(adoClient, name, args);
      } else if (pipelineTools.some((t) => t.name === name)) {
        result = await handlePipelineTool(adoClient, name, args);
      } else if (buildTools.some((t) => t.name === name)) {
        result = await handleBuildTool(adoClient, name, args);
      } else if (releaseTools.some((t) => t.name === name)) {
        result = await handleReleaseTool(adoClient, name, args);
      } else if (wikiTools.some((t) => t.name === name)) {
        result = await handleWikiTool(adoClient, name, args);
      } else if (testPlanTools.some((t) => t.name === name)) {
        result = await handleTestPlanTool(adoClient, name, args);
      } else if (artifactTools.some((t) => t.name === name)) {
        result = await handleArtifactTool(adoClient, name, args);
      } else if (serviceConnectionTools.some((t) => t.name === name)) {
        result = await handleServiceConnectionTool(adoClient, name, args);
      } else if (variableGroupTools.some((t) => t.name === name)) {
        result = await handleVariableGroupTool(adoClient, name, args);
      } else if (userTools.some((t) => t.name === name)) {
        result = await handleUserTool(adoClient, name, args);
      } else if (notificationTools.some((t) => t.name === name)) {
        result = await handleNotificationTool(adoClient, name, args);
      } else if (dashboardTools.some((t) => t.name === name)) {
        result = await handleDashboardTool(adoClient, name, args);
      } else if (policyTools.some((t) => t.name === name)) {
        result = await handlePolicyTool(adoClient, name, args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await httpTransport.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down...");
    await httpTransport.stop();
    process.exit(0);
  });

  // Start the HTTP server
  await httpTransport.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
