import { z } from "zod";

// Common parameter schemas
export const projectParam = z.string().optional().describe("Project name, defaults to ADO_PROJECT env var");

// Work Item types
export interface WorkItemSummary {
  id: number;
  title: string;
  state: string;
  type: string;
  assignedTo?: string;
  url: string;
}

export interface WorkItemDetails extends WorkItemSummary {
  description?: string;
  areaPath: string;
  iterationPath: string;
  priority?: number;
  tags?: string[];
  createdDate: string;
  changedDate: string;
  createdBy: string;
  changedBy: string;
  relations?: WorkItemRelation[];
  attachments?: WorkItemAttachment[];
  comments?: WorkItemComment[];
}

export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes: {
    name?: string;
    comment?: string;
  };
}

export interface WorkItemAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadDate: string;
}

export interface WorkItemComment {
  id: number;
  text: string;
  createdBy: string;
  createdDate: string;
}

// Git types
export interface RepositorySummary {
  id: string;
  name: string;
  url: string;
  defaultBranch?: string;
  project: {
    id: string;
    name: string;
  };
}

export interface BranchInfo {
  name: string;
  objectId: string;
  creator?: string;
  aheadCount?: number;
  behindCount?: number;
}

export interface CommitSummary {
  commitId: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface CommitDetails extends CommitSummary {
  changeCounts?: {
    add: number;
    edit: number;
    delete: number;
  };
  changes?: FileChange[];
}

export interface FileChange {
  path: string;
  changeType: string;
}

export interface FileItem {
  path: string;
  isFolder: boolean;
  size?: number;
  commitId?: string;
  url: string;
}

// Project types
export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  state: string;
  url: string;
}

export interface UserInfo {
  id: string;
  displayName: string;
  email?: string;
  url: string;
}

// Tool result type
export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
