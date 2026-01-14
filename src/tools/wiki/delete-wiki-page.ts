import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const deleteWikiPageSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
  path: z.string().describe("Page path"),
  comment: z.string().optional().describe("Commit comment"),
});

export const deleteWikiPageTool = {
  name: "delete_wiki_page",
  description: "Delete a wiki page at the specified path. Child pages are NOT automatically deleted. Optionally include a commit comment for the deletion. Note: This tool returns REST API guidance as the Wiki Pages API requires direct calls.",
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
      comment: {
        type: "string",
        description: "Commit comment",
      },
    },
    required: ["wikiId", "path"],
  },
};

export interface DeleteWikiPageResult {
  message: string;
  note: string;
  project: string;
  wikiId: string;
  path: string;
}

export async function deleteWikiPage(
  client: AdoClient,
  params: z.infer<typeof deleteWikiPageSchema>
): Promise<DeleteWikiPageResult> {
  const validatedParams = deleteWikiPageSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  return {
    message: "Wiki Pages API requires direct REST calls.",
    note: `Use Azure DevOps REST API: DELETE {orgUrl}/${project}/_apis/wiki/wikis/${validatedParams.wikiId}/pages?path=${encodeURIComponent(validatedParams.path)}`,
    project,
    wikiId: validatedParams.wikiId,
    path: validatedParams.path,
  };
}
