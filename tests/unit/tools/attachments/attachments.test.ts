import { addWorkItemAttachment } from "../../../../src/tools/attachments/add-attachment";
import { addWorkItemAttachmentFromUrl } from "../../../../src/tools/attachments/add-attachment-from-url";
import { listWorkItemAttachments } from "../../../../src/tools/attachments/list-attachments";
import { removeWorkItemAttachment } from "../../../../src/tools/attachments/remove-attachment";
import { AdoClient } from "../../../../src/ado-client";
import { createMockWitApi, createMockAdoClientFull, mockAttachment } from "../../../mocks/api-fixtures";
import * as fs from "fs";

jest.mock("fs");

describe("Attachment Tools", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({ witApi: mockWitApi });
    jest.clearAllMocks();
  });

  describe("addWorkItemAttachment", () => {
    it("should add attachment from file path", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("test content"));
      mockWitApi.createAttachment.mockResolvedValue({ id: "att-1", url: "https://example.com/attachment" });
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await addWorkItemAttachment(mockClient as unknown as AdoClient, {
        id: 123,
        filePath: "/path/to/file.txt",
      });

      expect(result.id).toBe("att-1");
      expect(result.url).toBe("https://example.com/attachment");
      expect(mockWitApi.createAttachment).toHaveBeenCalled();
      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });

    it("should throw error when file not found", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        addWorkItemAttachment(mockClient as unknown as AdoClient, {
          id: 123,
          filePath: "/nonexistent/file.txt",
        })
      ).rejects.toThrow("File not found");
    });

    it("should use custom filename when provided", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("test"));
      mockWitApi.createAttachment.mockResolvedValue({ id: "att-1", url: "https://example.com/attachment" });
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await addWorkItemAttachment(mockClient as unknown as AdoClient, {
        id: 123,
        filePath: "/path/to/file.txt",
        fileName: "custom-name.txt",
      });

      expect(result.name).toBe("custom-name.txt");
    });
  });

  describe("addWorkItemAttachmentFromUrl", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it("should add attachment from URL", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      });
      mockWitApi.createAttachment.mockResolvedValue({ id: "att-1", url: "https://example.com/attachment" });
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await addWorkItemAttachmentFromUrl(mockClient as unknown as AdoClient, {
        id: 123,
        url: "https://example.com/file.pdf",
        fileName: "file.pdf",
      });

      expect(result.id).toBe("att-1");
      expect(global.fetch).toHaveBeenCalledWith("https://example.com/file.pdf");
    });

    it("should throw error when URL fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        addWorkItemAttachmentFromUrl(mockClient as unknown as AdoClient, {
          id: 123,
          url: "https://example.com/missing.pdf",
          fileName: "file.pdf",
        })
      ).rejects.toThrow("Failed to fetch file from URL");
    });
  });

  describe("listWorkItemAttachments", () => {
    it("should list attachments on a work item", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/att-1",
            attributes: { name: "file1.txt", resourceSize: 1024 },
          },
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/att-2",
            attributes: { name: "file2.pdf", resourceSize: 2048 },
          },
        ],
      });

      const result = await listWorkItemAttachments(mockClient as unknown as AdoClient, {
        id: 123,
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("file1.txt");
      expect(result[1].name).toBe("file2.pdf");
    });

    it("should return empty array when no attachments", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [],
      });

      const result = await listWorkItemAttachments(mockClient as unknown as AdoClient, {
        id: 123,
      });

      expect(result).toEqual([]);
    });

    it("should filter out non-attachment relations", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/att-1",
            attributes: { name: "file1.txt" },
          },
          {
            rel: "System.LinkTypes.Hierarchy-Forward",
            url: "https://dev.azure.com/testorg/_apis/wit/workItems/456",
            attributes: { name: "Child" },
          },
        ],
      });

      const result = await listWorkItemAttachments(mockClient as unknown as AdoClient, {
        id: 123,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("removeWorkItemAttachment", () => {
    it("should remove an attachment", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/att-1",
            attributes: { name: "file1.txt" },
          },
        ],
      });
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 123 });

      const result = await removeWorkItemAttachment(mockClient as unknown as AdoClient, {
        id: 123,
        attachmentId: "att-1",
      });

      expect(result.success).toBe(true);
      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });

    it("should throw error when work item has no attachments", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: null,
      });

      await expect(
        removeWorkItemAttachment(mockClient as unknown as AdoClient, {
          id: 123,
          attachmentId: "att-nonexistent",
        })
      ).rejects.toThrow("has no attachments");
    });

    it("should throw error when attachment not found", async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 123,
        relations: [
          {
            rel: "AttachedFile",
            url: "https://dev.azure.com/testorg/_apis/wit/attachments/other-att",
            attributes: { name: "other.txt" },
          },
        ],
      });

      await expect(
        removeWorkItemAttachment(mockClient as unknown as AdoClient, {
          id: 123,
          attachmentId: "nonexistent",
        })
      ).rejects.toThrow("not found on work item");
    });
  });
});
