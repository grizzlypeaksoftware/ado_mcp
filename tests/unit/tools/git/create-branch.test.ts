import { createBranch } from "../../../../src/tools/git/create-branch";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockGitApi,
  createMockAdoClient,
  mockBranchRef,
  mockRefUpdateResult,
} from "../../../mocks/git-fixtures";

describe("createBranch", () => {
  let mockGitApi: ReturnType<typeof createMockGitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  beforeEach(() => {
    mockGitApi = createMockGitApi();
    mockClient = createMockAdoClient(mockGitApi);
  });

  describe("happy path", () => {
    it("should create a branch from default branch", async () => {
      mockGitApi.getRefs.mockResolvedValue([mockBranchRef]);
      mockGitApi.updateRefs.mockResolvedValue(mockRefUpdateResult);

      const result = await createBranch(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        name: "new-feature",
      });

      expect(result).toEqual({
        name: "new-feature",
        objectId: "abc123def456789",
      });

      expect(mockGitApi.updateRefs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "refs/heads/new-feature",
            oldObjectId: "0000000000000000000000000000000000000000",
            newObjectId: "abc123def456789",
          }),
        ]),
        "TestRepo",
        "TestProject"
      );
    });

    it("should create a branch from specified source branch", async () => {
      const featureBranchRef = {
        ...mockBranchRef,
        name: "refs/heads/develop",
        objectId: "develop-commit-id",
      };
      mockGitApi.getRefs.mockResolvedValue([featureBranchRef]);
      mockGitApi.updateRefs.mockResolvedValue([
        { success: true, newObjectId: "develop-commit-id" },
      ]);

      const result = await createBranch(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        name: "feature-branch",
        sourceBranch: "develop",
      });

      expect(result.objectId).toBe("develop-commit-id");
    });

    it("should create a branch from specific commit", async () => {
      mockGitApi.updateRefs.mockResolvedValue([
        { success: true, newObjectId: "specific-commit-id" },
      ]);

      const result = await createBranch(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        name: "hotfix",
        sourceCommitId: "specific-commit-id",
      });

      expect(result.objectId).toBe("specific-commit-id");
      expect(mockGitApi.getRefs).not.toHaveBeenCalled();
    });
  });

  describe("parameter validation", () => {
    it("should throw error when repository is missing", async () => {
      await expect(
        createBranch(mockClient as unknown as AdoClient, {
          name: "new-branch",
        } as { repository: string; name: string })
      ).rejects.toThrow();
    });

    it("should throw error when name is missing", async () => {
      await expect(
        createBranch(mockClient as unknown as AdoClient, {
          repository: "TestRepo",
        } as { repository: string; name: string })
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw error when source branch not found", async () => {
      mockGitApi.getRefs.mockResolvedValue([]);

      await expect(
        createBranch(mockClient as unknown as AdoClient, {
          repository: "TestRepo",
          name: "new-branch",
          sourceBranch: "nonexistent",
        })
      ).rejects.toThrow("Source branch 'nonexistent' not found");
    });

    it("should throw error when update fails", async () => {
      mockGitApi.getRefs.mockResolvedValue([mockBranchRef]);
      mockGitApi.updateRefs.mockResolvedValue([
        { success: false, customMessage: "Branch already exists" },
      ]);

      await expect(
        createBranch(mockClient as unknown as AdoClient, {
          repository: "TestRepo",
          name: "existing-branch",
        })
      ).rejects.toThrow("Failed to create branch: Branch already exists");
    });

    it("should handle API errors", async () => {
      mockGitApi.getRefs.mockRejectedValue(new Error("API Error"));

      await expect(
        createBranch(mockClient as unknown as AdoClient, {
          repository: "TestRepo",
          name: "new-branch",
        })
      ).rejects.toThrow("API Error");
    });
  });
});
