import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const createWikiPageSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
  path: z.string().describe("Page path"),
  content: z.string().describe("Page content (markdown)"),
  comment: z.string().optional().describe("Commit comment"),
});

export const createWikiPageTool = {
  name: "create_wiki_page",
  description: "Create a new wiki page",
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
        description: "Page content (markdown)",
      },
      comment: {
        type: "string",
        description: "Commit comment",
      },
    },
    required: ["wikiId", "path", "content"],
  },
};

export interface CreateWikiPageResult {
  message: string;
  note: string;
  project: string;
  wikiId: string;
  path: string;
}

export async function createWikiPage(
  client: AdoClient,
  params: z.infer<typeof createWikiPageSchema>
): Promise<CreateWikiPageResult> {
  const validatedParams = createWikiPageSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  return {
    message: "Wiki Pages API requires direct REST calls.",
    note: `Use Azure DevOps REST API: PUT {orgUrl}/${project}/_apis/wiki/wikis/${validatedParams.wikiId}/pages?path=${encodeURIComponent(validatedParams.path)}`,
    project,
    wikiId: validatedParams.wikiId,
    path: validatedParams.path,
  };
}
