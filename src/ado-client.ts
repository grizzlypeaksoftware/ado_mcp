import * as azdev from "azure-devops-node-api";
import * as CoreApi from "azure-devops-node-api/CoreApi";
import * as WorkItemTrackingApi from "azure-devops-node-api/WorkItemTrackingApi";
import * as GitApi from "azure-devops-node-api/GitApi";
import * as WorkApi from "azure-devops-node-api/WorkApi";
import * as BuildApi from "azure-devops-node-api/BuildApi";
import * as ReleaseApi from "azure-devops-node-api/ReleaseApi";
import * as TestApi from "azure-devops-node-api/TestApi";
import * as WikiApi from "azure-devops-node-api/WikiApi";
import * as TaskAgentApi from "azure-devops-node-api/TaskAgentApi";
import * as PolicyApi from "azure-devops-node-api/PolicyApi";
import * as DashboardApi from "azure-devops-node-api/DashboardApi";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

export class AdoClient {
  private connection: azdev.WebApi;
  private orgUrl: string;
  private defaultProject?: string;

  private coreApi?: CoreApi.ICoreApi;
  private witApi?: WorkItemTrackingApi.IWorkItemTrackingApi;
  private gitApi?: GitApi.IGitApi;
  private workApi?: WorkApi.IWorkApi;
  private buildApi?: BuildApi.IBuildApi;
  private releaseApi?: ReleaseApi.IReleaseApi;
  private testApi?: TestApi.ITestApi;
  private wikiApi?: WikiApi.IWikiApi;
  private taskAgentApi?: TaskAgentApi.ITaskAgentApi;
  private policyApi?: PolicyApi.IPolicyApi;
  private dashboardApi?: DashboardApi.IDashboardApi;

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

  /**
   * Get the Work API client (for boards, iterations, etc.)
   */
  async getWorkApi(): Promise<WorkApi.IWorkApi> {
    if (!this.workApi) {
      this.workApi = await this.connection.getWorkApi();
    }
    return this.workApi;
  }

  /**
   * Get the Build API client
   */
  async getBuildApi(): Promise<BuildApi.IBuildApi> {
    if (!this.buildApi) {
      this.buildApi = await this.connection.getBuildApi();
    }
    return this.buildApi;
  }

  /**
   * Get the Release API client
   */
  async getReleaseApi(): Promise<ReleaseApi.IReleaseApi> {
    if (!this.releaseApi) {
      this.releaseApi = await this.connection.getReleaseApi();
    }
    return this.releaseApi;
  }

  /**
   * Get the Test API client
   */
  async getTestApi(): Promise<TestApi.ITestApi> {
    if (!this.testApi) {
      this.testApi = await this.connection.getTestApi();
    }
    return this.testApi;
  }

  /**
   * Get the Wiki API client
   */
  async getWikiApi(): Promise<WikiApi.IWikiApi> {
    if (!this.wikiApi) {
      this.wikiApi = await this.connection.getWikiApi();
    }
    return this.wikiApi;
  }

  /**
   * Get the Task Agent API client (for pipelines, variable groups, service connections)
   */
  async getTaskAgentApi(): Promise<TaskAgentApi.ITaskAgentApi> {
    if (!this.taskAgentApi) {
      this.taskAgentApi = await this.connection.getTaskAgentApi();
    }
    return this.taskAgentApi;
  }

  /**
   * Get the Policy API client
   */
  async getPolicyApi(): Promise<PolicyApi.IPolicyApi> {
    if (!this.policyApi) {
      this.policyApi = await this.connection.getPolicyApi();
    }
    return this.policyApi;
  }

  /**
   * Get the Dashboard API client
   */
  async getDashboardApi(): Promise<DashboardApi.IDashboardApi> {
    if (!this.dashboardApi) {
      this.dashboardApi = await this.connection.getDashboardApi();
    }
    return this.dashboardApi;
  }
}
