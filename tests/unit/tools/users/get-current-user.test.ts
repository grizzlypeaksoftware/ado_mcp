import { getCurrentUser } from "../../../../src/tools/users/get-current-user";
import { AdoClient } from "../../../../src/ado-client";

describe("getCurrentUser", () => {
  it("should return authenticated user info", async () => {
    const mockClient = {
      getConnectionData: jest.fn().mockResolvedValue({
        authenticatedUser: {
          id: "user-123",
          customDisplayName: "Test User",
          providerDisplayName: "test.user@example.com",
          isActive: true,
          properties: {
            Account: { $value: "test.user@example.com" },
          },
        },
        locationServiceData: {
          accessMappings: [
            { accessPoint: "https://dev.azure.com/testorg" },
          ],
        },
      }),
    };

    const result = await getCurrentUser(mockClient as unknown as AdoClient, {});

    expect(result).toEqual({
      id: "user-123",
      displayName: "Test User",
      email: "test.user@example.com",
      url: "https://dev.azure.com/testorg",
      providerDisplayName: "test.user@example.com",
      isActive: true,
    });
  });

  it("should throw error when no authenticated user", async () => {
    const mockClient = {
      getConnectionData: jest.fn().mockResolvedValue({}),
    };

    await expect(
      getCurrentUser(mockClient as unknown as AdoClient, {})
    ).rejects.toThrow("No authenticated user found");
  });

  it("should handle API errors", async () => {
    const mockClient = {
      getConnectionData: jest.fn().mockRejectedValue(new Error("Connection failed")),
    };

    await expect(
      getCurrentUser(mockClient as unknown as AdoClient, {})
    ).rejects.toThrow("Connection failed");
  });
});
