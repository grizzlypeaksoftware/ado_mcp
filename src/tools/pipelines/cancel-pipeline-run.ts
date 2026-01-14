import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const cancelPipelineRunSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
  runId: z.number().describe("Run ID"),
});

export const cancelPipelineRunTool = {
  name: "cancel_pipeline_run",
  description: "Cancel an in-progress pipeline run. The run will transition to 'cancelling' status and then 'canceled' once all active tasks stop. Use this to abort builds that are no longer needed or are stuck.",
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
    },
    required: ["pipelineId", "runId"],
  },
};

export interface CancelPipelineRunResult {
  success: boolean;
  id: number;
  status: string;
  message: string;
}

export async function cancelPipelineRun(
  client: AdoClient,
  params: z.infer<typeof cancelPipelineRunSchema>
): Promise<CancelPipelineRunResult> {
  const validatedParams = cancelPipelineRunSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  // Update the build status to cancelling
  const build: BuildInterfaces.Build = {
    id: validatedParams.runId,
    status: BuildInterfaces.BuildStatus.Cancelling,
  };

  const updatedBuild = await buildApi.updateBuild(build, project, validatedParams.runId);

  if (!updatedBuild) {
    throw new Error(`Failed to cancel pipeline run ${validatedParams.runId}`);
  }

  return {
    success: true,
    id: validatedParams.runId,
    status: "cancelling",
    message: `Successfully requested cancellation of pipeline run ${validatedParams.runId}`,
  };
}
