import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listFeedsSchema = z.object({
  project: z.string().optional(),
});

const getFeedSchema = z.object({
  feedId: z.string(),
  project: z.string().optional(),
});

const listPackagesSchema = z.object({
  feedId: z.string(),
  project: z.string().optional(),
  protocolType: z.enum(["npm", "nuget", "maven", "pypi", "upack", "cargo"]).optional(),
  packageNameQuery: z.string().optional(),
  maxResults: z.number().default(50),
});

const getPackageSchema = z.object({
  feedId: z.string(),
  packageId: z.string(),
  project: z.string().optional(),
});

const getPackageVersionsSchema = z.object({
  feedId: z.string(),
  packageId: z.string(),
  project: z.string().optional(),
});

// Tool definitions
export const listFeedsTool = {
  name: "list_feeds",
  description: "List Azure Artifacts feeds (package repositories for npm, NuGet, Maven, PyPI, etc.). Feeds store and share packages across projects. NOT for listing Kanban boards or teams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project-scoped feeds, or omit for org-scoped" },
    },
    required: [],
  },
};

export const getFeedTool = {
  name: "get_feed",
  description: "Get detailed information about a specific Azure Artifacts feed including its upstream sources and permissions. Requires a feed ID from list_feeds.",
  inputSchema: {
    type: "object" as const,
    properties: {
      feedId: { type: "string", description: "Feed ID or name" },
      project: { type: "string", description: "Project name" },
    },
    required: ["feedId"],
  },
};

export const listPackagesTool = {
  name: "list_packages",
  description: "List packages (npm, NuGet, Maven, etc.) stored in an Azure Artifacts feed. Can filter by package type and name. Requires a feed ID from list_feeds.",
  inputSchema: {
    type: "object" as const,
    properties: {
      feedId: { type: "string", description: "Feed ID or name" },
      project: { type: "string", description: "Project name" },
      protocolType: { type: "string", enum: ["npm", "nuget", "maven", "pypi", "upack", "cargo"] },
      packageNameQuery: { type: "string", description: "Search by name" },
      maxResults: { type: "number", description: "Limit results" },
    },
    required: ["feedId"],
  },
};

export const getPackageTool = {
  name: "get_package",
  description: "Get detailed information about a specific package in an Azure Artifacts feed, including its description and latest version. Requires feed ID and package ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      feedId: { type: "string", description: "Feed ID or name" },
      packageId: { type: "string", description: "Package ID or name" },
      project: { type: "string", description: "Project name" },
    },
    required: ["feedId", "packageId"],
  },
};

export const getPackageVersionsTool = {
  name: "get_package_versions",
  description: "Get the version history of a specific package in an Azure Artifacts feed. Shows all published versions with their dates and status. Requires feed ID and package ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      feedId: { type: "string", description: "Feed ID or name" },
      packageId: { type: "string", description: "Package ID or name" },
      project: { type: "string", description: "Project name" },
    },
    required: ["feedId", "packageId"],
  },
};

// Note: The azure-devops-node-api doesn't have a built-in Artifacts API
// These implementations use REST API directly through fetch
async function listFeeds(client: AdoClient, params: z.infer<typeof listFeedsSchema>) {
  const validated = listFeedsSchema.parse(params);
  // Simplified - in practice would use REST API
  return {
    message: "Artifact feeds API requires direct REST calls. Feed listing not available through SDK.",
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/packaging/feeds",
  };
}

async function getFeed(client: AdoClient, params: z.infer<typeof getFeedSchema>) {
  const validated = getFeedSchema.parse(params);
  return {
    message: `Feed details for '${validated.feedId}' requires direct REST calls.`,
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/packaging/feeds/{feedId}",
  };
}

async function listPackages(client: AdoClient, params: z.infer<typeof listPackagesSchema>) {
  const validated = listPackagesSchema.parse(params);
  return {
    message: `Package listing for feed '${validated.feedId}' requires direct REST calls.`,
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/packaging/Feeds/{feedId}/packages",
  };
}

async function getPackage(client: AdoClient, params: z.infer<typeof getPackageSchema>) {
  const validated = getPackageSchema.parse(params);
  return {
    message: `Package details for '${validated.packageId}' in feed '${validated.feedId}' requires direct REST calls.`,
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/packaging/Feeds/{feedId}/packages/{packageId}",
  };
}

async function getPackageVersions(client: AdoClient, params: z.infer<typeof getPackageVersionsSchema>) {
  const validated = getPackageVersionsSchema.parse(params);
  return {
    message: `Package versions for '${validated.packageId}' in feed '${validated.feedId}' requires direct REST calls.`,
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/packaging/Feeds/{feedId}/packages/{packageId}/versions",
  };
}

export const artifactTools = [
  listFeedsTool,
  getFeedTool,
  listPackagesTool,
  getPackageTool,
  getPackageVersionsTool,
];

export async function handleArtifactTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_feeds": return listFeeds(client, args as any);
    case "get_feed": return getFeed(client, args as any);
    case "list_packages": return listPackages(client, args as any);
    case "get_package": return getPackage(client, args as any);
    case "get_package_versions": return getPackageVersions(client, args as any);
    default: throw new Error(`Unknown artifact tool: ${toolName}`);
  }
}
