import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const listPipelineRunsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
  branch: z.string().optional().describe("Filter by branch"),
  status: z
    .enum(["inProgress", "completed", "cancelling", "postponed", "notStarted", "all"])
    .optional()
    .describe("Filter by status"),
  result: z
    .enum(["succeeded", "failed", "canceled"])
    .optional()
    .describe("Filter by result"),
  maxResults: z.number().default(50).describe("Limit results, default 50"),
});

export const listPipelineRunsTool = {
  name: "list_pipeline_runs",
  description: "List runs for a pipeline",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      pipelineId: {
        type: "number",
        description: "Pipeline ID",
      },
      branch: {
        type: "string",
        description: "Filter by branch",
      },
      status: {
        type: "string",
        enum: ["inProgress", "completed", "cancelling", "postponed", "notStarted", "all"],
        description: "Filter by status",
      },
      result: {
        type: "string",
        enum: ["succeeded", "failed", "canceled"],
        description: "Filter by result",
      },
      maxResults: {
        type: "number",
        description: "Limit results, default 50",
      },
    },
    required: ["pipelineId"],
  },
};

export interface PipelineRun {
  id: number;
  buildNumber: string;
  status: string;
  result?: string;
  sourceBranch: string;
  sourceVersion: string;
  queueTime?: string;
  startTime?: string;
  finishTime?: string;
  requestedBy: string;
  url: string;
}

export async function listPipelineRuns(
  client: AdoClient,
  params: z.infer<typeof listPipelineRunsSchema>
): Promise<PipelineRun[]> {
  const validatedParams = listPipelineRunsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  // Map status
  let statusFilter: BuildInterfaces.BuildStatus | undefined;
  if (validatedParams.status && validatedParams.status !== "all") {
    switch (validatedParams.status) {
      case "inProgress":
        statusFilter = BuildInterfaces.BuildStatus.InProgress;
        break;
      case "completed":
        statusFilter = BuildInterfaces.BuildStatus.Completed;
        break;
      case "cancelling":
        statusFilter = BuildInterfaces.BuildStatus.Cancelling;
        break;
      case "postponed":
        statusFilter = BuildInterfaces.BuildStatus.Postponed;
        break;
      case "notStarted":
        statusFilter = BuildInterfaces.BuildStatus.NotStarted;
        break;
    }
  }

  // Map result
  let resultFilter: BuildInterfaces.BuildResult | undefined;
  if (validatedParams.result) {
    switch (validatedParams.result) {
      case "succeeded":
        resultFilter = BuildInterfaces.BuildResult.Succeeded;
        break;
      case "failed":
        resultFilter = BuildInterfaces.BuildResult.Failed;
        break;
      case "canceled":
        resultFilter = BuildInterfaces.BuildResult.Canceled;
        break;
    }
  }

  const builds = await buildApi.getBuilds(
    project,
    [validatedParams.pipelineId], // definitions
    undefined, // queues
    undefined, // buildNumber
    undefined, // minTime
    undefined, // maxTime
    undefined, // requestedFor
    undefined, // reasonFilter
    statusFilter,
    resultFilter,
    undefined, // tagFilters
    undefined, // properties
    validatedParams.maxResults, // top
    undefined, // continuationToken
    undefined, // maxBuildsPerDefinition
    undefined, // deletedFilter
    undefined, // queryOrder
    validatedParams.branch ? `refs/heads/${validatedParams.branch}` : undefined // branchName
  );

  if (!builds) {
    return [];
  }

  return builds.map((build) => ({
    id: build.id || 0,
    buildNumber: build.buildNumber || "",
    status: getStatusString(build.status),
    result: getResultString(build.result),
    sourceBranch: build.sourceBranch?.replace("refs/heads/", "") || "",
    sourceVersion: build.sourceVersion || "",
    queueTime: build.queueTime?.toISOString(),
    startTime: build.startTime?.toISOString(),
    finishTime: build.finishTime?.toISOString(),
    requestedBy: build.requestedBy?.displayName || "",
    url: build.url || "",
  }));
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
    case BuildInterfaces.BuildStatus.None:
      return "none";
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
