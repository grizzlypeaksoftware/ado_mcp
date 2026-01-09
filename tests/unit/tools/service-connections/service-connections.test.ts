import { AdoClient } from "../../../../src/ado-client";
import { createMockAdoClientFull } from "../../../mocks/api-fixtures";
import { handleServiceConnectionTool } from "../../../../src/tools/service-connections/index";

describe("Service Connection Tools", () => {
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockClient = createMockAdoClientFull({});
  });

  // Note: Service connection operations return REST API guidance
  describe("listServiceConnections", () => {
    it("should return REST API guidance", async () => {
      const result = await handleServiceConnectionTool(
        mockClient as unknown as AdoClient,
        "list_service_connections",
        {}
      );

      expect(result).toHaveProperty("message");
      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("serviceendpoint");
    });

    it("should include type filter in guidance", async () => {
      const result = await handleServiceConnectionTool(
        mockClient as unknown as AdoClient,
        "list_service_connections",
        { type: "azurerm" }
      );

      expect((result as any).type).toBe("azurerm");
      expect((result as any).note).toContain("type=azurerm");
    });

    it("should use default project", async () => {
      const result = await handleServiceConnectionTool(
        mockClient as unknown as AdoClient,
        "list_service_connections",
        {}
      );

      expect((result as any).project).toBe("TestProject");
    });
  });

  describe("getServiceConnection", () => {
    it("should return REST API guidance", async () => {
      const result = await handleServiceConnectionTool(
        mockClient as unknown as AdoClient,
        "get_service_connection",
        { connectionId: "conn-123" }
      );

      expect((result as any).message).toContain("REST calls");
      expect((result as any).connectionId).toBe("conn-123");
    });

    it("should validate required parameters", async () => {
      await expect(
        handleServiceConnectionTool(
          mockClient as unknown as AdoClient,
          "get_service_connection",
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleServiceConnectionTool(
          mockClient as unknown as AdoClient,
          "unknown_tool",
          {}
        )
      ).rejects.toThrow("Unknown service connection tool");
    });
  });
});
