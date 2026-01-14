import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";

export const queryWorkItemsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  workItemTypes: z.array(z.string()).optional().describe("Filter by work item types (e.g., ['Epic', 'Feature', 'User Story', 'Bug', 'Task'])"),
  states: z.array(z.string()).optional().describe("Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed'])"),
  assignedTo: z.string().optional().describe("Filter by assignee (display name or email)"),
  areaPath: z.string().optional().describe("Filter by area path"),
  iterationPath: z.string().optional().describe("Filter by iteration/sprint path"),
  tags: z.array(z.string()).optional().describe("Filter by tags (work items must have ALL specified tags)"),
  searchText: z.string().optional().describe("Optional text to search in title and description"),
  maxResults: z.number().optional().default(200).describe("Maximum number of results (default 200)"),
});

export const queryWorkItemsTool = {
  name: "query_work_items",
  description: "Query work items with flexible filtering by type, state, assignee, area path, iteration, and tags. Unlike search_work_items, no search text is required.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      workItemTypes: {
        type: "array",
        items: { type: "string" },
        description: "Filter by work item types (e.g., ['Epic', 'Feature', 'User Story', 'Bug', 'Task'])",
      },
      states: {
        type: "array",
        items: { type: "string" },
        description: "Filter by states (e.g., ['New', 'Active', 'Resolved', 'Closed'])",
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
        description: "Filter by tags (work items must have ALL specified tags)",
      },
      searchText: {
        type: "string",
        description: "Optional text to search in title and description",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results (default 200)",
      },
    },
    required: [],
  },
};

export async function queryWorkItems(
  client: AdoClient,
  params: z.infer<typeof queryWorkItemsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = queryWorkItemsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Build WIQL query conditions
  const conditions: string[] = [];

  // Filter by project
  conditions.push(`[System.TeamProject] = '${project}'`);

  // Filter by work item types
  if (validatedParams.workItemTypes && validatedParams.workItemTypes.length > 0) {
    const typesList = validatedParams.workItemTypes.map((t) => `'${t}'`).join(", ");
    conditions.push(`[System.WorkItemType] IN (${typesList})`);
  }

  // Filter by states
  if (validatedParams.states && validatedParams.states.length > 0) {
    const statesList = validatedParams.states.map((s) => `'${s}'`).join(", ");
    conditions.push(`[System.State] IN (${statesList})`);
  }

  // Filter by assignee
  if (validatedParams.assignedTo) {
    const escapedAssignee = validatedParams.assignedTo.replace(/'/g, "''");
    conditions.push(`[System.AssignedTo] CONTAINS '${escapedAssignee}'`);
  }

  // Filter by area path
  if (validatedParams.areaPath) {
    const escapedAreaPath = validatedParams.areaPath.replace(/'/g, "''");
    conditions.push(`[System.AreaPath] UNDER '${escapedAreaPath}'`);
  }

  // Filter by iteration path
  if (validatedParams.iterationPath) {
    const escapedIterationPath = validatedParams.iterationPath.replace(/'/g, "''");
    conditions.push(`[System.IterationPath] UNDER '${escapedIterationPath}'`);
  }

  // Filter by tags (all tags must match)
  if (validatedParams.tags && validatedParams.tags.length > 0) {
    for (const tag of validatedParams.tags) {
      const escapedTag = tag.replace(/'/g, "''");
      conditions.push(`[System.Tags] CONTAINS '${escapedTag}'`);
    }
  }

  // Optional text search in title and description
  if (validatedParams.searchText) {
    const escapedText = validatedParams.searchText.replace(/'/g, "''");
    conditions.push(
      `([System.Title] CONTAINS '${escapedText}' OR [System.Description] CONTAINS '${escapedText}')`
    );
  }

  const query = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo]
FROM WorkItems
WHERE ${conditions.join(" AND ")}
ORDER BY [System.ChangedDate] DESC`;

  // Execute WIQL query
  const queryResult = await witApi.queryByWiql(
    { query },
    { project },
    undefined,
    validatedParams.maxResults
  );

  if (!queryResult.workItems || queryResult.workItems.length === 0) {
    return [];
  }

  // Get the work item IDs (limited to maxResults)
  const ids = queryResult.workItems
    .slice(0, validatedParams.maxResults)
    .map((wi) => wi.id)
    .filter((id): id is number => id !== undefined);

  if (ids.length === 0) {
    return [];
  }

  // Fetch work item details (batch request, max 200 at a time)
  const batchSize = 200;
  const results: WorkItemSummary[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const workItems = await witApi.getWorkItems(
      batchIds,
      undefined,
      undefined,
      undefined,
      undefined,
      project
    );

    if (workItems) {
      for (const wi of workItems) {
        if (wi && wi.fields) {
          results.push({
            id: wi.id || 0,
            title: wi.fields["System.Title"] || "",
            state: wi.fields["System.State"] || "",
            type: wi.fields["System.WorkItemType"] || "",
            assignedTo: wi.fields["System.AssignedTo"]?.displayName,
            url: wi.url || "",
          });
        }
      }
    }
  }

  return results;
}
