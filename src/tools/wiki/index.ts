import { AdoClient } from "../../ado-client.js";

// Import all wiki tools
import { listWikisTool, listWikis } from "./list-wikis.js";
import { getWikiTool, getWiki } from "./get-wiki.js";
import { getWikiPageTool, getWikiPage } from "./get-wiki-page.js";
import { createWikiPageTool, createWikiPage } from "./create-wiki-page.js";
import { updateWikiPageTool, updateWikiPage } from "./update-wiki-page.js";
import { deleteWikiPageTool, deleteWikiPage } from "./delete-wiki-page.js";
import { listWikiPagesTool, listWikiPages } from "./list-wiki-pages.js";

// Export all tool definitions
export const wikiTools = [
  listWikisTool,
  getWikiTool,
  getWikiPageTool,
  createWikiPageTool,
  updateWikiPageTool,
  deleteWikiPageTool,
  listWikiPagesTool,
];

// Tool handler router
export async function handleWikiTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_wikis":
      return listWikis(client, args as Parameters<typeof listWikis>[1]);
    case "get_wiki":
      return getWiki(client, args as Parameters<typeof getWiki>[1]);
    case "get_wiki_page":
      return getWikiPage(client, args as Parameters<typeof getWikiPage>[1]);
    case "create_wiki_page":
      return createWikiPage(client, args as Parameters<typeof createWikiPage>[1]);
    case "update_wiki_page":
      return updateWikiPage(client, args as Parameters<typeof updateWikiPage>[1]);
    case "delete_wiki_page":
      return deleteWikiPage(client, args as Parameters<typeof deleteWikiPage>[1]);
    case "list_wiki_pages":
      return listWikiPages(client, args as Parameters<typeof listWikiPages>[1]);
    default:
      throw new Error(`Unknown wiki tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listWikisTool,
  listWikis,
  getWikiTool,
  getWiki,
  getWikiPageTool,
  getWikiPage,
  createWikiPageTool,
  createWikiPage,
  updateWikiPageTool,
  updateWikiPage,
  deleteWikiPageTool,
  deleteWikiPage,
  listWikiPagesTool,
  listWikiPages,
};
