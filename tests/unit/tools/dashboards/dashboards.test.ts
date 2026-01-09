import { AdoClient } from "../../../../src/ado-client";
import { createMockAdoClientFull } from "../../../mocks/api-fixtures";
import { handleDashboardTool } from "../../../../src/tools/dashboards/index";

describe("Dashboard Tools", () => {
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockClient = createMockAdoClientFull({});
  });

  describe("listDashboards", () => {
    it("should return REST API guidance", async () => {
      const result = await handleDashboardTool(
        mockClient as unknown as AdoClient,
        "list_dashboards",
        {}
      );

      expect(result).toHaveProperty("message");
      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("dashboard/dashboards");
    });

    it("should include team in guidance when provided", async () => {
      const result = await handleDashboardTool(
        mockClient as unknown as AdoClient,
        "list_dashboards",
        { team: "MyTeam" }
      );

      expect((result as any).team).toBe("MyTeam");
      expect((result as any).note).toContain("MyTeam");
    });

    it("should use default project", async () => {
      const result = await handleDashboardTool(
        mockClient as unknown as AdoClient,
        "list_dashboards",
        {}
      );

      expect((result as any).project).toBe("TestProject");
    });
  });

  describe("getDashboard", () => {
    it("should return REST API guidance", async () => {
      const result = await handleDashboardTool(
        mockClient as unknown as AdoClient,
        "get_dashboard",
        { dashboardId: "dash-123" }
      );

      expect((result as any).message).toContain("REST calls");
      expect((result as any).dashboardId).toBe("dash-123");
    });

    it("should validate required parameters", async () => {
      await expect(
        handleDashboardTool(
          mockClient as unknown as AdoClient,
          "get_dashboard",
          {}
        )
      ).rejects.toThrow();
    });

    it("should include team when provided", async () => {
      const result = await handleDashboardTool(
        mockClient as unknown as AdoClient,
        "get_dashboard",
        { dashboardId: "dash-123", team: "DevTeam" }
      );

      expect((result as any).team).toBe("DevTeam");
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleDashboardTool(
          mockClient as unknown as AdoClient,
          "unknown_tool",
          {}
        )
      ).rejects.toThrow("Unknown dashboard tool");
    });
  });
});
