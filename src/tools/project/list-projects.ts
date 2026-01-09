import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { ProjectInfo } from "../../types.js";

export const listProjectsSchema = z.object({
  stateFilter: z
    .enum(["wellFormed", "createPending", "deleting", "new", "all"])
    .default("all")
    .describe("Filter by project state"),
});

export const listProjectsTool = {
  name: "list_projects",
  description: "List all projects in the organization",
  inputSchema: {
    type: "object" as const,
    properties: {
      stateFilter: {
        type: "string",
        enum: ["wellFormed", "createPending", "deleting", "new", "all"],
        description: "Filter by project state, default 'all'",
      },
    },
    required: [],
  },
};

export async function listProjects(
  client: AdoClient,
  params: z.infer<typeof listProjectsSchema>
): Promise<ProjectInfo[]> {
  const validatedParams = listProjectsSchema.parse(params);

  const coreApi = await client.getCoreApi();

  // Map state filter to API enum
  let stateFilter;
  switch (validatedParams.stateFilter) {
    case "wellFormed":
      stateFilter = 0;
      break;
    case "createPending":
      stateFilter = 1;
      break;
    case "deleting":
      stateFilter = 2;
      break;
    case "new":
      stateFilter = 3;
      break;
    default:
      stateFilter = undefined; // All
  }

  const projects = await coreApi.getProjects(stateFilter);

  if (!projects) {
    return [];
  }

  return projects.map((project) => ({
    id: project.id || "",
    name: project.name || "",
    description: project.description,
    state: project.state !== undefined ? String(project.state) : "",
    url: project.url || "",
  }));
}
