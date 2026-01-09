import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listTeamsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
});

export const listTeamsTool = {
  name: "list_teams",
  description: "List teams in a project",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
    },
    required: [],
  },
};

export interface TeamInfo {
  id: string;
  name: string;
  description?: string;
  url: string;
}

export async function listTeams(
  client: AdoClient,
  params: z.infer<typeof listTeamsSchema>
): Promise<TeamInfo[]> {
  const validatedParams = listTeamsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const coreApi = await client.getCoreApi();
  const teams = await coreApi.getTeams(project);

  if (!teams) {
    return [];
  }

  return teams.map((team) => ({
    id: team.id || "",
    name: team.name || "",
    description: team.description,
    url: team.url || "",
  }));
}
