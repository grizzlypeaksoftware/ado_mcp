import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const updateWikiPageSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
  path: z.string().describe("Page path"),
  content: z.string().describe("New content (markdown)"),
  comment: z.string().optional().describe("Commit comment"),
  version: z.string().describe("Current ETag version (for concurrency)"),
});

export const updateWikiPageTool = {
  name: "update_wiki_page",
  description: "Update a wiki page",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      wikiId: {
        type: "string",
        description: "Wiki ID or name",
      },
      path: {
        type: "string",
        description: "Page path",
      },
      content: {
        type: "string",
        description: "New content (markdown)",
      },
      comment: {
        type: "string",
        description: "Commit comment",
      },
      version: {
        type: "string",
        description: "Current ETag version (for concurrency)",
      },
    },
    required: ["wikiId", "path", "content", "version"],
  },
};

export interface UpdateWikiPageResult {
  message: string;
  note: string;
  project: string;
  wikiId: string;
  path: string;
}

export async function updateWikiPage(
  client: AdoClient,
  params: z.infer<typeof updateWikiPageSchema>
): Promise<UpdateWikiPageResult> {
  const validatedParams = updateWikiPageSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  return {
    message: "Wiki Pages API requires direct REST calls.",
    note: `Use Azure DevOps REST API: PUT {orgUrl}/${project}/_apis/wiki/wikis/${validatedParams.wikiId}/pages?path=${encodeURIComponent(validatedParams.path)} with If-Match header`,
    project,
    wikiId: validatedParams.wikiId,
    path: validatedParams.path,
  };
}
