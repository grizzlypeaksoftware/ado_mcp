import * as azdev from "azure-devops-node-api";
import * as CoreApi from "azure-devops-node-api/CoreApi";
import * as WorkItemTrackingApi from "azure-devops-node-api/WorkItemTrackingApi";
import * as GitApi from "azure-devops-node-api/GitApi";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

export class AdoClient {
  private connection: azdev.WebApi;
  private orgUrl: string;
  private defaultProject?: string;

  private coreApi?: CoreApi.ICoreApi;
  private witApi?: WorkItemTrackingApi.IWorkItemTrackingApi;
  private gitApi?: GitApi.IGitApi;

  constructor(orgUrl: string, pat: string, defaultProject?: string) {
    this.orgUrl = orgUrl;
    this.defaultProject = defaultProject;

    const authHandler = azdev.getPersonalAccessTokenHandler(pat);
    this.connection = new azdev.WebApi(orgUrl, authHandler);
  }

  /**
   * Get the organization URL
   */
  getOrgUrl(): string {
    return this.orgUrl;
  }

  /**
   * Get the default project, if configured
   */
  getDefaultProject(): string | undefined {
    return this.defaultProject;
  }

  /**
   * Resolve project name - uses provided project or falls back to default
   */
  resolveProject(project?: string): string {
    const resolved = project || this.defaultProject;
    if (!resolved) {
      throw new Error(
        "Project is required. Provide a project parameter or set ADO_PROJECT environment variable."
      );
    }
    return resolved;
  }

  /**
   * Validate connection to Azure DevOps by fetching the authenticated user
   */
  async validateConnection(): Promise<void> {
    try {
      const connectionData = await this.connection.connect();
      if (!connectionData.authenticatedUser) {
        throw new Error("Failed to authenticate with Azure DevOps");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Azure DevOps: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the connection data including authenticated user info
   */
  async getConnectionData(): Promise<lim.ConnectionData> {
    return this.connection.connect();
  }

  /**
   * Get the Core API client
   */
  async getCoreApi(): Promise<CoreApi.ICoreApi> {
    if (!this.coreApi) {
      this.coreApi = await this.connection.getCoreApi();
    }
    return this.coreApi;
  }

  /**
   * Get the Work Item Tracking API client
   */
  async getWorkItemTrackingApi(): Promise<WorkItemTrackingApi.IWorkItemTrackingApi> {
    if (!this.witApi) {
      this.witApi = await this.connection.getWorkItemTrackingApi();
    }
    return this.witApi;
  }

  /**
   * Get the Git API client
   */
  async getGitApi(): Promise<GitApi.IGitApi> {
    if (!this.gitApi) {
      this.gitApi = await this.connection.getGitApi();
    }
    return this.gitApi;
  }
}
