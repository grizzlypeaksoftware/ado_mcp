import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

const linkTypeReverseMap: Record<string, string> = {
  "System.LinkTypes.Hierarchy-Reverse": "parent",
  "System.LinkTypes.Hierarchy-Forward": "child",
  "System.LinkTypes.Related": "related",
  "System.LinkTypes.Dependency-Reverse": "predecessor",
  "System.LinkTypes.Dependency-Forward": "successor",
  "System.LinkTypes.Duplicate-Forward": "duplicate",
  "System.LinkTypes.Duplicate-Reverse": "duplicate-of",
  "Microsoft.VSTS.Common.TestedBy-Reverse": "tests",
  "Microsoft.VSTS.Common.TestedBy-Forward": "tested-by",
};

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

export const getLinkedWorkItemsSchema = z.object({
  id: z.number().describe("Work item ID"),
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
    .optional()
    .describe("Filter by link type"),
});

export const getLinkedWorkItemsTool = {
  name: "get_linked_work_items",
  description: "Get all work items linked to a specific work item. Optionally filter by link type (parent, child, related, etc.). Returns linked item ID, title, state, type, and the link relationship. Use this to find a work item's parent, children, or related items.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
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
        description: "Filter by link type",
      },
    },
    required: ["id"],
  },
};

export interface LinkedWorkItem {
  id: number;
  linkType: string;
  title?: string;
  state?: string;
  type?: string;
  comment?: string;
  url: string;
}

export async function getLinkedWorkItems(
  client: AdoClient,
  params: z.infer<typeof getLinkedWorkItemsSchema>
): Promise<LinkedWorkItem[]> {
  const validatedParams = getLinkedWorkItemsSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the work item with relations
  const workItem = await witApi.getWorkItem(
    validatedParams.id,
    undefined,
    undefined,
    4 // WorkItemExpand.Relations
  );

  if (!workItem.relations) {
    return [];
  }

  // Filter by link type if specified
  let filteredRelations = workItem.relations;
  if (validatedParams.linkType) {
    const linkTypeRefName = linkTypeMap[validatedParams.linkType];
    filteredRelations = workItem.relations.filter(
      (rel) => rel.rel === linkTypeRefName
    );
  }

  // Extract work item IDs from URLs and get their details
  const linkedItems: LinkedWorkItem[] = [];

  for (const relation of filteredRelations) {
    // Only process work item links
    if (!relation.url || !relation.rel) continue;

    const linkTypeName = linkTypeReverseMap[relation.rel];
    if (!linkTypeName) continue; // Skip non-work-item links (like attachments)

    // Extract work item ID from URL
    const match = relation.url.match(/workItems\/(\d+)/i);
    if (!match) continue;

    const linkedId = parseInt(match[1], 10);

    linkedItems.push({
      id: linkedId,
      linkType: linkTypeName,
      comment: relation.attributes?.comment as string | undefined,
      url: relation.url,
    });
  }

  // Optionally fetch details for all linked work items
  if (linkedItems.length > 0) {
    const ids = linkedItems.map((item) => item.id);
    const details = await witApi.getWorkItems(ids, [
      "System.Title",
      "System.State",
      "System.WorkItemType",
    ]);

    if (details) {
      for (const detail of details) {
        if (!detail || !detail.id) continue;
        const linkedItem = linkedItems.find((item) => item.id === detail.id);
        if (linkedItem && detail.fields) {
          linkedItem.title = detail.fields["System.Title"];
          linkedItem.state = detail.fields["System.State"];
          linkedItem.type = detail.fields["System.WorkItemType"];
        }
      }
    }
  }

  return linkedItems;
}
