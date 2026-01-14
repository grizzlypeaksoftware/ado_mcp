import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const getReleaseSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  releaseId: z.number().describe("Release ID"),
});

export const getReleaseTool = {
  name: "get_release",
  description: "Get detailed information about a specific release by ID. Returns status, environments with deployment steps and attempts, artifact versions used, and timing info. Use this to inspect deployment progress, check which environments succeeded/failed, or audit what was deployed.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      releaseId: {
        type: "number",
        description: "Release ID",
      },
    },
    required: ["releaseId"],
  },
};

export interface ReleaseDetails {
  id: number;
  name: string;
  status: string;
  definitionId: number;
  definitionName: string;
  description?: string;
  reason: string;
  createdBy: string;
  createdOn?: string;
  modifiedBy: string;
  modifiedOn?: string;
  environments: Array<{
    id: number;
    name: string;
    status: string;
    rank: number;
    deploySteps: Array<{
      id: number;
      status: string;
      reason: string;
      attempt: number;
    }>;
  }>;
  artifacts: Array<{
    alias: string;
    type: string;
    version: string;
    sourceId: string;
  }>;
  url: string;
}

export async function getRelease(
  client: AdoClient,
  params: z.infer<typeof getReleaseSchema>
): Promise<ReleaseDetails> {
  const validatedParams = getReleaseSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  const release = await releaseApi.getRelease(project, validatedParams.releaseId);

  if (!release) {
    throw new Error(`Release ${validatedParams.releaseId} not found`);
  }

  return {
    id: release.id || 0,
    name: release.name || "",
    status: getStatusString(release.status),
    definitionId: release.releaseDefinition?.id || 0,
    definitionName: release.releaseDefinition?.name || "",
    description: release.description,
    reason: getReasonString(release.reason),
    createdBy: release.createdBy?.displayName || "",
    createdOn: release.createdOn?.toISOString(),
    modifiedBy: release.modifiedBy?.displayName || "",
    modifiedOn: release.modifiedOn?.toISOString(),
    environments: (release.environments || []).map((env) => ({
      id: env.id || 0,
      name: env.name || "",
      status: getEnvironmentStatusString(env.status),
      rank: env.rank || 0,
      deploySteps: (env.deploySteps || []).map((step) => ({
        id: step.id || 0,
        status: getDeploymentStatusString(step.status),
        reason: getDeploymentReasonString(step.reason),
        attempt: step.attempt || 0,
      })),
    })),
    artifacts: (release.artifacts || []).map((art) => ({
      alias: art.alias || "",
      type: art.type || "",
      version: art.definitionReference?.version?.id || "",
      sourceId: art.sourceId || "",
    })),
    url: release.url || "",
  };
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

function getReasonString(reason?: ReleaseInterfaces.ReleaseReason): string {
  switch (reason) {
    case ReleaseInterfaces.ReleaseReason.Manual:
      return "manual";
    case ReleaseInterfaces.ReleaseReason.ContinuousIntegration:
      return "continuousIntegration";
    case ReleaseInterfaces.ReleaseReason.Schedule:
      return "schedule";
    case ReleaseInterfaces.ReleaseReason.PullRequest:
      return "pullRequest";
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

function getDeploymentStatusString(status?: ReleaseInterfaces.DeploymentStatus): string {
  switch (status) {
    case ReleaseInterfaces.DeploymentStatus.NotDeployed:
      return "notDeployed";
    case ReleaseInterfaces.DeploymentStatus.InProgress:
      return "inProgress";
    case ReleaseInterfaces.DeploymentStatus.Succeeded:
      return "succeeded";
    case ReleaseInterfaces.DeploymentStatus.PartiallySucceeded:
      return "partiallySucceeded";
    case ReleaseInterfaces.DeploymentStatus.Failed:
      return "failed";
    default:
      return "unknown";
  }
}

function getDeploymentReasonString(reason?: ReleaseInterfaces.DeploymentReason): string {
  switch (reason) {
    case ReleaseInterfaces.DeploymentReason.Manual:
      return "manual";
    case ReleaseInterfaces.DeploymentReason.Automated:
      return "automated";
    case ReleaseInterfaces.DeploymentReason.Scheduled:
      return "scheduled";
    case ReleaseInterfaces.DeploymentReason.RedeployTrigger:
      return "redeployTrigger";
    default:
      return "unknown";
  }
}
