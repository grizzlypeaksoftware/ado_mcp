import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces.js";

export const createWorkItemSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  type: z.string().describe("Work item type (Bug, Task, User Story, Epic, Feature, etc.)"),
  title: z.string().describe("Title"),
  description: z.string().optional().describe("Description/repro steps"),
  assignedTo: z.string().optional().describe("Email or display name"),
  areaPath: z.string().optional().describe("Area path"),
  iterationPath: z.string().optional().describe("Iteration/sprint path"),
  parentId: z.number().optional().describe("Parent work item ID to link to"),
  tags: z.array(z.string()).optional().describe("Tags to apply"),
  priority: z.number().min(1).max(4).optional().describe("Priority (1-4)"),
  additionalFields: z.record(z.unknown()).optional().describe("Key-value pairs for custom fields"),
});

export const createWorkItemTool = {
  name: "create_work_item",
  description: "Create a new Azure DevOps work item (Bug, Task, User Story, Epic, Feature, etc.). Supports setting title, description, assignee, area/iteration paths, priority, tags, and custom fields. Can optionally link to a parent work item on creation.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      type: {
        type: "string",
        description: "Work item type (Bug, Task, User Story, Epic, Feature, etc.)",
      },
      title: {
        type: "string",
        description: "Title",
      },
      description: {
        type: "string",
        description: "Description/repro steps",
      },
      assignedTo: {
        type: "string",
        description: "Email or display name",
      },
      areaPath: {
        type: "string",
        description: "Area path",
      },
      iterationPath: {
        type: "string",
        description: "Iteration/sprint path",
      },
      parentId: {
        type: "number",
        description: "Parent work item ID to link to",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to apply",
      },
      priority: {
        type: "number",
        description: "Priority (1-4)",
      },
      additionalFields: {
        type: "object",
        description: "Key-value pairs for custom fields",
      },
    },
    required: ["type", "title"],
  },
};

interface CreatedWorkItem {
  id: number;
  title: string;
  type: string;
  state: string;
  url: string;
}

interface PatchOperation {
  op: Operation;
  path: string;
  value: unknown;
}

export async function createWorkItem(
  client: AdoClient,
  params: z.infer<typeof createWorkItemSchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createWorkItemSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Build patch document as array
  const patchDocument: PatchOperation[] = [];

  // Required field
  patchDocument.push({
    op: Operation.Add,
    path: "/fields/System.Title",
    value: validatedParams.title,
  });

  // Optional fields
  if (validatedParams.description) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Description",
      value: validatedParams.description,
    });
  }

  if (validatedParams.assignedTo) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.AssignedTo",
      value: validatedParams.assignedTo,
    });
  }

  if (validatedParams.areaPath) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.AreaPath",
      value: validatedParams.areaPath,
    });
  }

  if (validatedParams.iterationPath) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.IterationPath",
      value: validatedParams.iterationPath,
    });
  }

  if (validatedParams.tags && validatedParams.tags.length > 0) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Tags",
      value: validatedParams.tags.join("; "),
    });
  }

  if (validatedParams.priority) {
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/Microsoft.VSTS.Common.Priority",
      value: validatedParams.priority,
    });
  }

  // Additional custom fields
  if (validatedParams.additionalFields) {
    for (const [key, value] of Object.entries(validatedParams.additionalFields)) {
      // If key doesn't start with /fields/, add the prefix
      const path = key.startsWith("/fields/") ? key : `/fields/${key}`;
      patchDocument.push({
        op: Operation.Add,
        path,
        value,
      });
    }
  }

  // Add parent link if specified
  if (validatedParams.parentId) {
    const orgUrl = client.getOrgUrl();
    patchDocument.push({
      op: Operation.Add,
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `${orgUrl}/_apis/wit/workItems/${validatedParams.parentId}`,
        attributes: {
          name: "Parent",
        },
      },
    });
  }

  const createdItem = await witApi.createWorkItem(
    undefined,
    patchDocument,
    project,
    validatedParams.type
  );

  if (!createdItem || !createdItem.id) {
    throw new Error("Failed to create work item");
  }

  return {
    id: createdItem.id,
    title: createdItem.fields?.["System.Title"] || validatedParams.title,
    type: createdItem.fields?.["System.WorkItemType"] || validatedParams.type,
    state: createdItem.fields?.["System.State"] || "New",
    url: createdItem.url || "",
  };
}
