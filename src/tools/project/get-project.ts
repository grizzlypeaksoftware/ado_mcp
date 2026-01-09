import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getProjectSchema = z.object({
  project: z.string().describe("Project name or ID"),
  includeCapabilities: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include version control and process template info"),
});

export const getProjectTool = {
  name: "get_project",
  description: "Get details for a specific project",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name or ID",
      },
      includeCapabilities: {
        type: "boolean",
        description: "Include version control and process template info",
      },
    },
    required: ["project"],
  },
};

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  state: string;
  url: string;
  visibility?: string;
  capabilities?: {
    versionControl?: {
      type: string;
    };
    processTemplate?: {
      name: string;
    };
  };
  defaultTeam?: {
    id: string;
    name: string;
  };
}

export async function getProject(
  client: AdoClient,
  params: z.infer<typeof getProjectSchema>
): Promise<ProjectDetails> {
  const validatedParams = getProjectSchema.parse(params);

  const coreApi = await client.getCoreApi();

  const project = await coreApi.getProject(
    validatedParams.project,
    validatedParams.includeCapabilities
  );

  if (!project) {
    throw new Error(`Project '${validatedParams.project}' not found`);
  }

  const result: ProjectDetails = {
    id: project.id || "",
    name: project.name || "",
    description: project.description,
    state: project.state !== undefined ? String(project.state) : "",
    url: project.url || "",
    visibility: project.visibility !== undefined ? String(project.visibility) : undefined,
  };

  if (validatedParams.includeCapabilities && project.capabilities) {
    result.capabilities = {
      versionControl: project.capabilities.versioncontrol
        ? { type: project.capabilities.versioncontrol.sourceControlType || "" }
        : undefined,
      processTemplate: project.capabilities.processTemplate
        ? { name: project.capabilities.processTemplate.templateName || "" }
        : undefined,
    };
  }

  if (project.defaultTeam) {
    result.defaultTeam = {
      id: project.defaultTeam.id || "",
      name: project.defaultTeam.name || "",
    };
  }

  return result;
}
