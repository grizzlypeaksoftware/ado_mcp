import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listReleaseDefinitionsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  searchText: z.string().optional().describe("Filter by name"),
  path: z.string().optional().describe("Filter by folder path"),
});

export const listReleaseDefinitionsTool = {
  name: "list_release_definitions",
  description: "List release definitions",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      searchText: {
        type: "string",
        description: "Filter by name",
      },
      path: {
        type: "string",
        description: "Filter by folder path",
      },
    },
    required: [],
  },
};

export interface ReleaseDefinitionSummary {
  id: number;
  name: string;
  path: string;
  description?: string;
  createdBy: string;
  createdOn?: string;
  url: string;
}

export async function listReleaseDefinitions(
  client: AdoClient,
  params: z.infer<typeof listReleaseDefinitionsSchema>
): Promise<ReleaseDefinitionSummary[]> {
  const validatedParams = listReleaseDefinitionsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  const definitions = await releaseApi.getReleaseDefinitions(
    project,
    validatedParams.searchText,
    undefined, // expand
    undefined, // artifactType
    undefined, // artifactSourceId
    undefined, // top
    undefined, // continuationToken
    undefined, // queryOrder
    validatedParams.path
  );

  if (!definitions) {
    return [];
  }

  return definitions.map((def) => ({
    id: def.id || 0,
    name: def.name || "",
    path: def.path || "\\",
    description: def.description,
    createdBy: def.createdBy?.displayName || "",
    createdOn: def.createdOn?.toISOString(),
    url: def.url || "",
  }));
}
