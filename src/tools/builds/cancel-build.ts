import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const cancelBuildSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  buildId: z.number().describe("Build ID"),
});

export const cancelBuildTool = {
  name: "cancel_build",
  description: "Cancel a running build",
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

export interface CancelBuildResult {
  success: boolean;
  id: number;
  status: string;
  message: string;
}

export async function cancelBuild(
  client: AdoClient,
  params: z.infer<typeof cancelBuildSchema>
): Promise<CancelBuildResult> {
  const validatedParams = cancelBuildSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  const build: BuildInterfaces.Build = {
    id: validatedParams.buildId,
    status: BuildInterfaces.BuildStatus.Cancelling,
  };

  const updatedBuild = await buildApi.updateBuild(build, project, validatedParams.buildId);

  if (!updatedBuild) {
    throw new Error(`Failed to cancel build ${validatedParams.buildId}`);
  }

  return {
    success: true,
    id: validatedParams.buildId,
    status: "cancelling",
    message: `Successfully requested cancellation of build ${validatedParams.buildId}`,
  };
}
