import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listSubscriptionsSchema = z.object({
  targetId: z.string().optional(),
});

// Tool definitions
export const listSubscriptionsTool = {
  name: "list_subscriptions",
  description: "List email/notification subscriptions that send alerts when events occur in Azure DevOps (e.g., work item changes, build completions). NOT for listing teams or boards.",
  inputSchema: {
    type: "object" as const,
    properties: {
      targetId: { type: "string", description: "Filter by subscriber ID" },
    },
    required: [],
  },
};

// Implementation - Note: Notifications API isn't in standard SDK
async function listSubscriptions(client: AdoClient, params: z.infer<typeof listSubscriptionsSchema>) {
  const validated = listSubscriptionsSchema.parse(params);
  return {
    message: "Notification subscriptions API requires direct REST calls.",
    note: "Use Azure DevOps REST API: GET {orgUrl}/_apis/notification/subscriptions",
    targetId: validated.targetId,
  };
}

export const notificationTools = [
  listSubscriptionsTool,
];

export async function handleNotificationTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_subscriptions": return listSubscriptions(client, args as any);
    default: throw new Error(`Unknown notification tool: ${toolName}`);
  }
}
