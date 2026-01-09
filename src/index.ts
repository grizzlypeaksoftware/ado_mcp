import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AdoClient } from "./ado-client.js";

// Import tool registrations
import { workItemTools, handleWorkItemTool } from "./tools/work-items/index.js";
import { gitTools, handleGitTool } from "./tools/git/index.js";
import { projectTools, handleProjectTool } from "./tools/project/index.js";
import { userTools, handleUserTool } from "./tools/users/index.js";

// Validate required environment variables
function validateEnv(): { orgUrl: string; pat: string; defaultProject?: string } {
  const orgUrl = process.env.ADO_ORG_URL;
  const pat = process.env.ADO_PAT;
  const defaultProject = process.env.ADO_PROJECT;

  if (!orgUrl) {
    throw new Error("ADO_ORG_URL environment variable is required");
  }
  if (!pat) {
    throw new Error("ADO_PAT environment variable is required");
  }

  return { orgUrl, pat, defaultProject };
}

async function main() {
  const env = validateEnv();

  // Initialize ADO client
  const adoClient = new AdoClient(env.orgUrl, env.pat, env.defaultProject);

  // Validate connection
  try {
    await adoClient.validateConnection();
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
    ...gitTools,
    ...projectTools,
    ...userTools,
  ];

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      // Route to appropriate handler
      if (workItemTools.some((t) => t.name === name)) {
        result = await handleWorkItemTool(adoClient, name, args);
      } else if (gitTools.some((t) => t.name === name)) {
        result = await handleGitTool(adoClient, name, args);
      } else if (projectTools.some((t) => t.name === name)) {
        result = await handleProjectTool(adoClient, name, args);
      } else if (userTools.some((t) => t.name === name)) {
        result = await handleUserTool(adoClient, name, args);
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

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
