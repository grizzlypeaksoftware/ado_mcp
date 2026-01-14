import express, { Express, Request, Response, NextFunction } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SessionManager, Session } from "../middleware/session.js";
import { createCorsMiddleware } from "../middleware/cors.js";

// JSON-RPC types (simplified for HTTP transport)
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

// JSON-RPC 2.0 Error Codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

export interface HttpTransportOptions {
  port: number;
  sessionTimeoutMinutes?: number;
}

export class HttpTransport {
  private app: Express;
  private server: Server;
  private sessionManager: SessionManager;
  private httpServer: ReturnType<Express["listen"]> | null = null;
  private port: number;
  private toolsHandler: ((request: any) => Promise<any>) | null = null;
  private callToolHandler: ((request: any) => Promise<any>) | null = null;

  constructor(mcpServer: Server, options: HttpTransportOptions) {
    this.server = mcpServer;
    this.port = options.port;
    this.sessionManager = new SessionManager(options.sessionTimeoutMinutes || 30);
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS middleware
    this.app.use(createCorsMiddleware());

    // JSON body parser
    this.app.use(express.json({ limit: "10mb" }));

    // Request logging (basic)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        sessions: this.sessionManager.getSessionCount(),
      });
    });

    // MCP endpoint - handles all JSON-RPC requests
    this.app.post("/mcp", async (req: Request, res: Response) => {
      await this.handleMcpRequest(req, res);
    });

    // Root endpoint - server info
    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        name: "azure-devops-mcp",
        version: "1.0.0",
        transport: "http",
        endpoints: {
          mcp: "POST /mcp",
          health: "GET /health",
        },
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: METHOD_NOT_FOUND,
          message: `Endpoint not found: ${req.method} ${req.path}`,
        },
        id: null,
      });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("Server error:", err);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: INTERNAL_ERROR,
          message: err.message || "Internal server error",
        },
        id: null,
      });
    });
  }

  private async handleMcpRequest(req: Request, res: Response): Promise<void> {
    // Get or create session
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const session = this.sessionManager.getOrCreateSession(sessionId);

    // Set session ID in response header
    res.setHeader("Mcp-Session-Id", session.id);

    // Parse and validate JSON-RPC request
    const body = req.body;

    if (!body || typeof body !== "object") {
      res.status(400).json(this.createErrorResponse(null, PARSE_ERROR, "Invalid JSON"));
      return;
    }

    // Handle batch requests
    if (Array.isArray(body)) {
      const responses = await Promise.all(
        body.map((request) => this.processRequest(request, session))
      );
      res.json(responses);
      return;
    }

    // Handle single request
    const response = await this.processRequest(body, session);
    res.json(response);
  }

  private async processRequest(
    request: any,
    session: Session
  ): Promise<JsonRpcResponse> {
    // Validate JSON-RPC structure
    if (!this.isValidRequest(request)) {
      return this.createErrorResponse(
        request.id || null,
        INVALID_REQUEST,
        "Invalid JSON-RPC request"
      );
    }

    const { method, params } = request;
    const id = request.id ?? null; // Coerce undefined to null

    try {
      let result: unknown;

      switch (method) {
        case "initialize":
          result = await this.handleInitialize(params);
          break;

        case "tools/list":
          result = await this.handleListTools();
          break;

        case "tools/call":
          result = await this.handleCallTool(params);
          break;

        case "ping":
          result = { pong: true };
          break;

        default:
          return this.createErrorResponse(
            id,
            METHOD_NOT_FOUND,
            `Method not found: ${method}`
          );
      }

      return {
        jsonrpc: "2.0",
        result,
        id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResponse(id, INTERNAL_ERROR, message);
    }
  }

  private isValidRequest(request: any): request is JsonRpcRequest {
    return (
      request &&
      typeof request === "object" &&
      request.jsonrpc === "2.0" &&
      typeof request.method === "string" &&
      (request.id === undefined ||
        request.id === null ||
        typeof request.id === "string" ||
        typeof request.id === "number")
    );
  }

  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string
  ): JsonRpcResponse {
    return {
      jsonrpc: "2.0",
      error: { code, message },
      id,
    };
  }

  private async handleInitialize(params: any): Promise<any> {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "azure-devops-mcp",
        version: "1.0.0",
      },
    };
  }

  private async handleListTools(): Promise<any> {
    if (this.toolsHandler) {
      return this.toolsHandler({});
    }
    return { tools: [] };
  }

  private async handleCallTool(params: any): Promise<any> {
    if (this.callToolHandler) {
      return this.callToolHandler({ params });
    }
    throw new Error("Tool handler not configured");
  }

  /**
   * Set the handler for listing tools
   */
  setToolsHandler(handler: (request: any) => Promise<any>): void {
    this.toolsHandler = handler;
  }

  /**
   * Set the handler for calling tools
   */
  setCallToolHandler(handler: (request: any) => Promise<any>): void {
    this.callToolHandler = handler;
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, () => {
          console.log(`MCP HTTP Server listening on port ${this.port}`);
          console.log(`Health check: http://localhost:${this.port}/health`);
          console.log(`MCP endpoint: http://localhost:${this.port}/mcp`);
          resolve();
        });

        this.httpServer.on("error", (error: NodeJS.ErrnoException) => {
          if (error.code === "EADDRINUSE") {
            console.error(`Port ${this.port} is already in use`);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.sessionManager.stop();
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log("MCP HTTP Server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the Express app (for testing)
   */
  getApp(): Express {
    return this.app;
  }
}
