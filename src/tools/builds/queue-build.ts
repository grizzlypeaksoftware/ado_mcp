import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const queueBuildSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  definitionId: z.number().describe("Build definition ID"),
  branch: z.string().optional().describe("Branch to build"),
  parameters: z.record(z.string()).optional().describe("Build parameters"),
});

export const queueBuildTool = {
  name: "queue_build",
  description: "Queue a new build",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      definitionId: {
        type: "number",
        description: "Build definition ID",
      },
      branch: {
        type: "string",
        description: "Branch to build",
      },
      parameters: {
        type: "object",
        additionalProperties: { type: "string" },
        description: "Build parameters",
      },
    },
    required: ["definitionId"],
  },
};

export interface QueueBuildResult {
  id: number;
  buildNumber: string;
  status: string;
  sourceBranch: string;
  url: string;
  message: string;
}

export async function queueBuild(
  client: AdoClient,
  params: z.infer<typeof queueBuildSchema>
): Promise<QueueBuildResult> {
  const validatedParams = queueBuildSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  const build: BuildInterfaces.Build = {
    definition: {
      id: validatedParams.definitionId,
    },
  };

  if (validatedParams.branch) {
    build.sourceBranch = `refs/heads/${validatedParams.branch}`;
  }

  if (validatedParams.parameters) {
    build.parameters = JSON.stringify(validatedParams.parameters);
  }

  const queuedBuild = await buildApi.queueBuild(build, project);

  if (!queuedBuild) {
    throw new Error("Failed to queue build");
  }

  return {
    id: queuedBuild.id || 0,
    buildNumber: queuedBuild.buildNumber || "",
    status: "notStarted",
    sourceBranch: queuedBuild.sourceBranch?.replace("refs/heads/", "") || "",
    url: queuedBuild.url || "",
    message: `Successfully queued build ${queuedBuild.buildNumber}`,
  };
}
