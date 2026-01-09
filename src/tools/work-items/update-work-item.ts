import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces.js";

export const updateWorkItemSchema = z.object({
  id: z.number().describe("Work item ID"),
  title: z.string().optional().describe("New title"),
  description: z.string().optional().describe("New description"),
  state: z.string().optional().describe("New state"),
  assignedTo: z.string().optional().describe("New assignee (email or display name)"),
  areaPath: z.string().optional().describe("New area path"),
  iterationPath: z.string().optional().describe("New iteration path"),
  tags: z.array(z.string()).optional().describe("New tags (replaces existing)"),
  priority: z.number().min(1).max(4).optional().describe("New priority (1-4)"),
  additionalFields: z.record(z.unknown()).optional().describe("Key-value pairs for custom fields"),
});

export const updateWorkItemTool = {
  name: "update_work_item",
  description: "Update an existing work item",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      title: {
        type: "string",
        description: "New title",
      },
      description: {
        type: "string",
        description: "New description",
      },
      state: {
        type: "string",
        description: "New state",
      },
      assignedTo: {
        type: "string",
        description: "New assignee (email or display name)",
      },
      areaPath: {
        type: "string",
        description: "New area path",
      },
      iterationPath: {
        type: "string",
        description: "New iteration path",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "New tags (replaces existing)",
      },
      priority: {
        type: "number",
        description: "New priority (1-4)",
      },
      additionalFields: {
        type: "object",
        description: "Key-value pairs for custom fields",
      },
    },
    required: ["id"],
  },
};

interface UpdatedWorkItem {
  id: number;
  title: string;
  state: string;
  type: string;
  url: string;
  rev: number;
}

interface PatchOperation {
  op: Operation;
  path: string;
  value: unknown;
}

export async function updateWorkItem(
  client: AdoClient,
  params: z.infer<typeof updateWorkItemSchema>
): Promise<UpdatedWorkItem> {
  const validatedParams = updateWorkItemSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Build patch document
  const patchDocument: PatchOperation[] = [];

  if (validatedParams.title !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Title",
      value: validatedParams.title,
    });
  }

  if (validatedParams.description !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Description",
      value: validatedParams.description,
    });
  }

  if (validatedParams.state !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.State",
      value: validatedParams.state,
    });
  }

  if (validatedParams.assignedTo !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.AssignedTo",
      value: validatedParams.assignedTo,
    });
  }

  if (validatedParams.areaPath !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.AreaPath",
      value: validatedParams.areaPath,
    });
  }

  if (validatedParams.iterationPath !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.IterationPath",
      value: validatedParams.iterationPath,
    });
  }

  if (validatedParams.tags !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Tags",
      value: validatedParams.tags.join("; "),
    });
  }

  if (validatedParams.priority !== undefined) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/Microsoft.VSTS.Common.Priority",
      value: validatedParams.priority,
    });
  }

  // Additional custom fields
  if (validatedParams.additionalFields) {
    for (const [key, value] of Object.entries(validatedParams.additionalFields)) {
      const path = key.startsWith("/fields/") ? key : `/fields/${key}`;
      patchDocument.push({
        op: Operation.Add,
        path,
        value,
      });
    }
  }

  if (patchDocument.length === 0) {
    throw new Error("No fields to update");
  }

  const updatedItem = await witApi.updateWorkItem(
    undefined,
    patchDocument,
    validatedParams.id
  );

  if (!updatedItem || !updatedItem.id) {
    throw new Error(`Failed to update work item ${validatedParams.id}`);
  }

  return {
    id: updatedItem.id,
    title: updatedItem.fields?.["System.Title"] || "",
    state: updatedItem.fields?.["System.State"] || "",
    type: updatedItem.fields?.["System.WorkItemType"] || "",
    url: updatedItem.url || "",
    rev: updatedItem.rev || 0,
  };
}
