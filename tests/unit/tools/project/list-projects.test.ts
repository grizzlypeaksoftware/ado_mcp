import { listProjects } from "../../../../src/tools/project/list-projects";
import { AdoClient } from "../../../../src/ado-client";

const mockCoreApi = {
  getProjects: jest.fn(),
  getProject: jest.fn(),
};

const mockClient = {
  getCoreApi: jest.fn().mockResolvedValue(mockCoreApi),
};

describe("listProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("happy path", () => {
    it("should return list of projects", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "Project One",
          description: "First project",
          state: 0,
          url: "https://dev.azure.com/org/_apis/projects/project-1",
        },
        {
          id: "project-2",
          name: "Project Two",
          state: 0,
          url: "https://dev.azure.com/org/_apis/projects/project-2",
        },
      ];

      mockCoreApi.getProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(
        mockClient as unknown as AdoClient,
        { stateFilter: "all" }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "project-1",
        name: "Project One",
        description: "First project",
        state: "0",
        url: "https://dev.azure.com/org/_apis/projects/project-1",
      });
    });

    it("should filter by state when specified", async () => {
      mockCoreApi.getProjects.mockResolvedValue([]);

      await listProjects(mockClient as unknown as AdoClient, {
        stateFilter: "wellFormed",
      });

      expect(mockCoreApi.getProjects).toHaveBeenCalledWith(0);
    });

    it("should return empty array when no projects", async () => {
      mockCoreApi.getProjects.mockResolvedValue(null);

      const result = await listProjects(
        mockClient as unknown as AdoClient,
        { stateFilter: "all" }
      );

      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockCoreApi.getProjects.mockRejectedValue(new Error("API Error"));

      await expect(
        listProjects(mockClient as unknown as AdoClient, { stateFilter: "all" })
      ).rejects.toThrow("API Error");
    });
  });
});
