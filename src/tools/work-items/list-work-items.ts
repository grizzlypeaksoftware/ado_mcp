import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";
import { getCycleTimeInfoBatch } from "../../utils/cycle-time.js";

export const listWorkItemsSchema = z.object({
  query: z.string().describe("WIQL query string"),
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  includeActivatedDate: z.boolean().optional().default(false).describe("Include firstActivatedDate from revision history (adds API calls)"),
});

export const listWorkItemsTool = {
  name: "list_work_items",
  description: "Execute a raw WIQL (Work Item Query Language) query to retrieve work items. Use this for advanced queries with custom SQL-like syntax. For simpler filtering, prefer query_work_items or search_work_items instead. Returns work item ID, title, state, type, assignee, and URL.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "WIQL query string",
      },
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      includeActivatedDate: {
        type: "boolean",
        description: "Include firstActivatedDate from revision history (default false, adds API calls)",
      },
    },
    required: ["query"],
  },
};

export async function listWorkItems(
  client: AdoClient,
  params: z.input<typeof listWorkItemsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = listWorkItemsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Execute WIQL query
  const queryResult = await witApi.queryByWiql(
    { query: validatedParams.query },
    { project }
  );

  if (!queryResult.workItems || queryResult.workItems.length === 0) {
    return [];
  }

  // Get the work item IDs
  const ids = queryResult.workItems
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
