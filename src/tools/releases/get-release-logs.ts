import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getReleaseLogsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  releaseId: z.number().describe("Release ID"),
  environmentId: z.number().describe("Environment ID"),
});

export const getReleaseLogsTool = {
  name: "get_release_logs",
  description: "Get logs for a release deployment",
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

export interface ReleaseLogsResult {
  releaseId: number;
  environmentId: number;
  logs: Array<{
    taskId: number;
    taskName: string;
    logUrl: string;
  }>;
}

export async function getReleaseLogs(
  client: AdoClient,
  params: z.infer<typeof getReleaseLogsSchema>
): Promise<ReleaseLogsResult> {
  const validatedParams = getReleaseLogsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Get the release to find the environment
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

  // Get logs from deploy steps
  const logs: Array<{ taskId: number; taskName: string; logUrl: string }> = [];

  for (const deployStep of environment.deploySteps || []) {
    for (const phase of deployStep.releaseDeployPhases || []) {
      for (const task of phase.deploymentJobs || []) {
        for (const taskInstance of task.tasks || []) {
          if (taskInstance.logUrl) {
            logs.push({
              taskId: taskInstance.id || 0,
              taskName: taskInstance.name || "",
              logUrl: taskInstance.logUrl,
            });
          }
        }
      }
    }
  }

  return {
    releaseId: validatedParams.releaseId,
    environmentId: validatedParams.environmentId,
    logs,
  };
}
