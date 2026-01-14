import { randomUUID } from "crypto";

export interface Session {
  id: string;
  createdAt: Date;
  lastAccessedAt: Date;
  data: Map<string, unknown>;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private timeoutMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(timeoutMinutes: number = 30) {
    this.timeoutMs = timeoutMinutes * 60 * 1000;
    this.startCleanupInterval();
  }

  /**
   * Create a new session
   */
  createSession(): Session {
    const session: Session = {
      id: randomUUID(),
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      data: new Map(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get an existing session by ID, or create a new one if it doesn't exist
   */
  getOrCreateSession(sessionId?: string): Session {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastAccessedAt = new Date();
        return session;
      }
    }
    return this.createSession();
  }

  /**
   * Get a session by ID (returns undefined if not found or expired)
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (this.isExpired(session)) {
        this.sessions.delete(sessionId);
        return undefined;
      }
      session.lastAccessedAt = new Date();
      return session;
    }
    return undefined;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if a session has expired
   */
  private isExpired(session: Session): boolean {
    const now = Date.now();
    const lastAccess = session.lastAccessedAt.getTime();
    return now - lastAccess > this.timeoutMs;
  }

  /**
   * Clean up expired sessions
   */
  cleanup(): number {
    let cleanedCount = 0;
    for (const [id, session] of this.sessions) {
      if (this.isExpired(session)) {
        this.sessions.delete(id);
        cleanedCount++;
      }
    }
    return cleanedCount;
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
