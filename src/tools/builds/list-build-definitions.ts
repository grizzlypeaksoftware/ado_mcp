import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listBuildDefinitionsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  path: z.string().optional().describe("Filter by folder path"),
});

export const listBuildDefinitionsTool = {
  name: "list_build_definitions",
  description: "List classic build definitions",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      path: {
        type: "string",
        description: "Filter by folder path",
      },
    },
    required: [],
  },
};

export interface BuildDefinitionSummary {
  id: number;
  name: string;
  path: string;
  type: string;
  queueStatus: string;
  url: string;
}

export async function listBuildDefinitions(
  client: AdoClient,
  params: z.infer<typeof listBuildDefinitionsSchema>
): Promise<BuildDefinitionSummary[]> {
  const validatedParams = listBuildDefinitionsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

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
    validatedParams.path // path
  );

  if (!definitions) {
    return [];
  }

  return definitions.map((def) => ({
    id: def.id || 0,
    name: def.name || "",
    path: def.path || "\\",
    type: def.type !== undefined ? String(def.type) : "build",
    queueStatus: def.queueStatus !== undefined ? String(def.queueStatus) : "enabled",
    url: def.url || "",
  }));
}
