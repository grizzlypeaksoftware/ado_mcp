import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const deployReleaseSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  releaseId: z.number().describe("Release ID"),
  environmentId: z.number().describe("Environment ID"),
  comment: z.string().optional().describe("Deployment comment"),
});

export const deployReleaseTool = {
  name: "deploy_release",
  description: "Deploy a release to an environment",
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
      comment: {
        type: "string",
        description: "Deployment comment",
      },
    },
    required: ["releaseId", "environmentId"],
  },
};

export interface DeployReleaseResult {
  id: number;
  releaseId: number;
  environmentId: number;
  status: string;
  message: string;
}

export async function deployRelease(
  client: AdoClient,
  params: z.infer<typeof deployReleaseSchema>
): Promise<DeployReleaseResult> {
  const validatedParams = deployReleaseSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Update the environment to trigger deployment
  const environmentUpdate: ReleaseInterfaces.ReleaseEnvironmentUpdateMetadata = {
    status: ReleaseInterfaces.EnvironmentStatus.InProgress,
    comment: validatedParams.comment,
  };

  const updatedEnvironment = await releaseApi.updateReleaseEnvironment(
    environmentUpdate,
    project,
    validatedParams.releaseId,
    validatedParams.environmentId
  );

  if (!updatedEnvironment) {
    throw new Error(
      `Failed to deploy release ${validatedParams.releaseId} to environment ${validatedParams.environmentId}`
    );
  }

  return {
    id: updatedEnvironment.id || 0,
    releaseId: validatedParams.releaseId,
    environmentId: validatedParams.environmentId,
    status: "inProgress",
    message: `Successfully triggered deployment of release ${validatedParams.releaseId} to environment ${validatedParams.environmentId}`,
  };
}
