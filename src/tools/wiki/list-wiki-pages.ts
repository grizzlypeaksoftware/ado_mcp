import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listWikiPagesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
  path: z.string().optional().describe("Start path, defaults to root"),
  recursive: z.boolean().default(true).describe("List recursively, default true"),
});

export const listWikiPagesTool = {
  name: "list_wiki_pages",
  description: "List wiki pages in a wiki. Can start from a specific path and list recursively or just immediate children. Returns page paths and metadata. Note: This tool returns REST API guidance as the Wiki Pages API requires direct calls.",
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
        description: "Start path, defaults to root",
      },
      recursive: {
        type: "boolean",
        description: "List recursively, default true",
      },
    },
    required: ["wikiId"],
  },
};

export interface WikiPageSummary {
  message: string;
  note: string;
  project: string;
  wikiId: string;
  path: string;
}

export async function listWikiPages(
  client: AdoClient,
  params: z.infer<typeof listWikiPagesSchema>
): Promise<WikiPageSummary> {
  const validatedParams = listWikiPagesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);
  const startPath = validatedParams.path || "/";

  return {
    message: "Wiki Pages API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/wiki/wikis/${validatedParams.wikiId}/pages?path=${encodeURIComponent(startPath)}&recursionLevel=${validatedParams.recursive ? 'full' : 'oneLevel'}`,
    project,
    wikiId: validatedParams.wikiId,
    path: startPath,
  };
}
