import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getPipelineSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
});

export const getPipelineTool = {
  name: "get_pipeline",
  description: "Get details for a specific pipeline",
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
    },
    required: ["pipelineId"],
  },
};

export interface PipelineDetails {
  id: number;
  name: string;
  folder: string;
  revision: number;
  createdDate?: string;
  queueId?: number;
  queueName?: string;
  repositoryId?: string;
  repositoryName?: string;
  repositoryType?: string;
  defaultBranch?: string;
  yamlFilename?: string;
  url: string;
}

export async function getPipeline(
  client: AdoClient,
  params: z.infer<typeof getPipelineSchema>
): Promise<PipelineDetails> {
  const validatedParams = getPipelineSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  const definition = await buildApi.getDefinition(
    project,
    validatedParams.pipelineId
  );

  if (!definition) {
    throw new Error(`Pipeline ${validatedParams.pipelineId} not found`);
  }

  return {
    id: definition.id || 0,
    name: definition.name || "",
    folder: definition.path || "\\",
    revision: definition.revision || 0,
    createdDate: definition.createdDate?.toISOString(),
    queueId: definition.queue?.id,
    queueName: definition.queue?.name,
    repositoryId: definition.repository?.id,
    repositoryName: definition.repository?.name,
    repositoryType: definition.repository?.type,
    defaultBranch: definition.repository?.defaultBranch,
    yamlFilename: (definition.process as any)?.yamlFilename,
    url: definition.url || "",
  };
}
