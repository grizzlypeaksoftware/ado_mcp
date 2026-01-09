import { searchUsers } from "../../../../src/tools/users/search-users";
import { getUser } from "../../../../src/tools/users/get-user";
import { AdoClient } from "../../../../src/ado-client";
import { createMockAdoClientFull, mockUser } from "../../../mocks/api-fixtures";

describe("User Tools (Extended)", () => {
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockClient = createMockAdoClientFull({});
    // Add mock for getConnectionData
    (mockClient as any).getConnectionData = jest.fn().mockResolvedValue({
      authenticatedUser: mockUser,
    });
  });

  describe("searchUsers", () => {
    it("should return guidance for user search", async () => {
      const result = await searchUsers(mockClient as unknown as AdoClient, {
        query: "test",
      } as any);

      // searchUsers returns guidance message since Graph API isn't in SDK
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].displayName).toContain("test");
      expect(result[0].email).toContain("Graph API");
    });

    it("should validate query parameter", async () => {
      await expect(
        searchUsers(mockClient as unknown as AdoClient, {} as any)
      ).rejects.toThrow();
    });

    it("should include query in response", async () => {
      const result = await searchUsers(mockClient as unknown as AdoClient, {
        query: "john@example.com",
      } as any);

      expect(result[0].displayName).toContain("john@example.com");
    });
  });

  describe("getUser", () => {
    it("should return guidance for get user", async () => {
      const result = await getUser(mockClient as unknown as AdoClient, {
        userId: "user-123",
      });

      // getUser returns guidance object
      expect(result).toHaveProperty("id");
      expect(result.id).toBe("user-123");
      expect(result.email).toContain("Graph API");
    });

    it("should validate userId parameter", async () => {
      await expect(
        getUser(mockClient as unknown as AdoClient, {} as any)
      ).rejects.toThrow();
    });
  });
});
