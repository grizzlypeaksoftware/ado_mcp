import { listRepositories } from "../../../../src/tools/git/list-repositories";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockGitApi,
  createMockAdoClient,
  mockRepositories,
} from "../../../mocks/git-fixtures";

describe("listRepositories", () => {
  let mockGitApi: ReturnType<typeof createMockGitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockGitApi = createMockGitApi();
    mockClient = createMockAdoClient(mockGitApi);
  });

  describe("happy path", () => {
    it("should return list of repositories", async () => {
      mockGitApi.getRepositories.mockResolvedValue(mockRepositories);

      const result = await listRepositories(mockClient as unknown as AdoClient, {});

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "repo-123-guid",
        name: "TestRepo",
        url: "https://dev.azure.com/testorg/TestProject/_git/TestRepo",
        defaultBranch: "main",
        project: {
          id: "project-123-guid",
          name: "TestProject",
        },
      });
    });

    it("should use specified project", async () => {
      mockGitApi.getRepositories.mockResolvedValue([]);

      await listRepositories(mockClient as unknown as AdoClient, {
        project: "CustomProject",
      });

      expect(mockClient.resolveProject).toHaveBeenCalledWith("CustomProject");
    });

    it("should return empty array when no repositories", async () => {
      mockGitApi.getRepositories.mockResolvedValue(null);

      const result = await listRepositories(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      mockGitApi.getRepositories.mockRejectedValue(new Error("API Error"));

      await expect(
        listRepositories(mockClient as unknown as AdoClient, {})
      ).rejects.toThrow("API Error");
    });
  });
});
