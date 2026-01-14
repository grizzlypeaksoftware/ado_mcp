import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const getBuildSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  buildId: z.number().describe("Build ID"),
});

export const getBuildTool = {
  name: "get_build",
  description: "Get detailed information about a specific build by ID. Returns status, result, source info (branch, commit), timing, trigger reason, priority, repository details, and log references. Use this to inspect build details or find logs for troubleshooting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      buildId: {
        type: "number",
        description: "Build ID",
      },
    },
    required: ["buildId"],
  },
};

export interface BuildDetails {
  id: number;
  buildNumber: string;
  definitionId: number;
  definitionName: string;
  status: string;
  result?: string;
  sourceBranch: string;
  sourceVersion: string;
  queueTime?: string;
  startTime?: string;
  finishTime?: string;
  requestedBy: string;
  requestedFor: string;
  reason: string;
  priority: string;
  retainedByRelease: boolean;
  repository?: {
    id: string;
    name: string;
    type: string;
  };
  logs?: {
    id: number;
    url: string;
  };
  url: string;
}

export async function getBuild(
  client: AdoClient,
  params: z.infer<typeof getBuildSchema>
): Promise<BuildDetails> {
  const validatedParams = getBuildSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  const build = await buildApi.getBuild(project, validatedParams.buildId);

  if (!build) {
    throw new Error(`Build ${validatedParams.buildId} not found`);
  }

  return {
    id: build.id || 0,
    buildNumber: build.buildNumber || "",
    definitionId: build.definition?.id || 0,
    definitionName: build.definition?.name || "",
    status: getStatusString(build.status),
    result: getResultString(build.result),
    sourceBranch: build.sourceBranch?.replace("refs/heads/", "") || "",
    sourceVersion: build.sourceVersion || "",
    queueTime: build.queueTime?.toISOString(),
    startTime: build.startTime?.toISOString(),
    finishTime: build.finishTime?.toISOString(),
    requestedBy: build.requestedBy?.displayName || "",
    requestedFor: build.requestedFor?.displayName || "",
    reason: getReasonString(build.reason),
    priority: getPriorityString(build.priority),
    retainedByRelease: build.retainedByRelease || false,
    repository: build.repository
      ? {
          id: build.repository.id || "",
          name: build.repository.name || "",
          type: build.repository.type || "",
        }
      : undefined,
    logs: build.logs
      ? {
          id: build.logs.id || 0,
          url: build.logs.url || "",
        }
      : undefined,
    url: build.url || "",
  };
}

function getStatusString(status?: BuildInterfaces.BuildStatus): string {
  switch (status) {
    case BuildInterfaces.BuildStatus.InProgress:
      return "inProgress";
    case BuildInterfaces.BuildStatus.Completed:
      return "completed";
    case BuildInterfaces.BuildStatus.Cancelling:
      return "cancelling";
    case BuildInterfaces.BuildStatus.Postponed:
      return "postponed";
    case BuildInterfaces.BuildStatus.NotStarted:
      return "notStarted";
    default:
      return "unknown";
  }
}

function getResultString(result?: BuildInterfaces.BuildResult): string | undefined {
  switch (result) {
    case BuildInterfaces.BuildResult.Succeeded:
      return "succeeded";
    case BuildInterfaces.BuildResult.PartiallySucceeded:
      return "partiallySucceeded";
    case BuildInterfaces.BuildResult.Failed:
      return "failed";
    case BuildInterfaces.BuildResult.Canceled:
      return "canceled";
    default:
      return undefined;
  }
}

function getReasonString(reason?: BuildInterfaces.BuildReason): string {
  switch (reason) {
    case BuildInterfaces.BuildReason.Manual:
      return "manual";
    case BuildInterfaces.BuildReason.IndividualCI:
      return "continuousIntegration";
    case BuildInterfaces.BuildReason.BatchedCI:
      return "batchedCI";
    case BuildInterfaces.BuildReason.Schedule:
      return "schedule";
    case BuildInterfaces.BuildReason.PullRequest:
      return "pullRequest";
    default:
      return "unknown";
  }
}

function getPriorityString(priority?: BuildInterfaces.QueuePriority): string {
  switch (priority) {
    case BuildInterfaces.QueuePriority.Low:
      return "low";
    case BuildInterfaces.QueuePriority.BelowNormal:
      return "belowNormal";
    case BuildInterfaces.QueuePriority.Normal:
      return "normal";
    case BuildInterfaces.QueuePriority.AboveNormal:
      return "aboveNormal";
    case BuildInterfaces.QueuePriority.High:
      return "high";
    default:
      return "normal";
  }
}
