import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const getPipelineRunSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
  runId: z.number().describe("Run ID"),
  includeLogs: z.boolean().default(false).describe("Include log references, default false"),
});

export const getPipelineRunTool = {
  name: "get_pipeline_run",
  description: "Get details for a specific pipeline run",
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
      runId: {
        type: "number",
        description: "Run ID",
      },
      includeLogs: {
        type: "boolean",
        description: "Include log references, default false",
      },
    },
    required: ["pipelineId", "runId"],
  },
};

export interface PipelineRunDetails {
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
  requestedFor: string;
  reason: string;
  priority: string;
  repository?: {
    id: string;
    name: string;
    type: string;
  };
  logs?: Array<{
    id: number;
    type: string;
    url: string;
  }>;
  timeline?: Array<{
    id: string;
    name: string;
    type: string;
    state: string;
    result?: string;
    startTime?: string;
    finishTime?: string;
  }>;
  url: string;
}

export async function getPipelineRun(
  client: AdoClient,
  params: z.infer<typeof getPipelineRunSchema>
): Promise<PipelineRunDetails> {
  const validatedParams = getPipelineRunSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  const build = await buildApi.getBuild(project, validatedParams.runId);

  if (!build) {
    throw new Error(`Pipeline run ${validatedParams.runId} not found`);
  }

  const result: PipelineRunDetails = {
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
    requestedFor: build.requestedFor?.displayName || "",
    reason: getReasonString(build.reason),
    priority: getPriorityString(build.priority),
    url: build.url || "",
  };

  if (build.repository) {
    result.repository = {
      id: build.repository.id || "",
      name: build.repository.name || "",
      type: build.repository.type || "",
    };
  }

  // Get timeline (stages/jobs/tasks)
  const timeline = await buildApi.getBuildTimeline(project, validatedParams.runId);
  if (timeline && timeline.records) {
    result.timeline = timeline.records.map((record) => ({
      id: record.id || "",
      name: record.name || "",
      type: record.type || "",
      state: getTimelineStateString(record.state),
      result: getTaskResultString(record.result),
      startTime: record.startTime?.toISOString(),
      finishTime: record.finishTime?.toISOString(),
    }));
  }

  // Get logs if requested
  if (validatedParams.includeLogs) {
    const logs = await buildApi.getBuildLogs(project, validatedParams.runId);
    if (logs) {
      result.logs = logs.map((log) => ({
        id: log.id || 0,
        type: log.type || "",
        url: log.url || "",
      }));
    }
  }

  return result;
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

function getTimelineStateString(state?: BuildInterfaces.TimelineRecordState): string {
  switch (state) {
    case BuildInterfaces.TimelineRecordState.Pending:
      return "pending";
    case BuildInterfaces.TimelineRecordState.InProgress:
      return "inProgress";
    case BuildInterfaces.TimelineRecordState.Completed:
      return "completed";
    default:
      return "unknown";
  }
}

function getTaskResultString(result?: BuildInterfaces.TaskResult): string | undefined {
  switch (result) {
    case BuildInterfaces.TaskResult.Succeeded:
      return "succeeded";
    case BuildInterfaces.TaskResult.SucceededWithIssues:
      return "succeededWithIssues";
    case BuildInterfaces.TaskResult.Failed:
      return "failed";
    case BuildInterfaces.TaskResult.Canceled:
      return "canceled";
    case BuildInterfaces.TaskResult.Skipped:
      return "skipped";
    case BuildInterfaces.TaskResult.Abandoned:
      return "abandoned";
    default:
      return undefined;
  }
}
