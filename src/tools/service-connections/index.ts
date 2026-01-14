import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listServiceConnectionsSchema = z.object({
  project: z.string().optional(),
  type: z.string().optional(),
});

const getServiceConnectionSchema = z.object({
  project: z.string().optional(),
  connectionId: z.string(),
});

// Tool definitions
export const listServiceConnectionsTool = {
  name: "list_service_connections",
  description: "List service connections (endpoints) that pipelines use to connect to external services like Azure, GitHub, Docker, etc. These store credentials for pipeline deployments.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      type: { type: "string", description: "Filter by connection type (e.g., azurerm, github, docker)" },
    },
    required: [],
  },
};

export const getServiceConnectionTool = {
  name: "get_service_connection",
  description: "Get detailed information about a specific service connection including its type and configuration. Requires a connection ID from list_service_connections.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      connectionId: { type: "string", description: "Connection ID" },
    },
    required: ["connectionId"],
  },
};

// Implementation - Note: Service Endpoints API requires direct REST calls
async function listServiceConnections(client: AdoClient, params: z.infer<typeof listServiceConnectionsSchema>) {
  const validated = listServiceConnectionsSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Service Endpoints API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/serviceendpoint/endpoints${validated.type ? `?type=${validated.type}` : ''}`,
    project,
    type: validated.type,
  };
}

async function getServiceConnection(client: AdoClient, params: z.infer<typeof getServiceConnectionSchema>) {
  const validated = getServiceConnectionSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Service Endpoints API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/serviceendpoint/endpoints/${validated.connectionId}`,
    project,
    connectionId: validated.connectionId,
  };
}

export const serviceConnectionTools = [
  listServiceConnectionsTool,
  getServiceConnectionTool,
];

export async function handleServiceConnectionTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_service_connections": return listServiceConnections(client, args as any);
    case "get_service_connection": return getServiceConnection(client, args as any);
    default: throw new Error(`Unknown service connection tool: ${toolName}`);
  }
}
