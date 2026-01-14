import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getBoardSwimlanesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
  board: z.string().describe("Board name or ID"),
});

export const getBoardSwimlanesTool = {
  name: "get_board_swimlanes",
  description: "Get the horizontal swimlanes configured on a Kanban board. Swimlanes are rows used to categorize work items (e.g., by priority or type). Requires a board name from get_boards.",
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
      board: {
        type: "string",
        description: "Board name or ID",
      },
    },
    required: ["board"],
  },
};

export interface BoardSwimlane {
  id: string;
  name: string;
}

export async function getBoardSwimlanes(
  client: AdoClient,
  params: z.infer<typeof getBoardSwimlanesSchema>
): Promise<BoardSwimlane[]> {
  const validatedParams = getBoardSwimlanesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const workApi = await client.getWorkApi();
  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  const rows = await workApi.getBoardRows(teamContext, validatedParams.board);

  if (!rows) {
    return [];
  }

  return rows.map((row) => ({
    id: row.id || "",
    name: row.name || "",
  }));
}
