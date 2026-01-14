import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getWikiSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  wikiId: z.string().describe("Wiki ID or name"),
});

export const getWikiTool = {
  name: "get_wiki",
  description: "Get detailed information about a specific wiki by ID or name. Returns wiki type (project/code), and for code wikis: the backing repository ID, mapped path, and version. Use this to understand wiki configuration.",
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
    },
    required: ["wikiId"],
  },
};

export interface WikiDetails {
  id: string;
  name: string;
  type: string;
  repositoryId?: string;
  mappedPath?: string;
  version?: string;
  url: string;
}

export async function getWiki(
  client: AdoClient,
  params: z.infer<typeof getWikiSchema>
): Promise<WikiDetails> {
  const validatedParams = getWikiSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const wikiApi = await client.getWikiApi();

  const wiki = await wikiApi.getWiki(project, validatedParams.wikiId);

  if (!wiki) {
    throw new Error(`Wiki ${validatedParams.wikiId} not found`);
  }

  return {
    id: wiki.id || "",
    name: wiki.name || "",
    type: wiki.type !== undefined ? getWikiTypeString(wiki.type) : "unknown",
    repositoryId: wiki.repositoryId,
    mappedPath: wiki.mappedPath,
    version: wiki.versions?.[0]?.version,
    url: wiki.url || "",
  };
}

function getWikiTypeString(type: number): string {
  switch (type) {
    case 0:
      return "projectWiki";
    case 1:
      return "codeWiki";
    default:
      return "unknown";
  }
}
