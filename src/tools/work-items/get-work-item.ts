import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemDetails, WorkItemRelation, WorkItemAttachment } from "../../types.js";
import { WorkItemExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";

export const getWorkItemSchema = z.object({
  id: z.number().describe("Work item ID"),
  includeRelations: z.boolean().default(true).describe("Include linked items"),
  includeAttachments: z.boolean().default(true).describe("Include attachment info"),
});

export const getWorkItemTool = {
  name: "get_work_item",
  description: "Get complete details for a single work item by ID. Returns all fields (title, description, state, assignee, dates, etc.), comments/discussion history, linked work items (parent/child/related), and file attachments. Use this when you need full information about a specific work item.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include linked items, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getWorkItem(
  client: AdoClient,
  params: z.infer<typeof getWorkItemSchema>
): Promise<WorkItemDetails> {
  const validatedParams = getWorkItemSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Determine expand options
  const expand = validatedParams.includeRelations || validatedParams.includeAttachments
    ? WorkItemExpand.All
    : WorkItemExpand.Fields;

  const workItem = await witApi.getWorkItem(
    validatedParams.id,
    undefined,
    undefined,
    expand
  );

  if (!workItem || !workItem.fields) {
    throw new Error(`Work item ${validatedParams.id} not found`);
  }

  const fields = workItem.fields;

  // Parse relations
  let relations: WorkItemRelation[] = [];
  if (validatedParams.includeRelations && workItem.relations) {
    relations = workItem.relations
      .filter((r) => r.rel && r.url)
      .map((r) => ({
        rel: r.rel || "",
        url: r.url || "",
        attributes: {
          name: r.attributes?.name,
          comment: r.attributes?.comment,
        },
      }));
  }

  // Parse attachments from relations
  let attachments: WorkItemAttachment[] = [];
  if (validatedParams.includeAttachments && workItem.relations) {
    attachments = workItem.relations
      .filter((r) => r.rel === "AttachedFile")
      .map((r) => ({
        id: r.url?.split("/").pop() || "",
        name: r.attributes?.name || "attachment",
        url: r.url || "",
        size: 0, // Size not directly available in relation
        uploadDate: "",
      }));
  }

  // Get comments
  let comments;
  try {
    const project = fields["System.TeamProject"] as string;
    const commentsResult = await witApi.getComments(project, validatedParams.id);
    comments = commentsResult.comments?.map((c) => ({
      id: c.id || 0,
      text: c.text || "",
      createdBy: c.createdBy?.displayName || "",
      createdDate: c.createdDate?.toISOString() || "",
    }));
  } catch {
    // Comments API might not be available in all versions
    comments = undefined;
  }

  // Parse tags
  const tagsString = fields["System.Tags"] as string | undefined;
  const tags = tagsString ? tagsString.split(";").map((t) => t.trim()) : undefined;

  return {
    id: workItem.id || 0,
    title: fields["System.Title"] || "",
    state: fields["System.State"] || "",
    type: fields["System.WorkItemType"] || "",
    assignedTo: fields["System.AssignedTo"]?.displayName,
    description: fields["System.Description"],
    areaPath: fields["System.AreaPath"] || "",
    iterationPath: fields["System.IterationPath"] || "",
    priority: fields["Microsoft.VSTS.Common.Priority"],
    tags,
    createdDate: fields["System.CreatedDate"]?.toISOString?.() || String(fields["System.CreatedDate"] || ""),
    changedDate: fields["System.ChangedDate"]?.toISOString?.() || String(fields["System.ChangedDate"] || ""),
    createdBy: fields["System.CreatedBy"]?.displayName || "",
    changedBy: fields["System.ChangedBy"]?.displayName || "",
    relations,
    attachments,
    comments,
    url: workItem.url || "",
  };
}
