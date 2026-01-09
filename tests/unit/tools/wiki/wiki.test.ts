import { listWikis } from "../../../../src/tools/wiki/list-wikis";
import { getWiki } from "../../../../src/tools/wiki/get-wiki";
import { getWikiPage } from "../../../../src/tools/wiki/get-wiki-page";
import { createWikiPage } from "../../../../src/tools/wiki/create-wiki-page";
import { updateWikiPage } from "../../../../src/tools/wiki/update-wiki-page";
import { deleteWikiPage } from "../../../../src/tools/wiki/delete-wiki-page";
import { listWikiPages } from "../../../../src/tools/wiki/list-wiki-pages";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWikiApi,
  createMockAdoClientFull,
  mockWiki,
} from "../../../mocks/api-fixtures";

describe("Wiki Tools", () => {
  let mockWikiApi: ReturnType<typeof createMockWikiApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWikiApi = createMockWikiApi();
    mockClient = createMockAdoClientFull({ wikiApi: mockWikiApi });
  });

  describe("listWikis", () => {
    it("should list wikis in a project", async () => {
      mockWikiApi.getAllWikis.mockResolvedValue([mockWiki]);

      const result = await listWikis(mockClient as unknown as AdoClient, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("wiki-1");
      expect(result[0].name).toBe("TestWiki");
      expect(result[0].type).toBe("projectWiki");
    });

    it("should return empty array when no wikis found", async () => {
      mockWikiApi.getAllWikis.mockResolvedValue(null);

      const result = await listWikis(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("getWiki", () => {
    it("should get wiki details", async () => {
      mockWikiApi.getWiki.mockResolvedValue(mockWiki);

      const result = await getWiki(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
      });

      expect(result.id).toBe("wiki-1");
      expect(result.name).toBe("TestWiki");
    });

    it("should throw error when wiki not found", async () => {
      mockWikiApi.getWiki.mockResolvedValue(null);

      await expect(
        getWiki(mockClient as unknown as AdoClient, { wikiId: "nonexistent" })
      ).rejects.toThrow("Wiki nonexistent not found");
    });
  });

  // Note: These tools return REST API guidance as the SDK doesn't support direct wiki page operations
  describe("getWikiPage", () => {
    it("should return REST API guidance", async () => {
      const result = await getWikiPage(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
        path: "/Home",
      } as any);

      expect(result.message).toContain("REST calls");
      expect(result.note).toContain("_apis/wiki");
    });
  });

  describe("createWikiPage", () => {
    it("should return REST API guidance", async () => {
      const result = await createWikiPage(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
        path: "/NewPage",
        content: "# New Page",
      });

      expect(result.message).toContain("REST calls");
      expect(result.path).toBe("/NewPage");
    });

    it("should validate required parameters", async () => {
      await expect(
        createWikiPage(mockClient as unknown as AdoClient, {
          wikiId: "wiki-1",
          path: "/NewPage",
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("updateWikiPage", () => {
    it("should return REST API guidance", async () => {
      const result = await updateWikiPage(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
        path: "/Home",
        content: "# Updated Content",
        version: "etag-123",
      });

      expect(result.message).toContain("REST calls");
      expect(result.note).toContain("If-Match");
    });
  });

  describe("deleteWikiPage", () => {
    it("should return REST API guidance", async () => {
      const result = await deleteWikiPage(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
        path: "/OldPage",
      });

      expect(result.message).toContain("REST calls");
      expect(result.note).toContain("DELETE");
    });
  });

  describe("listWikiPages", () => {
    it("should return REST API guidance", async () => {
      const result = await listWikiPages(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
      } as any);

      expect(result.message).toContain("REST calls");
      expect(result.note).toContain("recursionLevel");
    });

    it("should use provided path", async () => {
      const result = await listWikiPages(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
        path: "/Docs",
      } as any);

      expect(result.path).toBe("/Docs");
    });

    it("should default to root path", async () => {
      const result = await listWikiPages(mockClient as unknown as AdoClient, {
        wikiId: "wiki-1",
      } as any);

      expect(result.path).toBe("/");
    });
  });
});
