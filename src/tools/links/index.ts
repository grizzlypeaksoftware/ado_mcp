import { AdoClient } from "../../ado-client.js";

// Import all link tools
import { linkWorkItemsTool, linkWorkItems } from "./link-work-items.js";
import { removeWorkItemLinkTool, removeWorkItemLink } from "./remove-work-item-link.js";
import { getLinkedWorkItemsTool, getLinkedWorkItems } from "./get-linked-work-items.js";

// Export all tool definitions
export const linkTools = [
  linkWorkItemsTool,
  removeWorkItemLinkTool,
  getLinkedWorkItemsTool,
];

// Tool handler router
export async function handleLinkTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "link_work_items":
      return linkWorkItems(client, args as Parameters<typeof linkWorkItems>[1]);
    case "remove_work_item_link":
      return removeWorkItemLink(client, args as Parameters<typeof removeWorkItemLink>[1]);
    case "get_linked_work_items":
      return getLinkedWorkItems(client, args as Parameters<typeof getLinkedWorkItems>[1]);
    default:
      throw new Error(`Unknown link tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  linkWorkItemsTool,
  linkWorkItems,
  removeWorkItemLinkTool,
  removeWorkItemLink,
  getLinkedWorkItemsTool,
  getLinkedWorkItems,
};
