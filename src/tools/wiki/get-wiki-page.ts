import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getWikiPageSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
  path: z.string().describe("Page path"),
  version: z.string().optional().describe("Specific version/commit"),
  includeContent: z.boolean().default(true).describe("Include page content, default true"),
});

export const getWikiPageTool = {
  name: "get_wiki_page",
  description: "Get a wiki page's content and metadata by path. Optionally fetch a specific version or exclude content. Wiki pages are written in Markdown. Note: This tool returns REST API guidance as the Wiki Pages API requires direct calls.",
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
      version: {
        type: "string",
        description: "Specific version/commit",
      },
      includeContent: {
        type: "boolean",
        description: "Include page content, default true",
      },
    },
    required: ["wikiId", "path"],
  },
};

export interface WikiPageDetails {
  message: string;
  note: string;
  project: string;
  wikiId: string;
  path: string;
}

export async function getWikiPage(
  client: AdoClient,
  params: z.infer<typeof getWikiPageSchema>
): Promise<WikiPageDetails> {
  const validatedParams = getWikiPageSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  return {
    message: "Wiki Pages API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/wiki/wikis/${validatedParams.wikiId}/pages?path=${encodeURIComponent(validatedParams.path)}&includeContent=${validatedParams.includeContent}`,
    project,
    wikiId: validatedParams.wikiId,
    path: validatedParams.path,
  };
}
