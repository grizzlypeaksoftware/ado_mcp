import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { UserInfo } from "../../types.js";

export const getUserSchema = z.object({
  userId: z.string().describe("User ID or email"),
});

export const getUserTool = {
  name: "get_user",
  description: "Get detailed information about a specific user by ID or email. Note: This tool returns REST API guidance as direct user lookup requires the Azure DevOps Graph API, which isn't available in the standard SDK.",
  inputSchema: {
    type: "object" as const,
    properties: {
      userId: {
        type: "string",
        description: "User ID or email",
      },
    },
    required: ["userId"],
  },
};

export async function getUser(
  client: AdoClient,
  params: z.infer<typeof getUserSchema>
): Promise<UserInfo> {
  const validatedParams = getUserSchema.parse(params);

  // Note: Direct user lookup by ID/email requires the Graph API
  // This is a simplified implementation
  return {
    id: validatedParams.userId,
    displayName: `User lookup for '${validatedParams.userId}' requires Azure DevOps Graph API`,
    email: "Use the Graph API endpoint: GET {orgUrl}/_apis/graph/users/{userId}",
    url: "",
  };
}
