import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const getReleaseEnvironmentSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  releaseId: z.number().describe("Release ID"),
  environmentId: z.number().describe("Environment ID"),
});

export const getReleaseEnvironmentTool = {
  name: "get_release_environment",
  description: "Get detailed status of a specific environment (stage) within a release. Returns deployment steps with phases/tasks, pre and post-deployment approval status, and approvers. Use this to check deployment progress, see pending approvals, or investigate deployment failures.",
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
      environmentId: {
        type: "number",
        description: "Environment ID",
      },
    },
    required: ["releaseId", "environmentId"],
  },
};

export interface ReleaseEnvironmentDetails {
  id: number;
  name: string;
  status: string;
  rank: number;
  releaseId: number;
  releaseName: string;
  deploySteps: Array<{
    id: number;
    status: string;
    reason: string;
    attempt: number;
    operationStatus: string;
    runPlanId?: string;
    releaseDeployPhases: Array<{
      id: number;
      name: string;
      status: string;
      rank: number;
    }>;
  }>;
  preDeployApprovals: Array<{
    id: number;
    status: string;
    approver: string;
    isAutomated: boolean;
    comments?: string;
  }>;
  postDeployApprovals: Array<{
    id: number;
    status: string;
    approver: string;
    isAutomated: boolean;
    comments?: string;
  }>;
}

export async function getReleaseEnvironment(
  client: AdoClient,
  params: z.infer<typeof getReleaseEnvironmentSchema>
): Promise<ReleaseEnvironmentDetails> {
  const validatedParams = getReleaseEnvironmentSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Get the full release to find the environment
  const release = await releaseApi.getRelease(project, validatedParams.releaseId);

  if (!release) {
    throw new Error(`Release ${validatedParams.releaseId} not found`);
  }

  const environment = release.environments?.find(
    (env) => env.id === validatedParams.environmentId
  );

  if (!environment) {
    throw new Error(
      `Environment ${validatedParams.environmentId} not found in release ${validatedParams.releaseId}`
    );
  }

  return {
    id: environment.id || 0,
    name: environment.name || "",
    status: getEnvironmentStatusString(environment.status),
    rank: environment.rank || 0,
    releaseId: validatedParams.releaseId,
    releaseName: release.name || "",
    deploySteps: (environment.deploySteps || []).map((step) => ({
      id: step.id || 0,
      status: getDeploymentStatusString(step.status),
      reason: getDeploymentReasonString(step.reason),
      attempt: step.attempt || 0,
      operationStatus: getOperationStatusString(step.operationStatus),
      runPlanId: step.runPlanId,
      releaseDeployPhases: (step.releaseDeployPhases || []).map((phase) => ({
        id: phase.id || 0,
        name: phase.name || "",
        status: getDeployPhaseStatusString(phase.status),
        rank: phase.rank || 0,
      })),
    })),
    preDeployApprovals: (environment.preDeployApprovals || []).map((approval) => ({
      id: approval.id || 0,
      status: getApprovalStatusString(approval.status),
      approver: approval.approver?.displayName || "",
      isAutomated: approval.isAutomated || false,
      comments: approval.comments,
    })),
    postDeployApprovals: (environment.postDeployApprovals || []).map((approval) => ({
      id: approval.id || 0,
      status: getApprovalStatusString(approval.status),
      approver: approval.approver?.displayName || "",
      isAutomated: approval.isAutomated || false,
      comments: approval.comments,
    })),
  };
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

function getOperationStatusString(status?: ReleaseInterfaces.DeploymentOperationStatus): string {
  switch (status) {
    case ReleaseInterfaces.DeploymentOperationStatus.Pending:
      return "pending";
    case ReleaseInterfaces.DeploymentOperationStatus.Queued:
      return "queued";
    case ReleaseInterfaces.DeploymentOperationStatus.Scheduled:
      return "scheduled";
    case ReleaseInterfaces.DeploymentOperationStatus.Approved:
      return "approved";
    case ReleaseInterfaces.DeploymentOperationStatus.Rejected:
      return "rejected";
    case ReleaseInterfaces.DeploymentOperationStatus.Deferred:
      return "deferred";
    case ReleaseInterfaces.DeploymentOperationStatus.QueuedForAgent:
      return "queuedForAgent";
    case ReleaseInterfaces.DeploymentOperationStatus.PhaseInProgress:
      return "phaseInProgress";
    case ReleaseInterfaces.DeploymentOperationStatus.PhaseSucceeded:
      return "phaseSucceeded";
    case ReleaseInterfaces.DeploymentOperationStatus.PhasePartiallySucceeded:
      return "phasePartiallySucceeded";
    case ReleaseInterfaces.DeploymentOperationStatus.PhaseFailed:
      return "phaseFailed";
    case ReleaseInterfaces.DeploymentOperationStatus.Canceled:
      return "canceled";
    case ReleaseInterfaces.DeploymentOperationStatus.PhaseCanceled:
      return "phaseCanceled";
    case ReleaseInterfaces.DeploymentOperationStatus.ManualInterventionPending:
      return "manualInterventionPending";
    case ReleaseInterfaces.DeploymentOperationStatus.QueuedForPipeline:
      return "queuedForPipeline";
    default:
      return "unknown";
  }
}

function getDeployPhaseStatusString(status?: ReleaseInterfaces.DeployPhaseStatus): string {
  switch (status) {
    case ReleaseInterfaces.DeployPhaseStatus.NotStarted:
      return "notStarted";
    case ReleaseInterfaces.DeployPhaseStatus.InProgress:
      return "inProgress";
    case ReleaseInterfaces.DeployPhaseStatus.Succeeded:
      return "succeeded";
    case ReleaseInterfaces.DeployPhaseStatus.PartiallySucceeded:
      return "partiallySucceeded";
    case ReleaseInterfaces.DeployPhaseStatus.Failed:
      return "failed";
    case ReleaseInterfaces.DeployPhaseStatus.Canceled:
      return "canceled";
    case ReleaseInterfaces.DeployPhaseStatus.Skipped:
      return "skipped";
    default:
      return "unknown";
  }
}

function getApprovalStatusString(status?: ReleaseInterfaces.ApprovalStatus): string {
  switch (status) {
    case ReleaseInterfaces.ApprovalStatus.Pending:
      return "pending";
    case ReleaseInterfaces.ApprovalStatus.Approved:
      return "approved";
    case ReleaseInterfaces.ApprovalStatus.Rejected:
      return "rejected";
    case ReleaseInterfaces.ApprovalStatus.Reassigned:
      return "reassigned";
    case ReleaseInterfaces.ApprovalStatus.Canceled:
      return "canceled";
    case ReleaseInterfaces.ApprovalStatus.Skipped:
      return "skipped";
    default:
      return "unknown";
  }
}
