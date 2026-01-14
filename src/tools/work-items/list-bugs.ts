import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";
import { queryWorkItems } from "./query-work-items.js";

export const listBugsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  states: z.array(z.string()).optional().describe("Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed bugs."),
  assignedTo: z.string().optional().describe("Filter by assignee (display name or email)"),
  areaPath: z.string().optional().describe("Filter by area path"),
  iterationPath: z.string().optional().describe("Filter by iteration/sprint path"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  maxResults: z.number().optional().default(200).describe("Maximum number of results (default 200)"),
});

export const listBugsTool = {
  name: "list_bugs",
  description: "List Bug work items with optional filtering by state, assignee, area path, iteration, and tags. Returns all non-Removed bugs by default.",
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
        description: "Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed bugs.",
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
    },
    required: [],
  },
};

export async function listBugs(
  client: AdoClient,
  params: z.input<typeof listBugsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = listBugsSchema.parse(params);

  // Default to all non-Removed states if not specified
  const states = validatedParams.states || ["New", "Active", "Resolved", "Closed"];

  return queryWorkItems(client, {
    project: validatedParams.project,
    workItemTypes: ["Bug"],
    states,
    assignedTo: validatedParams.assignedTo,
    areaPath: validatedParams.areaPath,
    iterationPath: validatedParams.iterationPath,
    tags: validatedParams.tags,
    maxResults: validatedParams.maxResults,
  });
}
