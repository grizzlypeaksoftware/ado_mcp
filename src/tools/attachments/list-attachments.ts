import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemAttachment } from "../../types.js";

export const listWorkItemAttachmentsSchema = z.object({
  id: z.number().describe("Work item ID"),
});

export const listWorkItemAttachmentsTool = {
  name: "list_work_item_attachments",
  description: "List all file attachments on a work item. Returns attachment ID, filename, URL, size, and upload date for each attachment. Use this to see what files are attached before downloading or removing them.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
    },
    required: ["id"],
  },
};

export async function listWorkItemAttachments(
  client: AdoClient,
  params: z.infer<typeof listWorkItemAttachmentsSchema>
): Promise<WorkItemAttachment[]> {
  const validatedParams = listWorkItemAttachmentsSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the work item with relations
  const workItem = await witApi.getWorkItem(
    validatedParams.id,
    undefined,
    undefined,
    4 // WorkItemExpand.Relations
  );

  if (!workItem.relations) {
    return [];
  }

  // Filter for attachments only
  const attachments: WorkItemAttachment[] = [];

  for (const relation of workItem.relations) {
    if (relation.rel !== "AttachedFile" || !relation.url) {
      continue;
    }

    // Extract attachment ID from URL
    const match = relation.url.match(/attachments\/([a-f0-9-]+)/i);
    const attachmentId = match ? match[1] : "";

    attachments.push({
      id: attachmentId,
      name: relation.attributes?.name as string || "Unknown",
      url: relation.url,
      size: (relation.attributes?.resourceSize as number) || 0,
      uploadDate: (relation.attributes?.resourceCreatedDate as string) || "",
    });
  }

  return attachments;
}
