import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const deleteWorkItemSchema = z.object({
  id: z.number().describe("Work item ID"),
  permanent: z.boolean().optional().default(false).describe("Permanently delete vs send to recycle bin"),
});

export const deleteWorkItemTool = {
  name: "delete_work_item",
  description: "Delete or recycle a work item",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      permanent: {
        type: "boolean",
        description: "Permanently delete vs send to recycle bin, default false",
      },
    },
    required: ["id"],
  },
};

interface DeleteResult {
  id: number;
  deleted: boolean;
  permanent: boolean;
  message: string;
}

export async function deleteWorkItem(
  client: AdoClient,
  params: z.infer<typeof deleteWorkItemSchema>
): Promise<DeleteResult> {
  const validatedParams = deleteWorkItemSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  if (validatedParams.permanent) {
    // Permanently delete - first send to recycle bin, then destroy
    await witApi.deleteWorkItem(validatedParams.id);
    await witApi.destroyWorkItem(validatedParams.id);

    return {
      id: validatedParams.id,
      deleted: true,
      permanent: true,
      message: `Work item ${validatedParams.id} permanently deleted`,
    };
  } else {
    // Send to recycle bin
    const deletedItem = await witApi.deleteWorkItem(validatedParams.id);

    if (!deletedItem) {
      throw new Error(`Failed to delete work item ${validatedParams.id}`);
    }

    return {
      id: validatedParams.id,
      deleted: true,
      permanent: false,
      message: `Work item ${validatedParams.id} moved to recycle bin`,
    };
  }
}
