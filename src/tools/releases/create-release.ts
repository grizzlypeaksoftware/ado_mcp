import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const createReleaseSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  definitionId: z.number().describe("Release definition ID"),
  description: z.string().optional().describe("Release description"),
  artifacts: z
    .array(
      z.object({
        alias: z.string(),
        version: z.string(),
      })
    )
    .optional()
    .describe("Artifact versions to use"),
  isDraft: z.boolean().default(false).describe("Create as draft"),
  variables: z.record(z.string()).optional().describe("Release variables"),
});

export const createReleaseTool = {
  name: "create_release",
  description: "Create a new release from a release definition. Optionally specify artifact versions, set as draft, or pass release variables. The release can then be deployed to environments manually or automatically based on triggers. Returns the created release ID and name.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      definitionId: {
        type: "number",
        description: "Release definition ID",
      },
      description: {
        type: "string",
        description: "Release description",
      },
      artifacts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            alias: { type: "string" },
            version: { type: "string" },
          },
          required: ["alias", "version"],
        },
        description: "Artifact versions to use",
      },
      isDraft: {
        type: "boolean",
        description: "Create as draft",
      },
      variables: {
        type: "object",
        additionalProperties: { type: "string" },
        description: "Release variables",
      },
    },
    required: ["definitionId"],
  },
};

export interface CreateReleaseResult {
  id: number;
  name: string;
  status: string;
  url: string;
  message: string;
}

export async function createRelease(
  client: AdoClient,
  params: z.infer<typeof createReleaseSchema>
): Promise<CreateReleaseResult> {
  const validatedParams = createReleaseSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Build release start metadata
  const releaseStartMetadata: ReleaseInterfaces.ReleaseStartMetadata = {
    definitionId: validatedParams.definitionId,
    description: validatedParams.description,
    isDraft: validatedParams.isDraft,
  };

  // Add artifact versions if specified
  if (validatedParams.artifacts && validatedParams.artifacts.length > 0) {
    releaseStartMetadata.artifacts = validatedParams.artifacts.map((art) => ({
      alias: art.alias,
      instanceReference: {
        id: art.version,
        name: art.version,
      },
    }));
  }

  // Add variables if specified
  if (validatedParams.variables) {
    releaseStartMetadata.variables = {};
    for (const [key, value] of Object.entries(validatedParams.variables)) {
      releaseStartMetadata.variables[key] = { value };
    }
  }

  const release = await releaseApi.createRelease(releaseStartMetadata, project);

  if (!release) {
    throw new Error("Failed to create release");
  }

  return {
    id: release.id || 0,
    name: release.name || "",
    status: validatedParams.isDraft ? "draft" : "active",
    url: release.url || "",
    message: `Successfully created release ${release.name}`,
  };
}
