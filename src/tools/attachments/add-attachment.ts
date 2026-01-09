import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

export const addWorkItemAttachmentSchema = z.object({
  id: z.number().describe("Work item ID"),
  filePath: z.string().describe("Path to file to upload"),
  fileName: z.string().optional().describe("Override filename"),
  comment: z.string().optional().describe("Attachment comment"),
});

export const addWorkItemAttachmentTool = {
  name: "add_work_item_attachment",
  description: "Add an attachment to a work item",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      filePath: {
        type: "string",
        description: "Path to file to upload",
      },
      fileName: {
        type: "string",
        description: "Override filename",
      },
      comment: {
        type: "string",
        description: "Attachment comment",
      },
    },
    required: ["id", "filePath"],
  },
};

export interface AttachmentResult {
  id: string;
  name: string;
  url: string;
  size: number;
}

export async function addWorkItemAttachment(
  client: AdoClient,
  params: z.infer<typeof addWorkItemAttachmentSchema>
): Promise<AttachmentResult> {
  const validatedParams = addWorkItemAttachmentSchema.parse(params);

  // Read the file
  if (!fs.existsSync(validatedParams.filePath)) {
    throw new Error(`File not found: ${validatedParams.filePath}`);
  }

  const fileContent = fs.readFileSync(validatedParams.filePath);
  const fileName = validatedParams.fileName || path.basename(validatedParams.filePath);

  const witApi = await client.getWorkItemTrackingApi();

  // Upload the attachment using a readable stream
  const stream = Readable.from(fileContent);
  const attachment = await witApi.createAttachment(
    undefined, // customHeaders
    stream,
    undefined, // project
    fileName
  );

  if (!attachment || !attachment.url) {
    throw new Error("Failed to upload attachment");
  }

  // Link the attachment to the work item
  const patchDocument = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "AttachedFile",
        url: attachment.url,
        attributes: {
          comment: validatedParams.comment || "",
        },
      },
    },
  ];

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.id
  );

  return {
    id: attachment.id || "",
    name: fileName,
    url: attachment.url,
    size: fileContent.length,
  };
}
