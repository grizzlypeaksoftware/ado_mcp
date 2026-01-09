import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listDashboardsSchema = z.object({
  project: z.string().optional(),
  team: z.string().optional(),
});

const getDashboardSchema = z.object({
  project: z.string().optional(),
  team: z.string().optional(),
  dashboardId: z.string(),
});

// Tool definitions
export const listDashboardsTool = {
  name: "list_dashboards",
  description: "List dashboards in a project",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      team: { type: "string", description: "Team name" },
    },
    required: [],
  },
};

export const getDashboardTool = {
  name: "get_dashboard",
  description: "Get details for a dashboard including widgets",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      team: { type: "string", description: "Team name" },
      dashboardId: { type: "string", description: "Dashboard ID" },
    },
    required: ["dashboardId"],
  },
};

// Implementation - Note: Dashboard API requires direct REST calls
async function listDashboards(client: AdoClient, params: z.infer<typeof listDashboardsSchema>) {
  const validated = listDashboardsSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Dashboard API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/${validated.team || '{team}'}/_apis/dashboard/dashboards`,
    project,
    team: validated.team,
  };
}

async function getDashboard(client: AdoClient, params: z.infer<typeof getDashboardSchema>) {
  const validated = getDashboardSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Dashboard API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/${validated.team || '{team}'}/_apis/dashboard/dashboards/${validated.dashboardId}`,
    project,
    team: validated.team,
    dashboardId: validated.dashboardId,
  };
}

export const dashboardTools = [
  listDashboardsTool,
  getDashboardTool,
];

export async function handleDashboardTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_dashboards": return listDashboards(client, args as any);
    case "get_dashboard": return getDashboard(client, args as any);
    default: throw new Error(`Unknown dashboard tool: ${toolName}`);
  }
}
