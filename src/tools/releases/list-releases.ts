import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const listReleasesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  definitionId: z.number().optional().describe("Filter by definition"),
  status: z.enum(["draft", "active", "abandoned"]).optional().describe("Filter by status"),
  environmentStatus: z.string().optional().describe("Filter by environment status"),
  maxResults: z.number().default(50).describe("Limit results, default 50"),
});

export const listReleasesTool = {
  name: "list_releases",
  description: "List releases (deployments) created from release definitions. Filter by definition, status (draft/active/abandoned), or environment status. Returns release ID, name, status, and environment deployment states. Use this to track deployment history or find releases to deploy.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      definitionId: {
        type: "number",
        description: "Filter by definition",
      },
      status: {
        type: "string",
        enum: ["draft", "active", "abandoned"],
        description: "Filter by status",
      },
      environmentStatus: {
        type: "string",
        description: "Filter by environment status",
      },
      maxResults: {
        type: "number",
        description: "Limit results, default 50",
      },
    },
    required: [],
  },
};

export interface ReleaseSummary {
  id: number;
  name: string;
  status: string;
  definitionId: number;
  definitionName: string;
  createdBy: string;
  createdOn?: string;
  description?: string;
  environments: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  url: string;
}

export async function listReleases(
  client: AdoClient,
  params: z.infer<typeof listReleasesSchema>
): Promise<ReleaseSummary[]> {
  const validatedParams = listReleasesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Map status
  let statusFilter: ReleaseInterfaces.ReleaseStatus | undefined;
  if (validatedParams.status) {
    switch (validatedParams.status) {
      case "draft":
        statusFilter = ReleaseInterfaces.ReleaseStatus.Draft;
        break;
      case "active":
        statusFilter = ReleaseInterfaces.ReleaseStatus.Active;
        break;
      case "abandoned":
        statusFilter = ReleaseInterfaces.ReleaseStatus.Abandoned;
        break;
    }
  }

  const releases = await releaseApi.getReleases(
    project,
    validatedParams.definitionId,
    undefined, // definitionEnvironmentId
    undefined, // searchText
    undefined, // createdBy
    statusFilter,
    undefined, // environmentStatusFilter
    undefined, // minCreatedTime
    undefined, // maxCreatedTime
    undefined, // queryOrder
    validatedParams.maxResults
  );

  if (!releases) {
    return [];
  }

  return releases.map((release) => ({
    id: release.id || 0,
    name: release.name || "",
    status: getStatusString(release.status),
    definitionId: release.releaseDefinition?.id || 0,
    definitionName: release.releaseDefinition?.name || "",
    createdBy: release.createdBy?.displayName || "",
    createdOn: release.createdOn?.toISOString(),
    description: release.description,
    environments: (release.environments || []).map((env) => ({
      id: env.id || 0,
      name: env.name || "",
      status: getEnvironmentStatusString(env.status),
    })),
    url: release.url || "",
  }));
}

function getStatusString(status?: ReleaseInterfaces.ReleaseStatus): string {
  switch (status) {
    case ReleaseInterfaces.ReleaseStatus.Active:
      return "active";
    case ReleaseInterfaces.ReleaseStatus.Draft:
      return "draft";
    case ReleaseInterfaces.ReleaseStatus.Abandoned:
      return "abandoned";
    default:
      return "unknown";
  }
}

function getEnvironmentStatusString(status?: ReleaseInterfaces.EnvironmentStatus): string {
  switch (status) {
    case ReleaseInterfaces.EnvironmentStatus.NotStarted:
      return "notStarted";
    case ReleaseInterfaces.EnvironmentStatus.InProgress:
      return "inProgress";
    case ReleaseInterfaces.EnvironmentStatus.Succeeded:
      return "succeeded";
    case ReleaseInterfaces.EnvironmentStatus.Canceled:
      return "canceled";
    case ReleaseInterfaces.EnvironmentStatus.Rejected:
      return "rejected";
    case ReleaseInterfaces.EnvironmentStatus.Queued:
      return "queued";
    case ReleaseInterfaces.EnvironmentStatus.Scheduled:
      return "scheduled";
    case ReleaseInterfaces.EnvironmentStatus.PartiallySucceeded:
      return "partiallySucceeded";
    default:
      return "unknown";
  }
}
