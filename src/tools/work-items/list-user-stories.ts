import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";
import { queryWorkItems } from "./query-work-items.js";

export const listUserStoriesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  states: z.array(z.string()).optional().describe("Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed user stories."),
  assignedTo: z.string().optional().describe("Filter by assignee (display name or email)"),
  areaPath: z.string().optional().describe("Filter by area path"),
  iterationPath: z.string().optional().describe("Filter by iteration/sprint path"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  maxResults: z.number().optional().default(200).describe("Maximum number of results (default 200)"),
  includeActivatedDate: z.boolean().optional().default(false).describe("Include firstActivatedDate from revision history (adds API calls)"),
});

export const listUserStoriesTool = {
  name: "list_user_stories",
  description: "List User Story work items in a project. User Stories describe functionality from the user's perspective, typically broken into Tasks. Filter by state, assignee, area path, iteration, or tags. Returns ID, title, state, type, and assignee.",
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
        description: "Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed']). If not specified, returns all non-Removed user stories.",
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

export async function listUserStories(
  client: AdoClient,
  params: z.input<typeof listUserStoriesSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = listUserStoriesSchema.parse(params);

  // Default to all non-Removed states if not specified
  const states = validatedParams.states || ["New", "Active", "Resolved", "Closed"];

  return queryWorkItems(client, {
    project: validatedParams.project,
    workItemTypes: ["User Story"],
    states,
    assignedTo: validatedParams.assignedTo,
    areaPath: validatedParams.areaPath,
    iterationPath: validatedParams.iterationPath,
    tags: validatedParams.tags,
    maxResults: validatedParams.maxResults,
    includeActivatedDate: validatedParams.includeActivatedDate,
  });
}
