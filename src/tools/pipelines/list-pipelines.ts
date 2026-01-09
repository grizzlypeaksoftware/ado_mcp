import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listPipelinesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  folder: z.string().optional().describe("Filter by folder path"),
});

export const listPipelinesTool = {
  name: "list_pipelines",
  description: "List all pipelines in a project",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      folder: {
        type: "string",
        description: "Filter by folder path",
      },
    },
    required: [],
  },
};

export interface PipelineSummary {
  id: number;
  name: string;
  folder: string;
  url: string;
}

export async function listPipelines(
  client: AdoClient,
  params: z.infer<typeof listPipelinesSchema>
): Promise<PipelineSummary[]> {
  const validatedParams = listPipelinesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  // Get build definitions (pipelines)
  const definitions = await buildApi.getDefinitions(
    project,
    undefined, // name
    undefined, // repositoryId
    undefined, // repositoryType
    undefined, // queryOrder
    undefined, // top
    undefined, // continuationToken
    undefined, // minMetricsTime
    undefined, // definitionIds
    validatedParams.folder, // path
    undefined, // builtAfter
    undefined, // notBuiltAfter
    undefined, // includeAllProperties
    undefined, // includeLatestBuilds
    undefined  // taskIdFilter
  );

  if (!definitions) {
    return [];
  }

  return definitions.map((def) => ({
    id: def.id || 0,
    name: def.name || "",
    folder: def.path || "\\",
    url: def.url || "",
  }));
}
