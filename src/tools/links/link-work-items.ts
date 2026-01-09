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

export const linkWorkItemsSchema = z.object({
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
    .describe("Type of link to create"),
  comment: z.string().optional().describe("Comment describing the link"),
});

export const linkWorkItemsTool = {
  name: "link_work_items",
  description: "Create a link between two work items",
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
        description: "Type of link to create",
      },
      comment: {
        type: "string",
        description: "Comment describing the link",
      },
    },
    required: ["sourceId", "targetId", "linkType"],
  },
};

export interface LinkResult {
  success: boolean;
  sourceId: number;
  targetId: number;
  linkType: string;
  message: string;
}

export async function linkWorkItems(
  client: AdoClient,
  params: z.infer<typeof linkWorkItemsSchema>
): Promise<LinkResult> {
  const validatedParams = linkWorkItemsSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the ADO link type reference name
  const linkTypeRefName = linkTypeMap[validatedParams.linkType];
  if (!linkTypeRefName) {
    throw new Error(`Unknown link type: ${validatedParams.linkType}`);
  }

  // Build the target work item URL
  const orgUrl = client.getOrgUrl();
  const targetUrl = `${orgUrl}/_apis/wit/workItems/${validatedParams.targetId}`;

  // Create the patch document to add the link
  const patchDocument = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: linkTypeRefName,
        url: targetUrl,
        attributes: {
          comment: validatedParams.comment || "",
        },
      },
    },
  ];

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.sourceId
  );

  return {
    success: true,
    sourceId: validatedParams.sourceId,
    targetId: validatedParams.targetId,
    linkType: validatedParams.linkType,
    message: `Successfully linked work item ${validatedParams.sourceId} to ${validatedParams.targetId} as ${validatedParams.linkType}`,
  };
}
