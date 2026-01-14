import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listVariableGroupsSchema = z.object({
  project: z.string().optional(),
  groupName: z.string().optional(),
});

const getVariableGroupSchema = z.object({
  project: z.string().optional(),
  groupId: z.number(),
});

// Tool definitions
export const listVariableGroupsTool = {
  name: "list_variable_groups",
  description: "List pipeline variable groups in a project. Variable groups store reusable variables (including secrets) that can be shared across multiple pipelines. NOT for listing Kanban boards or teams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      groupName: { type: "string", description: "Filter by name" },
    },
    required: [],
  },
};

export const getVariableGroupTool = {
  name: "get_variable_group",
  description: "Get detailed information about a specific pipeline variable group, including all variables (secrets are masked). Requires a group ID from list_variable_groups.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      groupId: { type: "number", description: "Variable group ID" },
    },
    required: ["groupId"],
  },
};

// Implementation
async function listVariableGroups(client: AdoClient, params: z.infer<typeof listVariableGroupsSchema>) {
  const validated = listVariableGroupsSchema.parse(params);
  const project = client.resolveProject(validated.project);
  const taskAgentApi = await client.getTaskAgentApi();

  const groups = await taskAgentApi.getVariableGroups(project, validated.groupName);

  return (groups || []).map(g => ({
    id: g.id || 0,
    name: g.name || "",
    description: g.description || "",
    type: g.type || "",
    createdBy: g.createdBy?.displayName || "",
    createdOn: g.createdOn?.toISOString(),
    modifiedBy: g.modifiedBy?.displayName || "",
    modifiedOn: g.modifiedOn?.toISOString(),
    variableCount: Object.keys(g.variables || {}).length,
  }));
}

async function getVariableGroup(client: AdoClient, params: z.infer<typeof getVariableGroupSchema>) {
  const validated = getVariableGroupSchema.parse(params);
  const project = client.resolveProject(validated.project);
  const taskAgentApi = await client.getTaskAgentApi();

  const group = await taskAgentApi.getVariableGroup(project, validated.groupId);

  if (!group) {
    throw new Error(`Variable group ${validated.groupId} not found`);
  }

  // Map variables, masking secrets
  const variables: Record<string, { value: string; isSecret: boolean }> = {};
  for (const [key, val] of Object.entries(group.variables || {})) {
    variables[key] = {
      value: val.isSecret ? "***" : (val.value || ""),
      isSecret: val.isSecret || false,
    };
  }

  return {
    id: group.id || 0,
    name: group.name || "",
    description: group.description || "",
    type: group.type || "",
    createdBy: group.createdBy?.displayName || "",
    createdOn: group.createdOn?.toISOString(),
    modifiedBy: group.modifiedBy?.displayName || "",
    modifiedOn: group.modifiedOn?.toISOString(),
    variables,
  };
}

export const variableGroupTools = [
  listVariableGroupsTool,
  getVariableGroupTool,
];

export async function handleVariableGroupTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_variable_groups": return listVariableGroups(client, args as any);
    case "get_variable_group": return getVariableGroup(client, args as any);
    default: throw new Error(`Unknown variable group tool: ${toolName}`);
  }
}
