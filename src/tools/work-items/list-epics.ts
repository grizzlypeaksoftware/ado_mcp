import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";
import { queryWorkItems } from "./query-work-items.js";

export const listEpicsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  states: z.array(z.string()).optional().describe("Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed epics."),
  assignedTo: z.string().optional().describe("Filter by assignee (display name or email)"),
  areaPath: z.string().optional().describe("Filter by area path"),
  iterationPath: z.string().optional().describe("Filter by iteration/sprint path"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  maxResults: z.number().optional().default(200).describe("Maximum number of results (default 200)"),
  includeActivatedDate: z.boolean().optional().default(false).describe("Include firstActivatedDate from revision history (adds API calls)"),
});

export const listEpicsTool = {
  name: "list_epics",
  description: "List Epic work items in a project. Epics are the highest-level work items representing large initiatives or themes. Filter by state, assignee, area path, iteration, or tags. Returns ID, title, state, type, and assignee for each epic.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      states: {
        type: "array",
        items: { type: "string" },
        description: "Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed epics.",
      },
      assignedTo: {
        type: "string",
        description: "Filter by assignee (display name or email)",
      },
      areaPath: {
        type: "string",
        description: "Filter by area path",
      },
      iterationPath: {
        type: "string",
        description: "Filter by iteration/sprint path",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter by tags",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results (default 200)",
      },
      includeActivatedDate: {
        type: "boolean",
        description: "Include firstActivatedDate from revision history (default false, adds API calls)",
      },
    },
    required: [],
  },
};

export async function listEpics(
  client: AdoClient,
  params: z.input<typeof listEpicsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = listEpicsSchema.parse(params);

  // Default to all non-Removed states if not specified
  const states = validatedParams.states || ["New", "Active", "Resolved", "Closed"];

  return queryWorkItems(client, {
    project: validatedParams.project,
    workItemTypes: ["Epic"],
    states,
    assignedTo: validatedParams.assignedTo,
    areaPath: validatedParams.areaPath,
    iterationPath: validatedParams.iterationPath,
    tags: validatedParams.tags,
    maxResults: validatedParams.maxResults,
    includeActivatedDate: validatedParams.includeActivatedDate,
  });
}
