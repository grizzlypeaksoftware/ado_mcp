import { AdoClient } from "../../../../src/ado-client";
import { createMockAdoClientFull, mockFeed, mockPackage } from "../../../mocks/api-fixtures";
import { handleArtifactTool } from "../../../../src/tools/artifacts/index";

describe("Artifact Tools", () => {
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockClient = createMockAdoClientFull({});
  });

  // Note: Artifact operations return REST API guidance as the SDK doesn't fully support them
  describe("listFeeds", () => {
    it("should return REST API guidance", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "list_feeds", {});

      expect(result).toHaveProperty("message");
      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("packaging/feeds");
    });
  });

  describe("getFeed", () => {
    it("should return REST API guidance with feed info", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "get_feed", {
        feedId: "feed-1",
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).message).toContain("feed-1");
    });

    it("should validate required parameters", async () => {
      await expect(
        handleArtifactTool(mockClient as unknown as AdoClient, "get_feed", {})
      ).rejects.toThrow();
    });
  });

  describe("listPackages", () => {
    it("should return REST API guidance with feed info", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "list_packages", {
        feedId: "feed-1",
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).message).toContain("feed-1");
      expect((result as any).note).toContain("packages");
    });

    it("should accept protocol type filter", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "list_packages", {
        feedId: "feed-1",
        protocolType: "npm",
      });

      expect((result as any).message).toContain("REST calls");
    });
  });

  describe("getPackage", () => {
    it("should return REST API guidance with package info", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "get_package", {
        feedId: "feed-1",
        packageId: "pkg-1",
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).message).toContain("pkg-1");
      expect((result as any).message).toContain("feed-1");
    });
  });

  describe("getPackageVersions", () => {
    it("should return REST API guidance with version info", async () => {
      const result = await handleArtifactTool(mockClient as unknown as AdoClient, "get_package_versions", {
        feedId: "feed-1",
        packageId: "pkg-1",
      });

      expect((result as any).message).toContain("REST calls");
      expect((result as any).note).toContain("versions");
    });
  });

  describe("unknown tool", () => {
    it("should throw error for unknown tool name", async () => {
      await expect(
        handleArtifactTool(mockClient as unknown as AdoClient, "unknown_tool", {})
      ).rejects.toThrow("Unknown artifact tool");
    });
  });
});
