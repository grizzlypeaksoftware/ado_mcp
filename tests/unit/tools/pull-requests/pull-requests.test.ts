import { listPullRequests } from "../../../../src/tools/pull-requests/list-pull-requests";
import { getPullRequest } from "../../../../src/tools/pull-requests/get-pull-request";
import { createPullRequest } from "../../../../src/tools/pull-requests/create-pull-request";
import { updatePullRequest } from "../../../../src/tools/pull-requests/update-pull-request";
import { addPullRequestReviewer } from "../../../../src/tools/pull-requests/add-reviewer";
import { removePullRequestReviewer } from "../../../../src/tools/pull-requests/remove-reviewer";
import { addPullRequestComment } from "../../../../src/tools/pull-requests/add-comment";
import { getPullRequestComments } from "../../../../src/tools/pull-requests/get-comments";
import { completePullRequest } from "../../../../src/tools/pull-requests/complete-pull-request";
import { getPullRequestWorkItems } from "../../../../src/tools/pull-requests/get-work-items";
import { linkPullRequestWorkItem } from "../../../../src/tools/pull-requests/link-work-item";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockGitApi,
  createMockAdoClientFull,
  mockPullRequest,
  mockPullRequestThread,
  mockCommit,
} from "../../../mocks/api-fixtures";

describe("Pull Request Tools", () => {
  let mockGitApi: ReturnType<typeof createMockGitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockGitApi = createMockGitApi();
    mockClient = createMockAdoClientFull({ gitApi: mockGitApi });
  });

  describe("listPullRequests", () => {
    it("should list pull requests", async () => {
      mockGitApi.getPullRequests.mockResolvedValue([mockPullRequest]);

      const result = await listPullRequests(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
      } as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe("Test PR");
    });

    it("should filter by status", async () => {
      mockGitApi.getPullRequests.mockResolvedValue([mockPullRequest]);

      await listPullRequests(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        status: "active",
      } as any);

      const searchCriteria = mockGitApi.getPullRequests.mock.calls[0][1];
      expect(searchCriteria.status).toBe(1); // active = 1
    });

    it("should return empty array when no PRs found", async () => {
      mockGitApi.getPullRequests.mockResolvedValue([]);

      const result = await listPullRequests(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
      } as any);

      expect(result).toEqual([]);
    });
  });

  describe("getPullRequest", () => {
    it("should get pull request details", async () => {
      mockGitApi.getPullRequest.mockResolvedValue(mockPullRequest);
      mockGitApi.getPullRequestCommits.mockResolvedValue([mockCommit]);
      mockGitApi.getPullRequestWorkItemRefs.mockResolvedValue([]);

      const result = await getPullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
      } as any);

      expect(result.id).toBe(1);
      expect(result.title).toBe("Test PR");
      expect(result.sourceBranch).toBe("feature");
    });

    it("should throw error when PR not found", async () => {
      mockGitApi.getPullRequest.mockResolvedValue(null);

      await expect(
        getPullRequest(mockClient as unknown as AdoClient, {
          repository: "TestRepo",
          pullRequestId: 999,
          includeCommits: false,
          includeWorkItems: false,
        } as any)
      ).rejects.toThrow("Pull request 999 not found");
    });
  });

  describe("createPullRequest", () => {
    it("should create a new pull request", async () => {
      mockGitApi.createPullRequest.mockResolvedValue(mockPullRequest);

      const result = await createPullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        sourceBranch: "feature",
        targetBranch: "main",
        title: "New PR",
        description: "PR description",
      } as any);

      expect(result.id).toBe(1);
      expect(mockGitApi.createPullRequest).toHaveBeenCalled();
    });

    it("should set reviewers when provided", async () => {
      mockGitApi.createPullRequest.mockResolvedValue(mockPullRequest);

      await createPullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        sourceBranch: "feature",
        targetBranch: "main",
        title: "New PR",
        reviewers: ["user1@example.com", "user2@example.com"],
      } as any);

      const prArg = mockGitApi.createPullRequest.mock.calls[0][0];
      expect(prArg.reviewers).toHaveLength(2);
    });
  });

  describe("updatePullRequest", () => {
    it("should update pull request title", async () => {
      mockGitApi.updatePullRequest.mockResolvedValue({ ...mockPullRequest, title: "Updated Title" });

      const result = await updatePullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");
    });

    it("should update pull request status", async () => {
      mockGitApi.updatePullRequest.mockResolvedValue(mockPullRequest);

      await updatePullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        status: "abandoned",
      });

      expect(mockGitApi.updatePullRequest).toHaveBeenCalled();
    });
  });

  describe("addPullRequestReviewer", () => {
    it("should add a reviewer to PR", async () => {
      mockGitApi.createPullRequestReviewer.mockResolvedValue({
        id: "reviewer-1",
        displayName: "Reviewer",
        vote: 0,
      });

      const result = await addPullRequestReviewer(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        reviewer: "reviewer-1",
      } as any);

      expect(result.success).toBe(true);
      expect(result.reviewer).toBe("reviewer-1");
    });
  });

  describe("removePullRequestReviewer", () => {
    it("should remove a reviewer from PR", async () => {
      mockGitApi.deletePullRequestReviewer.mockResolvedValue(undefined);

      const result = await removePullRequestReviewer(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        reviewer: "reviewer-1",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("addPullRequestComment", () => {
    it("should add a comment to PR", async () => {
      mockGitApi.createThread.mockResolvedValue(mockPullRequestThread);

      const result = await addPullRequestComment(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        content: "Test comment",
      });

      expect(result.success).toBe(true);
      expect(result.threadId).toBeDefined();
    });
  });

  describe("getPullRequestComments", () => {
    it("should get PR comments", async () => {
      mockGitApi.getThreads.mockResolvedValue([mockPullRequestThread]);

      const result = await getPullRequestComments(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].comments).toHaveLength(1);
    });
  });

  describe("completePullRequest", () => {
    it("should complete/merge a PR", async () => {
      mockGitApi.getPullRequest.mockResolvedValue(mockPullRequest);
      mockGitApi.updatePullRequest.mockResolvedValue({
        ...mockPullRequest,
        status: 3, // completed
      });

      const result = await completePullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
      } as any);

      expect(result.status).toBe("completed");
      expect(result.message).toContain("completed");
    });

    it("should delete source branch when specified", async () => {
      mockGitApi.getPullRequest.mockResolvedValue(mockPullRequest);
      mockGitApi.updatePullRequest.mockResolvedValue({
        ...mockPullRequest,
        status: 3,
      });

      await completePullRequest(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        deleteSourceBranch: true,
      } as any);

      const updateArg = mockGitApi.updatePullRequest.mock.calls[0][0];
      expect(updateArg.completionOptions.deleteSourceBranch).toBe(true);
    });
  });

  describe("getPullRequestWorkItems", () => {
    it("should get linked work items", async () => {
      mockGitApi.getPullRequestWorkItemRefs.mockResolvedValue([
        { id: "123", url: "https://dev.azure.com/testorg/_apis/wit/workItems/123" },
        { id: "456", url: "https://dev.azure.com/testorg/_apis/wit/workItems/456" },
      ]);
      // Also need to mock witApi.getWorkItems since the function fetches full work items
      (mockClient as any).getWorkItemTrackingApi = jest.fn().mockResolvedValue({
        getWorkItems: jest.fn().mockResolvedValue([
          { id: 123, fields: { "System.Title": "Test WI 1", "System.State": "Active", "System.WorkItemType": "Bug" } },
          { id: 456, fields: { "System.Title": "Test WI 2", "System.State": "New", "System.WorkItemType": "Task" } },
        ]),
      });

      const result = await getPullRequestWorkItems(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(123);
    });
  });

  describe("linkPullRequestWorkItem", () => {
    it("should link a work item to PR", async () => {
      mockGitApi.getPullRequest.mockResolvedValue(mockPullRequest);

      const result = await linkPullRequestWorkItem(mockClient as unknown as AdoClient, {
        repository: "TestRepo",
        pullRequestId: 1,
        workItemId: 123,
      });

      expect(result.success).toBe(true);
      expect(result.workItemId).toBe(123);
    });
  });
});
