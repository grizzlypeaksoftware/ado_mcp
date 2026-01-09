import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listBranchPoliciesSchema = z.object({
  project: z.string().optional(),
  repository: z.string(),
  branch: z.string().optional(),
});

const getBranchPolicySchema = z.object({
  project: z.string().optional(),
  policyId: z.number(),
});

// Tool definitions
export const listBranchPoliciesTool = {
  name: "list_branch_policies",
  description: "List branch policies for a repository",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      repository: { type: "string", description: "Repository name or ID" },
      branch: { type: "string", description: "Filter by branch" },
    },
    required: ["repository"],
  },
};

export const getBranchPolicyTool = {
  name: "get_branch_policy",
  description: "Get details for a branch policy",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      policyId: { type: "number", description: "Policy configuration ID" },
    },
    required: ["policyId"],
  },
};

// Implementation
async function listBranchPolicies(client: AdoClient, params: z.infer<typeof listBranchPoliciesSchema>) {
  const validated = listBranchPoliciesSchema.parse(params);
  const project = client.resolveProject(validated.project);
  const policyApi = await client.getPolicyApi();

  // Get all policy configurations for the project
  const configs = await policyApi.getPolicyConfigurations(project);

  // Filter by repository and optionally branch
  const filtered = (configs || []).filter(config => {
    const scope = config.settings?.scope || [];
    return scope.some((s: any) => {
      const matchesRepo = s.repositoryId === validated.repository ||
                         s.repositoryId?.toString() === validated.repository;
      if (!matchesRepo) return false;
      if (validated.branch) {
        const refName = s.refName || "";
        return refName.includes(validated.branch);
      }
      return true;
    });
  });

  return filtered.map(config => ({
    id: config.id || 0,
    type: config.type?.displayName || "",
    typeId: config.type?.id || "",
    isEnabled: config.isEnabled || false,
    isBlocking: config.isBlocking || false,
    isDeleted: config.isDeleted || false,
    settings: config.settings || {},
    url: config.url || "",
  }));
}

async function getBranchPolicy(client: AdoClient, params: z.infer<typeof getBranchPolicySchema>) {
  const validated = getBranchPolicySchema.parse(params);
  const project = client.resolveProject(validated.project);
  const policyApi = await client.getPolicyApi();

  const config = await policyApi.getPolicyConfiguration(project, validated.policyId);

  if (!config) {
    throw new Error(`Policy configuration ${validated.policyId} not found`);
  }

  return {
    id: config.id || 0,
    type: config.type?.displayName || "",
    typeId: config.type?.id || "",
    isEnabled: config.isEnabled || false,
    isBlocking: config.isBlocking || false,
    isDeleted: config.isDeleted || false,
    createdBy: config.createdBy?.displayName || "",
    createdDate: config.createdDate?.toISOString(),
    settings: config.settings || {},
    url: config.url || "",
  };
}

export const policyTools = [
  listBranchPoliciesTool,
  getBranchPolicyTool,
];

export async function handlePolicyTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_branch_policies": return listBranchPolicies(client, args as any);
    case "get_branch_policy": return getBranchPolicy(client, args as any);
    default: throw new Error(`Unknown policy tool: ${toolName}`);
  }
}
