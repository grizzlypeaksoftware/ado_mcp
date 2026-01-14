import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { UserInfo } from "../../types.js";

export const getCurrentUserSchema = z.object({});

export const getCurrentUserTool = {
  name: "get_current_user",
  description: "Get information about the currently authenticated user (the PAT owner). Returns user ID, display name, email, and active status. Use this to verify authentication or get the current user's identity for filtering.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

interface CurrentUserInfo extends UserInfo {
  providerDisplayName?: string;
  isActive?: boolean;
}

export async function getCurrentUser(
  client: AdoClient,
  _params: z.infer<typeof getCurrentUserSchema>
): Promise<CurrentUserInfo> {
  const connectionData = await client.getConnectionData();

  if (!connectionData.authenticatedUser) {
    throw new Error("No authenticated user found");
  }

  const user = connectionData.authenticatedUser;

  return {
    id: user.id || "",
    displayName: user.customDisplayName || user.providerDisplayName || "",
    email: user.properties?.Account?.$value as string | undefined,
    url: connectionData.locationServiceData?.accessMappings?.[0]?.accessPoint || "",
    providerDisplayName: user.providerDisplayName,
    isActive: user.isActive,
  };
}
