import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listWikisSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
});

export const listWikisTool = {
  name: "list_wikis",
  description: "List all wikis in a project",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
    },
    required: [],
  },
};

export interface WikiSummary {
  id: string;
  name: string;
  type: string;
  url: string;
}

export async function listWikis(
  client: AdoClient,
  params: z.infer<typeof listWikisSchema>
): Promise<WikiSummary[]> {
  const validatedParams = listWikisSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const wikiApi = await client.getWikiApi();

  const wikis = await wikiApi.getAllWikis(project);

  if (!wikis) {
    return [];
  }

  return wikis.map((wiki) => ({
    id: wiki.id || "",
    name: wiki.name || "",
    type: wiki.type !== undefined ? getWikiTypeString(wiki.type) : "unknown",
    url: wiki.url || "",
  }));
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
