import { AdoClient } from "../../ado-client.js";

// Import all pull request tools
import { listPullRequestsTool, listPullRequests } from "./list-pull-requests.js";
import { getPullRequestTool, getPullRequest } from "./get-pull-request.js";
import { createPullRequestTool, createPullRequest } from "./create-pull-request.js";
import { updatePullRequestTool, updatePullRequest } from "./update-pull-request.js";
import { addPullRequestReviewerTool, addPullRequestReviewer } from "./add-reviewer.js";
import { removePullRequestReviewerTool, removePullRequestReviewer } from "./remove-reviewer.js";
import { addPullRequestCommentTool, addPullRequestComment } from "./add-comment.js";
import { getPullRequestCommentsTool, getPullRequestComments } from "./get-comments.js";
import { completePullRequestTool, completePullRequest } from "./complete-pull-request.js";
import { getPullRequestWorkItemsTool, getPullRequestWorkItems } from "./get-work-items.js";
import { linkPullRequestWorkItemTool, linkPullRequestWorkItem } from "./link-work-item.js";

// Export all tool definitions
export const pullRequestTools = [
  listPullRequestsTool,
  getPullRequestTool,
  createPullRequestTool,
  updatePullRequestTool,
  addPullRequestReviewerTool,
  removePullRequestReviewerTool,
  addPullRequestCommentTool,
  getPullRequestCommentsTool,
  completePullRequestTool,
  getPullRequestWorkItemsTool,
  linkPullRequestWorkItemTool,
];

// Tool handler router
export async function handlePullRequestTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_pull_requests":
      return listPullRequests(client, args as Parameters<typeof listPullRequests>[1]);
    case "get_pull_request":
      return getPullRequest(client, args as Parameters<typeof getPullRequest>[1]);
    case "create_pull_request":
      return createPullRequest(client, args as Parameters<typeof createPullRequest>[1]);
    case "update_pull_request":
      return updatePullRequest(client, args as Parameters<typeof updatePullRequest>[1]);
    case "add_pull_request_reviewer":
      return addPullRequestReviewer(client, args as Parameters<typeof addPullRequestReviewer>[1]);
    case "remove_pull_request_reviewer":
      return removePullRequestReviewer(client, args as Parameters<typeof removePullRequestReviewer>[1]);
    case "add_pull_request_comment":
      return addPullRequestComment(client, args as Parameters<typeof addPullRequestComment>[1]);
    case "get_pull_request_comments":
      return getPullRequestComments(client, args as Parameters<typeof getPullRequestComments>[1]);
    case "complete_pull_request":
      return completePullRequest(client, args as Parameters<typeof completePullRequest>[1]);
    case "get_pull_request_work_items":
      return getPullRequestWorkItems(client, args as Parameters<typeof getPullRequestWorkItems>[1]);
    case "link_pull_request_work_item":
      return linkPullRequestWorkItem(client, args as Parameters<typeof linkPullRequestWorkItem>[1]);
    default:
      throw new Error(`Unknown pull request tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listPullRequestsTool,
  listPullRequests,
  getPullRequestTool,
  getPullRequest,
  createPullRequestTool,
  createPullRequest,
  updatePullRequestTool,
  updatePullRequest,
  addPullRequestReviewerTool,
  addPullRequestReviewer,
  removePullRequestReviewerTool,
  removePullRequestReviewer,
  addPullRequestCommentTool,
  addPullRequestComment,
  getPullRequestCommentsTool,
  getPullRequestComments,
  completePullRequestTool,
  completePullRequest,
  getPullRequestWorkItemsTool,
  getPullRequestWorkItems,
  linkPullRequestWorkItemTool,
  linkPullRequestWorkItem,
};
