import { AdoClient } from "../../ado-client.js";

// Import all attachment tools
import { addWorkItemAttachmentTool, addWorkItemAttachment } from "./add-attachment.js";
import { addWorkItemAttachmentFromUrlTool, addWorkItemAttachmentFromUrl } from "./add-attachment-from-url.js";
import { listWorkItemAttachmentsTool, listWorkItemAttachments } from "./list-attachments.js";
import { removeWorkItemAttachmentTool, removeWorkItemAttachment } from "./remove-attachment.js";

// Export all tool definitions
export const attachmentTools = [
  addWorkItemAttachmentTool,
  addWorkItemAttachmentFromUrlTool,
  listWorkItemAttachmentsTool,
  removeWorkItemAttachmentTool,
];

// Tool handler router
export async function handleAttachmentTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "add_work_item_attachment":
      return addWorkItemAttachment(client, args as Parameters<typeof addWorkItemAttachment>[1]);
    case "add_work_item_attachment_from_url":
      return addWorkItemAttachmentFromUrl(client, args as Parameters<typeof addWorkItemAttachmentFromUrl>[1]);
    case "list_work_item_attachments":
      return listWorkItemAttachments(client, args as Parameters<typeof listWorkItemAttachments>[1]);
    case "remove_work_item_attachment":
      return removeWorkItemAttachment(client, args as Parameters<typeof removeWorkItemAttachment>[1]);
    default:
      throw new Error(`Unknown attachment tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  addWorkItemAttachmentTool,
  addWorkItemAttachment,
  addWorkItemAttachmentFromUrlTool,
  addWorkItemAttachmentFromUrl,
  listWorkItemAttachmentsTool,
  listWorkItemAttachments,
  removeWorkItemAttachmentTool,
  removeWorkItemAttachment,
};
