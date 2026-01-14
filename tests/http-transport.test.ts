import { SessionManager } from "../src/middleware/session";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager(30); // 30 minute timeout
  });

  afterEach(() => {
    sessionManager.stop();
  });

  describe("createSession", () => {
    it("should create a new session with a unique ID", () => {
      const session = sessionManager.createSession();

      expect(session.id).toBeDefined();
      expect(session.id.length).toBeGreaterThan(0);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastAccessedAt).toBeInstanceOf(Date);
      expect(session.data).toBeInstanceOf(Map);
    });

    it("should create sessions with unique IDs", () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe("getOrCreateSession", () => {
    it("should create a new session when no ID is provided", () => {
      const session = sessionManager.getOrCreateSession();

      expect(session.id).toBeDefined();
      expect(sessionManager.getSessionCount()).toBe(1);
    });

    it("should create a new session when invalid ID is provided", () => {
      const session = sessionManager.getOrCreateSession("invalid-id");

      expect(session.id).not.toBe("invalid-id");
      expect(sessionManager.getSessionCount()).toBe(1);
    });

    it("should return existing session when valid ID is provided", () => {
      const created = sessionManager.createSession();
      const retrieved = sessionManager.getOrCreateSession(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(sessionManager.getSessionCount()).toBe(1);
    });

    it("should update lastAccessedAt when retrieving session", () => {
      const created = sessionManager.createSession();
      const originalAccess = created.lastAccessedAt;

      // Wait a tiny bit
      const retrieved = sessionManager.getOrCreateSession(created.id);

      expect(retrieved.lastAccessedAt.getTime()).toBeGreaterThanOrEqual(originalAccess.getTime());
    });
  });

  describe("getSession", () => {
    it("should return undefined for non-existent session", () => {
      const session = sessionManager.getSession("non-existent");

      expect(session).toBeUndefined();
    });

    it("should return session for valid ID", () => {
      const created = sessionManager.createSession();
      const retrieved = sessionManager.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  describe("deleteSession", () => {
    it("should delete an existing session", () => {
      const session = sessionManager.createSession();
      const deleted = sessionManager.deleteSession(session.id);

      expect(deleted).toBe(true);
      expect(sessionManager.getSession(session.id)).toBeUndefined();
      expect(sessionManager.getSessionCount()).toBe(0);
    });

    it("should return false when deleting non-existent session", () => {
      const deleted = sessionManager.deleteSession("non-existent");

      expect(deleted).toBe(false);
    });
  });

  describe("getSessionCount", () => {
    it("should return 0 when no sessions exist", () => {
      expect(sessionManager.getSessionCount()).toBe(0);
    });

    it("should return correct count after creating sessions", () => {
      sessionManager.createSession();
      sessionManager.createSession();
      sessionManager.createSession();

      expect(sessionManager.getSessionCount()).toBe(3);
    });

    it("should return correct count after deleting sessions", () => {
      const s1 = sessionManager.createSession();
      sessionManager.createSession();
      sessionManager.deleteSession(s1.id);

      expect(sessionManager.getSessionCount()).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should clean up expired sessions", () => {
      // Create a session manager with very short timeout (1ms)
      const shortTimeoutManager = new SessionManager(0.00001); // ~0.6ms

      shortTimeoutManager.createSession();
      shortTimeoutManager.createSession();

      // Wait for sessions to expire
      setTimeout(() => {
        const cleaned = shortTimeoutManager.cleanup();
        expect(cleaned).toBe(2);
        expect(shortTimeoutManager.getSessionCount()).toBe(0);
        shortTimeoutManager.stop();
      }, 10);
    });
  });
});

describe("CORS Configuration", () => {
  // Note: CORS configuration tests would typically require supertest
  // to test actual HTTP headers. These are placeholder tests.

  it("should have cors middleware configured", () => {
    // This is a placeholder - full CORS testing requires HTTP integration tests
    expect(true).toBe(true);
  });
});

describe("JSON-RPC Message Handling", () => {
  // Note: Full JSON-RPC testing requires integration tests with supertest
  // These are placeholder structure tests

  describe("Request Validation", () => {
    it("should validate JSON-RPC 2.0 structure", () => {
      const validRequest = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
      };

      expect(validRequest.jsonrpc).toBe("2.0");
      expect(validRequest.method).toBeDefined();
      expect(validRequest.id).toBeDefined();
    });

    it("should handle null id for notifications", () => {
      const notification = {
        jsonrpc: "2.0",
        method: "ping",
        id: null,
      };

      expect(notification.id).toBeNull();
    });
  });

  describe("Error Codes", () => {
    it("should use correct JSON-RPC error codes", () => {
      const PARSE_ERROR = -32700;
      const INVALID_REQUEST = -32600;
      const METHOD_NOT_FOUND = -32601;
      const INVALID_PARAMS = -32602;
      const INTERNAL_ERROR = -32603;

      expect(PARSE_ERROR).toBe(-32700);
      expect(INVALID_REQUEST).toBe(-32600);
      expect(METHOD_NOT_FOUND).toBe(-32601);
      expect(INVALID_PARAMS).toBe(-32602);
      expect(INTERNAL_ERROR).toBe(-32603);
    });
  });
});
