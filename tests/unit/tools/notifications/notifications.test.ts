import { AdoClient } from "../../../../src/ado-client";
import { createMockAdoClientFull } from "../../../mocks/api-fixtures";
import { handleNotificationTool } from "../../../../src/tools/notifications/index";

describe("Notification Tools", () => {
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockClient = createMockAdoClientFull({});
  });

  describe("listSubscriptions", () => {
    it("should return REST API guidance", async () => {
      const result = await handleNotificationTool(
        mockClient as unknown as AdoClient,
        "list_subscriptions",
        {}
      );

      expect(result).toHaveProperty("message");
      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("notification/subscriptions");
    });

    it("should include targetId filter when provided", async () => {
      const result = await handleNotificationTool(
        mockClient as unknown as AdoClient,
        "list_subscriptions",
        { targetId: "user-123" }
      );

      expect((result as any).targetId).toBe("user-123");
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleNotificationTool(
          mockClient as unknown as AdoClient,
          "unknown_tool",
          {}
        )
      ).rejects.toThrow("Unknown notification tool");
    });
  });
});
