import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";

export const getBoardItemsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
  board: z.string().describe("Board name or ID"),
  column: z.string().optional().describe("Filter by column"),
  swimlane: z.string().optional().describe("Filter by swimlane"),
});

export const getBoardItemsTool = {
  name: "get_board_items",
  description: "Get all work items displayed on a Kanban board. Requires a board name (use get_boards first to list available boards). Can filter by column or swimlane.",
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
      column: {
        type: "string",
        description: "Filter by column",
      },
      swimlane: {
        type: "string",
        description: "Filter by swimlane",
      },
    },
    required: ["board"],
  },
};

export interface BoardWorkItem extends WorkItemSummary {
  column?: string;
  row?: string;
  columnId?: string;
  rowId?: string;
}

export async function getBoardItems(
  client: AdoClient,
  params: z.infer<typeof getBoardItemsSchema>
): Promise<BoardWorkItem[]> {
  const validatedParams = getBoardItemsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  // We need to query work items on the board using WIQL
  // The board items API doesn't directly return work items, so we query based on team context
  const witApi = await client.getWorkItemTrackingApi();
  const workApi = await client.getWorkApi();

  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  // Get the board to understand the work item types it contains
  const board = await workApi.getBoard(teamContext, validatedParams.board);
  if (!board) {
    throw new Error(`Board ${validatedParams.board} not found`);
  }

  // Build a WIQL query to get work items for this team's backlog
  let query = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.BoardColumn], [System.BoardLane]
               FROM WorkItems
               WHERE [System.TeamProject] = '${project}'`;

  if (validatedParams.column) {
    query += ` AND [System.BoardColumn] = '${validatedParams.column}'`;
  }

  if (validatedParams.swimlane) {
    query += ` AND [System.BoardLane] = '${validatedParams.swimlane}'`;
  }

  query += " ORDER BY [System.Id]";

  const queryResult = await witApi.queryByWiql({ query }, teamContext);

  if (!queryResult.workItems || queryResult.workItems.length === 0) {
    return [];
  }

  // Get the work item details
  const ids = queryResult.workItems
    .filter((wi) => wi.id)
    .map((wi) => wi.id as number)
    .slice(0, 200); // Limit to 200 items

  if (ids.length === 0) {
    return [];
  }

  const workItems = await witApi.getWorkItems(ids, [
    "System.Id",
    "System.Title",
    "System.State",
    "System.WorkItemType",
    "System.AssignedTo",
    "System.BoardColumn",
    "System.BoardLane",
  ]);

  if (!workItems) {
    return [];
  }

  return workItems
    .filter((wi) => wi && wi.fields)
    .map((wi) => ({
      id: wi.id || 0,
      title: wi.fields!["System.Title"] || "",
      state: wi.fields!["System.State"] || "",
      type: wi.fields!["System.WorkItemType"] || "",
      assignedTo: wi.fields!["System.AssignedTo"]?.displayName,
      column: wi.fields!["System.BoardColumn"],
      row: wi.fields!["System.BoardLane"],
      url: wi.url || "",
    }));
}
