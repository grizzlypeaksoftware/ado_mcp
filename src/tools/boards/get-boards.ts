import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getBoardsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
});

export const getBoardsTool = {
  name: "get_boards",
  description: "List all Kanban/Agile boards for a team. Use this to get board names before querying board columns, swimlanes, or items. Returns board id, name, and URL.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      team: {
        type: "string",
        description: "Team name, defaults to project default team",
      },
    },
    required: [],
  },
};

export interface BoardInfo {
  id: string;
  name: string;
  url: string;
}

export async function getBoards(
  client: AdoClient,
  params: z.infer<typeof getBoardsSchema>
): Promise<BoardInfo[]> {
  const validatedParams = getBoardsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const workApi = await client.getWorkApi();
  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  const boards = await workApi.getBoards(teamContext);

  if (!boards) {
    return [];
  }

  return boards.map((board) => ({
    id: board.id || "",
    name: board.name || "",
    url: board.url || "",
  }));
}
