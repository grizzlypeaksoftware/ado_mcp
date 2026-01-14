import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as BuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export const runPipelineSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
  branch: z.string().optional().describe("Branch to run on"),
  variables: z.record(z.string()).optional().describe("Runtime variables to set"),
  parameters: z.record(z.string()).optional().describe("Pipeline parameters"),
  stagesToSkip: z.array(z.string()).optional().describe("Stages to skip"),
});

export const runPipelineTool = {
  name: "run_pipeline",
  description: "Trigger a new pipeline run (build). Can specify branch, set runtime variables, pass template parameters, or skip specific stages. Returns the queued build ID and number. Use this to manually kick off CI/CD pipelines.",
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
        description: "Branch to run on",
      },
      variables: {
        type: "object",
        additionalProperties: { type: "string" },
        description: "Runtime variables to set",
      },
      parameters: {
        type: "object",
        additionalProperties: { type: "string" },
        description: "Pipeline parameters",
      },
      stagesToSkip: {
        type: "array",
        items: { type: "string" },
        description: "Stages to skip",
      },
    },
    required: ["pipelineId"],
  },
};

export interface RunPipelineResult {
  id: number;
  buildNumber: string;
  status: string;
  sourceBranch: string;
  url: string;
  message: string;
}

export async function runPipeline(
  client: AdoClient,
  params: z.infer<typeof runPipelineSchema>
): Promise<RunPipelineResult> {
  const validatedParams = runPipelineSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  // Build the queue request
  const build: BuildInterfaces.Build = {
    definition: {
      id: validatedParams.pipelineId,
    },
  };

  if (validatedParams.branch) {
    build.sourceBranch = `refs/heads/${validatedParams.branch}`;
  }

  // Add variables if specified
  if (validatedParams.variables) {
    build.parameters = JSON.stringify(validatedParams.variables);
  }

  // Add template parameters if specified
  if (validatedParams.parameters) {
    build.templateParameters = validatedParams.parameters;
  }

  // Add stages to skip if specified (cast to any as not in type defs)
  if (validatedParams.stagesToSkip && validatedParams.stagesToSkip.length > 0) {
    (build as any).stagesToSkip = validatedParams.stagesToSkip;
  }

  const queuedBuild = await buildApi.queueBuild(build, project);

  if (!queuedBuild) {
    throw new Error("Failed to queue pipeline run");
  }

  return {
    id: queuedBuild.id || 0,
    buildNumber: queuedBuild.buildNumber || "",
    status: "notStarted",
    sourceBranch: queuedBuild.sourceBranch?.replace("refs/heads/", "") || "",
    url: queuedBuild.url || "",
    message: `Successfully queued pipeline run ${queuedBuild.buildNumber}`,
  };
}
