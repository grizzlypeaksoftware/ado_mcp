import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { UserInfo } from "../../types.js";

export const getUserSchema = z.object({
  userId: z.string().describe("User ID or email"),
});

export const getUserTool = {
  name: "get_user",
  description: "Get details for a user",
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
