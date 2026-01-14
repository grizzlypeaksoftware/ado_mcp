import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getReleaseDefinitionSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  definitionId: z.number().describe("Definition ID"),
});

export const getReleaseDefinitionTool = {
  name: "get_release_definition",
  description: "Get detailed configuration for a release definition. Returns environments (deployment stages) with their conditions, artifacts (build sources), and triggers (CI/scheduled). Use this to understand the release pipeline structure before creating releases.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      definitionId: {
        type: "number",
        description: "Definition ID",
      },
    },
    required: ["definitionId"],
  },
};

export interface ReleaseDefinitionDetails {
  id: number;
  name: string;
  path: string;
  description?: string;
  revision: number;
  createdBy: string;
  createdOn?: string;
  modifiedBy: string;
  modifiedOn?: string;
  environments: Array<{
    id: number;
    name: string;
    rank: number;
    conditions: Array<{
      conditionType: string;
      name: string;
    }>;
  }>;
  artifacts: Array<{
    alias: string;
    type: string;
    sourceId: string;
  }>;
  triggers: Array<{
    triggerType: string;
  }>;
  url: string;
}

export async function getReleaseDefinition(
  client: AdoClient,
  params: z.infer<typeof getReleaseDefinitionSchema>
): Promise<ReleaseDefinitionDetails> {
  const validatedParams = getReleaseDefinitionSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  const definition = await releaseApi.getReleaseDefinition(
    project,
    validatedParams.definitionId
  );

  if (!definition) {
    throw new Error(`Release definition ${validatedParams.definitionId} not found`);
  }

  return {
    id: definition.id || 0,
    name: definition.name || "",
    path: definition.path || "\\",
    description: definition.description,
    revision: definition.revision || 0,
    createdBy: definition.createdBy?.displayName || "",
    createdOn: definition.createdOn?.toISOString(),
    modifiedBy: definition.modifiedBy?.displayName || "",
    modifiedOn: definition.modifiedOn?.toISOString(),
    environments: (definition.environments || []).map((env) => ({
      id: env.id || 0,
      name: env.name || "",
      rank: env.rank || 0,
      conditions: (env.conditions || []).map((cond) => ({
        conditionType: String(cond.conditionType || ""),
        name: cond.name || "",
      })),
    })),
    artifacts: (definition.artifacts || []).map((art) => ({
      alias: art.alias || "",
      type: art.type || "",
      sourceId: art.sourceId || "",
    })),
    triggers: (definition.triggers || []).map((trigger) => ({
      triggerType: String(trigger.triggerType || ""),
    })),
    url: definition.url || "",
  };
}
