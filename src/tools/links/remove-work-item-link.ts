import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

const linkTypeMap: Record<string, string> = {
  parent: "System.LinkTypes.Hierarchy-Reverse",
  child: "System.LinkTypes.Hierarchy-Forward",
  related: "System.LinkTypes.Related",
  predecessor: "System.LinkTypes.Dependency-Reverse",
  successor: "System.LinkTypes.Dependency-Forward",
  duplicate: "System.LinkTypes.Duplicate-Forward",
  "duplicate-of": "System.LinkTypes.Duplicate-Reverse",
  tests: "Microsoft.VSTS.Common.TestedBy-Reverse",
  "tested-by": "Microsoft.VSTS.Common.TestedBy-Forward",
};

export const removeWorkItemLinkSchema = z.object({
  sourceId: z.number().describe("Source work item ID"),
  targetId: z.number().describe("Target work item ID"),
  linkType: z
    .enum([
      "parent",
      "child",
      "related",
      "predecessor",
      "successor",
      "duplicate",
      "duplicate-of",
      "tests",
      "tested-by",
    ])
    .describe("Type of link to remove"),
});

export const removeWorkItemLinkTool = {
  name: "remove_work_item_link",
  description: "Remove a link between work items",
  inputSchema: {
    type: "object" as const,
    properties: {
      sourceId: {
        type: "number",
        description: "Source work item ID",
      },
      targetId: {
        type: "number",
        description: "Target work item ID",
      },
      linkType: {
        type: "string",
        enum: [
          "parent",
          "child",
          "related",
          "predecessor",
          "successor",
          "duplicate",
          "duplicate-of",
          "tests",
          "tested-by",
        ],
        description: "Type of link to remove",
      },
    },
    required: ["sourceId", "targetId", "linkType"],
  },
};

export interface RemoveLinkResult {
  success: boolean;
  message: string;
}

export async function removeWorkItemLink(
  client: AdoClient,
  params: z.infer<typeof removeWorkItemLinkSchema>
): Promise<RemoveLinkResult> {
  const validatedParams = removeWorkItemLinkSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the ADO link type reference name
  const linkTypeRefName = linkTypeMap[validatedParams.linkType];
  if (!linkTypeRefName) {
    throw new Error(`Unknown link type: ${validatedParams.linkType}`);
  }

  // First, get the work item to find the relation index
  const workItem = await witApi.getWorkItem(
    validatedParams.sourceId,
    undefined,
    undefined,
    4 // WorkItemExpand.Relations
  );

  if (!workItem.relations) {
    throw new Error(`Work item ${validatedParams.sourceId} has no relations`);
  }

  // Find the relation index that matches the target and link type
  const orgUrl = client.getOrgUrl();
  const targetUrl = `${orgUrl}/_apis/wit/workItems/${validatedParams.targetId}`;

  const relationIndex = workItem.relations.findIndex(
    (rel) =>
      rel.rel === linkTypeRefName &&
      rel.url?.toLowerCase().includes(`/workitems/${validatedParams.targetId}`)
  );

  if (relationIndex === -1) {
    throw new Error(
      `No ${validatedParams.linkType} link found between work item ${validatedParams.sourceId} and ${validatedParams.targetId}`
    );
  }

  // Remove the relation using patch
  const patchDocument = [
    {
      op: "remove",
      path: `/relations/${relationIndex}`,
    },
  ];

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.sourceId
  );

  return {
    success: true,
    message: `Successfully removed ${validatedParams.linkType} link between work item ${validatedParams.sourceId} and ${validatedParams.targetId}`,
  };
}
