import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemSummary } from "../../types.js";

export const getPullRequestWorkItemsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
});

export const getPullRequestWorkItemsTool = {
  name: "get_pull_request_work_items",
  description: "Get all work items (bugs, tasks, user stories, etc.) linked to a pull request. Returns work item ID, title, state, type, and assignee. Use this to see which requirements or bugs a PR addresses for traceability.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      repository: {
        type: "string",
        description: "Repository name or ID",
      },
      pullRequestId: {
        type: "number",
        description: "Pull request ID",
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

export async function getPullRequestWorkItems(
  client: AdoClient,
  params: z.infer<typeof getPullRequestWorkItemsSchema>
): Promise<WorkItemSummary[]> {
  const validatedParams = getPullRequestWorkItemsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  const workItemRefs = await gitApi.getPullRequestWorkItemRefs(
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!workItemRefs || workItemRefs.length === 0) {
    return [];
  }

  const witApi = await client.getWorkItemTrackingApi();
  const ids = workItemRefs
    .filter((ref) => ref.id)
    .map((ref) => parseInt(ref.id!, 10));

  if (ids.length === 0) {
    return [];
  }

  const workItems = await witApi.getWorkItems(ids, [
    "System.Id",
    "System.Title",
    "System.State",
    "System.WorkItemType",
    "System.AssignedTo",
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
      url: wi.url || "",
    }));
}
