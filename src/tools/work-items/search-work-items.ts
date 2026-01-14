import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";
import { getCycleTimeInfoBatch } from "../../utils/cycle-time.js";

export const searchWorkItemsSchema = z.object({
  searchText: z.string().describe("Text to search for"),
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  workItemTypes: z.array(z.string()).optional().describe("Filter by work item types"),
  states: z.array(z.string()).optional().describe("Filter by states"),
  assignedTo: z.string().optional().describe("Filter by assignee"),
  maxResults: z.number().optional().default(50).describe("Maximum number of results"),
  includeActivatedDate: z.boolean().optional().default(false).describe("Include firstActivatedDate from revision history (adds API calls)"),
});

export const searchWorkItemsTool = {
  name: "search_work_items",
  description: "Search for work items by keyword text in title and description. Use this when you need to find work items containing specific words or phrases. Supports optional filters for work item type, state, and assignee. For filtering without search text, use query_work_items instead.",
  inputSchema: {
    type: "object" as const,
    properties: {
      searchText: {
        type: "string",
        description: "Text to search for",
      },
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      workItemTypes: {
        type: "array",
        items: { type: "string" },
        description: "Filter by work item types",
      },
      states: {
        type: "array",
        items: { type: "string" },
        description: "Filter by states",
      },
      assignedTo: {
        type: "string",
        description: "Filter by assignee",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results, default 50",
      },
      includeActivatedDate: {
        type: "boolean",
        description: "Include firstActivatedDate from revision history (default false, adds API calls)",
      },
    },
    required: ["searchText"],
  },
};

export async function searchWorkItems(
  client: AdoClient,
  params: z.input<typeof searchWorkItemsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = searchWorkItemsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Build WIQL query
  const conditions: string[] = [];

  // Search in title and description
  const escapedText = validatedParams.searchText.replace(/'/g, "''");
  conditions.push(
    `([System.Title] CONTAINS '${escapedText}' OR [System.Description] CONTAINS '${escapedText}')`
  );

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

  // Fetch work item details
  const workItems = await witApi.getWorkItems(
    ids,
    undefined,
    undefined,
    undefined,
    undefined,
    project
  );

  if (!workItems) {
    return [];
  }

  const results: WorkItemSummary[] = workItems
    .filter((wi) => wi && wi.fields)
    .map((wi) => ({
      id: wi.id || 0,
      title: wi.fields!["System.Title"] || "",
      state: wi.fields!["System.State"] || "",
      type: wi.fields!["System.WorkItemType"] || "",
      assignedTo: wi.fields!["System.AssignedTo"]?.displayName,
      url: wi.url || "",
    }));

  // Optionally fetch cycle time info
  if (validatedParams.includeActivatedDate && results.length > 0) {
    const workItemsForCycleTime = results.map((wi) => ({
      id: wi.id,
      state: wi.state,
    }));

    const cycleTimeMap = await getCycleTimeInfoBatch(client, workItemsForCycleTime);

    for (const result of results) {
      const cycleInfo = cycleTimeMap.get(result.id);
      if (cycleInfo?.firstActivatedDate) {
        result.firstActivatedDate = cycleInfo.firstActivatedDate;
      }
    }
  }

  return results;
}
