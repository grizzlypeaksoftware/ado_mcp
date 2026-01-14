import request from "supertest";
import express, { Express } from "express";
import { SessionManager } from "../src/middleware/session";
import { createCorsMiddleware } from "../src/middleware/cors";

// Create a minimal test server that mimics HttpTransport behavior
function createTestServer(): { app: Express; sessionManager: SessionManager } {
  const app = express();
  const sessionManager = new SessionManager(30);

  app.use(express.json());
  app.use(createCorsMiddleware());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      sessions: sessionManager.getSessionCount(),
    });
  });

  // MCP endpoint for JSON-RPC
  app.post("/mcp", (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const session = sessionManager.getOrCreateSession(sessionId);

    res.setHeader("Mcp-Session-Id", session.id);

    const { method, params, id } = req.body;

    // Handle different methods
    switch (method) {
      case "initialize":
        res.json({
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "azure-devops-mcp-test",
              version: "1.0.0",
            },
          },
          id: id ?? null,
        });
        break;

      case "tools/list":
        res.json({
          jsonrpc: "2.0",
          result: {
            tools: [
              {
                name: "test_tool",
                description: "A test tool",
                inputSchema: {
                  type: "object",
                  properties: {},
                },
              },
            ],
          },
          id: id ?? null,
        });
        break;

      case "tools/call":
        const toolName = (params as { name: string })?.name;
        if (toolName === "test_tool") {
          res.json({
            jsonrpc: "2.0",
            result: {
              content: [{ type: "text", text: "Test tool executed" }],
            },
            id: id ?? null,
          });
        } else {
          res.json({
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: `Unknown tool: ${toolName}`,
            },
            id: id ?? null,
          });
        }
        break;

      case "ping":
        res.json({
          jsonrpc: "2.0",
          result: {},
          id: id ?? null,
        });
        break;

      default:
        res.json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
          id: id ?? null,
        });
    }
  });

  return { app, sessionManager };
}

describe("HTTP Integration Tests", () => {
  let app: Express;
  let sessionManager: SessionManager;

  beforeAll(() => {
    const result = createTestServer();
    app = result.app;
    sessionManager = result.sessionManager;
  });

  afterAll(() => {
    sessionManager.stop();
  });

  describe("Health Check Endpoint", () => {
    it("should return healthy status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.sessions).toBe("number");
    });

    it("should return JSON content type", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("MCP Endpoint - Initialize", () => {
    it("should handle initialize request", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.result).toBeDefined();
      expect(response.body.result.protocolVersion).toBe("2024-11-05");
      expect(response.body.result.serverInfo.name).toBe("azure-devops-mcp-test");
      expect(response.body.id).toBe(1);
    });

    it("should return session ID header", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
        });

      expect(response.headers["mcp-session-id"]).toBeDefined();
      expect(response.headers["mcp-session-id"].length).toBeGreaterThan(0);
    });
  });

  describe("MCP Endpoint - Tools List", () => {
    it("should return list of tools", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "tools/list",
          id: 2,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.result.tools).toBeInstanceOf(Array);
      expect(response.body.result.tools.length).toBeGreaterThan(0);
      expect(response.body.result.tools[0].name).toBe("test_tool");
      expect(response.body.id).toBe(2);
    });
  });

  describe("MCP Endpoint - Tool Call", () => {
    it("should execute a valid tool", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "test_tool",
            arguments: {},
          },
          id: 3,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.result).toBeDefined();
      expect(response.body.result.content).toBeInstanceOf(Array);
      expect(response.body.result.content[0].text).toBe("Test tool executed");
      expect(response.body.id).toBe(3);
    });

    it("should return error for unknown tool", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "nonexistent_tool",
            arguments: {},
          },
          id: 4,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(-32601);
      expect(response.body.error.message).toContain("nonexistent_tool");
      expect(response.body.id).toBe(4);
    });
  });

  describe("MCP Endpoint - Ping", () => {
    it("should respond to ping", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: 5,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.result).toBeDefined();
      expect(response.body.id).toBe(5);
    });
  });

  describe("MCP Endpoint - Unknown Method", () => {
    it("should return method not found error", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "unknown/method",
          id: 6,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(-32601);
      expect(response.body.error.message).toContain("Method not found");
      expect(response.body.id).toBe(6);
    });
  });

  describe("Session Persistence", () => {
    it("should maintain session across requests", async () => {
      // First request - get a session ID
      const response1 = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: 1,
        });

      const sessionId = response1.headers["mcp-session-id"];
      expect(sessionId).toBeDefined();

      // Second request - use the same session ID
      const response2 = await request(app)
        .post("/mcp")
        .set("Mcp-Session-Id", sessionId)
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: 2,
        });

      // Should return the same session ID
      expect(response2.headers["mcp-session-id"]).toBe(sessionId);
    });

    it("should create new session for invalid session ID", async () => {
      const response = await request(app)
        .post("/mcp")
        .set("Mcp-Session-Id", "invalid-session-id-12345")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: 1,
        });

      // Should return a new session ID, not the invalid one
      expect(response.headers["mcp-session-id"]).toBeDefined();
      expect(response.headers["mcp-session-id"]).not.toBe(
        "invalid-session-id-12345"
      );
    });
  });

  describe("CORS Headers", () => {
    it("should include CORS headers in response", async () => {
      const response = await request(app)
        .post("/mcp")
        .set("Origin", "http://localhost:3000")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: 1,
        });

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("should handle preflight OPTIONS request", async () => {
      const response = await request(app)
        .options("/mcp")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(204);
    });
  });

  describe("JSON-RPC Format Validation", () => {
    it("should handle request without id (notification)", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "ping",
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.id).toBeNull();
    });

    it("should handle string id", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: "string-id-123",
        })
        .expect(200);

      expect(response.body.id).toBe("string-id-123");
    });

    it("should handle null id", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "ping",
          id: null,
        })
        .expect(200);

      expect(response.body.id).toBeNull();
    });
  });
});
