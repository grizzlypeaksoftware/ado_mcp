import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const removeWorkItemAttachmentSchema = z.object({
  id: z.number().describe("Work item ID"),
  attachmentId: z.string().describe("Attachment ID or URL"),
});

export const removeWorkItemAttachmentTool = {
  name: "remove_work_item_attachment",
  description: "Remove a file attachment from a work item. Get the attachment ID from list_work_item_attachments first. The attachment file is unlinked from the work item but may remain in Azure storage.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      attachmentId: {
        type: "string",
        description: "Attachment ID or URL",
      },
    },
    required: ["id", "attachmentId"],
  },
};

export interface RemoveAttachmentResult {
  success: boolean;
  message: string;
}

export async function removeWorkItemAttachment(
  client: AdoClient,
  params: z.infer<typeof removeWorkItemAttachmentSchema>
): Promise<RemoveAttachmentResult> {
  const validatedParams = removeWorkItemAttachmentSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the work item with relations
  const workItem = await witApi.getWorkItem(
    validatedParams.id,
    undefined,
    undefined,
    4 // WorkItemExpand.Relations
  );

  if (!workItem.relations) {
    throw new Error(`Work item ${validatedParams.id} has no attachments`);
  }

  // Find the attachment relation index
  const attachmentId = validatedParams.attachmentId.toLowerCase();
  const relationIndex = workItem.relations.findIndex((rel) => {
    if (rel.rel !== "AttachedFile" || !rel.url) {
      return false;
    }
    // Match by attachment ID in URL or full URL
    return (
      rel.url.toLowerCase().includes(attachmentId) ||
      rel.url.toLowerCase() === attachmentId
    );
  });

  if (relationIndex === -1) {
    throw new Error(
      `Attachment ${validatedParams.attachmentId} not found on work item ${validatedParams.id}`
    );
  }

  // Remove the relation using patch
  const patchDocument = [
    {
      op: "remove",
      path: `/relations/${relationIndex}`,
    },
  ];

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.id
  );

  return {
    success: true,
    message: `Successfully removed attachment from work item ${validatedParams.id}`,
  };
}
