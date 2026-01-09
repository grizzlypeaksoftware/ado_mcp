import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const moveBoardCardSchema = z.object({
  id: z.number().describe("Work item ID"),
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
  board: z.string().describe("Board name or ID"),
  column: z.string().describe("Target column name"),
  position: z.number().optional().describe("Position within column (0-indexed)"),
  swimlane: z.string().optional().describe("Target swimlane"),
});

export const moveBoardCardTool = {
  name: "move_board_card",
  description: "Move a work item card on the board",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
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
      column: {
        type: "string",
        description: "Target column name",
      },
      position: {
        type: "number",
        description: "Position within column (0-indexed)",
      },
      swimlane: {
        type: "string",
        description: "Target swimlane",
      },
    },
    required: ["id", "board", "column"],
  },
};

export interface MoveCardResult {
  success: boolean;
  id: number;
  column: string;
  swimlane?: string;
  message: string;
}

export async function moveBoardCard(
  client: AdoClient,
  params: z.infer<typeof moveBoardCardSchema>
): Promise<MoveCardResult> {
  const validatedParams = moveBoardCardSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();
  const workApi = await client.getWorkApi();

  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  // Get board columns to find the state mapping for the target column
  const columns = await workApi.getBoardColumns(teamContext, validatedParams.board);
  if (!columns) {
    throw new Error(`Could not get columns for board ${validatedParams.board}`);
  }

  const targetColumn = columns.find(
    (col) => col.name?.toLowerCase() === validatedParams.column.toLowerCase()
  );

  if (!targetColumn) {
    throw new Error(`Column ${validatedParams.column} not found on board ${validatedParams.board}`);
  }

  // Get the first state mapped to this column
  // We need to update the work item's state to match the column
  const stateMappings = targetColumn.stateMappings || {};
  const stateValues = Object.values(stateMappings);

  const patchDocument: any[] = [];

  // Update the board column
  patchDocument.push({
    op: "add",
    path: "/fields/System.BoardColumn",
    value: validatedParams.column,
  });

  // If there's a state mapping, update the state as well
  if (stateValues.length > 0) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.State",
      value: stateValues[0],
    });
  }

  // Update swimlane if specified
  if (validatedParams.swimlane) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.BoardLane",
      value: validatedParams.swimlane,
    });
  }

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.id,
    project
  );

  return {
    success: true,
    id: validatedParams.id,
    column: validatedParams.column,
    swimlane: validatedParams.swimlane,
    message: `Successfully moved work item ${validatedParams.id} to column ${validatedParams.column}`,
  };
}
