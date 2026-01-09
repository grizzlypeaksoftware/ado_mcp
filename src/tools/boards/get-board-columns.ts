import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getBoardColumnsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
  board: z.string().describe("Board name or ID"),
});

export const getBoardColumnsTool = {
  name: "get_board_columns",
  description: "Get columns for a specific board",
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

export interface BoardColumn {
  id: string;
  name: string;
  itemLimit: number;
  isSplit: boolean;
  stateMappings: Record<string, string>;
}

export async function getBoardColumns(
  client: AdoClient,
  params: z.infer<typeof getBoardColumnsSchema>
): Promise<BoardColumn[]> {
  const validatedParams = getBoardColumnsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const workApi = await client.getWorkApi();
  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  const columns = await workApi.getBoardColumns(teamContext, validatedParams.board);

  if (!columns) {
    return [];
  }

  return columns.map((column) => ({
    id: column.id || "",
    name: column.name || "",
    itemLimit: column.itemLimit || 0,
    isSplit: column.isSplit || false,
    stateMappings: column.stateMappings || {},
  }));
}
