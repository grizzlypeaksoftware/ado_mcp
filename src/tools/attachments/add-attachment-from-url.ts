import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { Readable } from "stream";

export const addWorkItemAttachmentFromUrlSchema = z.object({
  id: z.number().describe("Work item ID"),
  url: z.string().url().describe("URL of file to attach"),
  fileName: z.string().describe("Name for the attachment"),
  comment: z.string().optional().describe("Attachment comment"),
});

export const addWorkItemAttachmentFromUrlTool = {
  name: "add_work_item_attachment_from_url",
  description: "Download a file from a URL and attach it to a work item. Useful for attaching screenshots, logs, or documents from web sources. Specify a filename for the attachment and optionally add a comment.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      url: {
        type: "string",
        description: "URL of file to attach",
      },
      fileName: {
        type: "string",
        description: "Name for the attachment",
      },
      comment: {
        type: "string",
        description: "Attachment comment",
      },
    },
    required: ["id", "url", "fileName"],
  },
};

export interface AttachmentResult {
  id: string;
  name: string;
  url: string;
  size: number;
}

export async function addWorkItemAttachmentFromUrl(
  client: AdoClient,
  params: z.infer<typeof addWorkItemAttachmentFromUrlSchema>
): Promise<AttachmentResult> {
  const validatedParams = addWorkItemAttachmentFromUrlSchema.parse(params);

  // Fetch the file from the URL
  const response = await fetch(validatedParams.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileContent = Buffer.from(arrayBuffer);

  const witApi = await client.getWorkItemTrackingApi();

  // Upload the attachment using a readable stream
  const stream = Readable.from(fileContent);
  const attachment = await witApi.createAttachment(
    undefined, // customHeaders
    stream,
    undefined, // project
    validatedParams.fileName
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
    name: validatedParams.fileName,
    url: attachment.url,
    size: fileContent.length,
  };
}
