import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listAreaPathsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  depth: z.number().default(3).describe("How deep to traverse, default 3"),
});

export const listAreaPathsTool = {
  name: "list_area_paths",
  description: "List area paths (work item categorization hierarchy) for a project. Area paths are used to organize work items by team or product area, NOT for listing Kanban boards.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      depth: {
        type: "number",
        description: "How deep to traverse, default 3",
      },
    },
    required: [],
  },
};

export interface AreaPathInfo {
  id: number;
  name: string;
  path: string;
  hasChildren: boolean;
  children?: AreaPathInfo[];
}

export async function listAreaPaths(
  client: AdoClient,
  params: z.infer<typeof listAreaPathsSchema>
): Promise<AreaPathInfo[]> {
  const validatedParams = listAreaPathsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Get area paths classification node
  // TreeStructureGroup.Areas = 0
  const rootNode = await witApi.getClassificationNode(
    project,
    0, // Areas
    undefined,
    validatedParams.depth
  );

  if (!rootNode) {
    return [];
  }

  return flattenAreaPaths(rootNode, project);
}

function flattenAreaPaths(node: any, projectPath: string): AreaPathInfo[] {
  const result: AreaPathInfo[] = [];

  const areaPath: AreaPathInfo = {
    id: node.id || 0,
    name: node.name || "",
    path: node.path || `\\${projectPath}\\Area`,
    hasChildren: node.hasChildren || false,
  };

  if (node.children && node.children.length > 0) {
    areaPath.children = [];
    for (const child of node.children) {
      const childPaths = flattenAreaPaths(child, projectPath);
      areaPath.children.push(...childPaths);
    }
  }

  result.push(areaPath);
  return result;
}
