import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces.js";

/**
 * Base schema for type-specific create operations
 */
export const createTypedWorkItemBaseSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  title: z.string().describe("Title"),
  description: z.string().optional().describe("Description"),
  assignedTo: z.string().optional().describe("Email or display name"),
  areaPath: z.string().optional().describe("Area path"),
  iterationPath: z.string().optional().describe("Iteration/sprint path"),
  parentId: z.number().optional().describe("Parent work item ID to link to"),
  priority: z.number().min(1).max(4).optional().describe("Priority (1-4)"),
  tags: z.array(z.string()).optional().describe("Tags to apply"),
  additionalFields: z.record(z.unknown()).optional().describe("Key-value pairs for custom fields"),
});

/**
 * Result of creating a work item
 */
export interface CreatedWorkItem {
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

/**
 * Creates a work item of the specified type with the given parameters.
 */
export async function createTypedWorkItem(
  client: AdoClient,
  workItemType: string,
  params: z.infer<typeof createTypedWorkItemBaseSchema>,
  typeSpecificFields?: Record<string, unknown>
): Promise<CreatedWorkItem> {
  const validatedParams = createTypedWorkItemBaseSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const witApi = await client.getWorkItemTrackingApi();

  // Build patch document
  const patchDocument: PatchOperation[] = [];

  // Required field
  patchDocument.push({
    op: Operation.Add,
    path: "/fields/System.Title",
    value: validatedParams.title,
  });

  // Optional base fields
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

  // Add type-specific fields
  if (typeSpecificFields) {
    for (const [fieldPath, value] of Object.entries(typeSpecificFields)) {
      if (value !== undefined && value !== null) {
        patchDocument.push({
          op: Operation.Add,
          path: fieldPath.startsWith("/fields/") ? fieldPath : `/fields/${fieldPath}`,
          value,
        });
      }
    }
  }

  // Additional custom fields
  if (validatedParams.additionalFields) {
    for (const [key, value] of Object.entries(validatedParams.additionalFields)) {
      if (value !== undefined && value !== null) {
        const path = key.startsWith("/fields/") ? key : `/fields/${key}`;
        patchDocument.push({
          op: Operation.Add,
          path,
          value,
        });
      }
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
    workItemType
  );

  if (!createdItem || !createdItem.id) {
    throw new Error(`Failed to create ${workItemType}`);
  }

  return {
    id: createdItem.id,
    title: createdItem.fields?.["System.Title"] || validatedParams.title,
    type: createdItem.fields?.["System.WorkItemType"] || workItemType,
    state: createdItem.fields?.["System.State"] || "New",
    url: createdItem.url || "",
  };
}
