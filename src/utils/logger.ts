/**
 * Logging Framework
 *
 * A simple, extensible logging utility for the Azure DevOps MCP Server.
 * Designed to work in both STDIO and HTTP modes with structured logging.
 *
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output
 * - Request correlation via requestId
 * - Environment-based configuration
 * - STDIO-safe logging (stderr for logs, stdout for MCP)
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  sessionId?: string;
  method?: string;
  tool?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   */
  level: LogLevel;

  /**
   * Output format: 'json' for structured, 'text' for human-readable
   */
  format: "json" | "text";

  /**
   * Include stack traces in error logs
   */
  includeStackTrace: boolean;

  /**
   * Custom output function (default: console.error for STDIO safety)
   */
  output?: (message: string) => void;
}

const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  format: "json",
  includeStackTrace: true,
  output: (msg) => console.error(msg), // Use stderr to not interfere with STDIO MCP
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;
  private context: Record<string, unknown> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    const child = new Logger(this.config);
    child.context = { ...this.context, ...context };
    return child;
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorMeta: Record<string, unknown> = { ...meta };

    if (error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        ...(this.config.includeStackTrace && error.stack
          ? { stack: error.stack }
          : {}),
      };
    }

    this.log(LogLevel.ERROR, message, errorMeta);
  }

  /**
   * Log a request start
   */
  requestStart(
    requestId: string,
    method: string,
    meta?: Record<string, unknown>
  ): void {
    this.info(`Request started: ${method}`, {
      requestId,
      method,
      event: "request_start",
      ...meta,
    });
  }

  /**
   * Log a request end
   */
  requestEnd(
    requestId: string,
    method: string,
    duration: number,
    success: boolean,
    meta?: Record<string, unknown>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Request ${success ? "completed" : "failed"}: ${method}`, {
      requestId,
      method,
      duration,
      success,
      event: "request_end",
      ...meta,
    });
  }

  /**
   * Log a tool call
   */
  toolCall(
    toolName: string,
    duration: number,
    success: boolean,
    meta?: Record<string, unknown>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Tool ${success ? "executed" : "failed"}: ${toolName}`, {
      tool: toolName,
      duration,
      success,
      event: "tool_call",
      ...meta,
    });
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...this.context,
      ...meta,
    };

    const output = this.config.output || defaultConfig.output!;
    const formatted =
      this.config.format === "json"
        ? JSON.stringify(entry)
        : this.formatText(entry);

    output(formatted);
  }

  /**
   * Format log entry as human-readable text
   */
  private formatText(entry: LogEntry): string {
    const { timestamp, level, message, error, ...rest } = entry;
    const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    const errorStr = error ? ` | Error: ${error.message}` : "";

    return `[${timestamp}] ${level.padEnd(5)} ${message}${errorStr}${meta}`;
  }
}

/**
 * Get logger configuration from environment
 */
export function getLoggerConfigFromEnv(): LoggerConfig {
  const levelStr = process.env.MCP_LOG_LEVEL?.toUpperCase() || "INFO";
  const level = LogLevel[levelStr as keyof typeof LogLevel] ?? LogLevel.INFO;
  const format = process.env.MCP_LOG_FORMAT === "text" ? "text" : "json";
  const includeStackTrace = process.env.MCP_LOG_STACK_TRACE !== "false";

  return {
    level,
    format,
    includeStackTrace,
  };
}

/**
 * Create default logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const envConfig = getLoggerConfigFromEnv();
  return new Logger({ ...envConfig, ...config });
}

// Default logger instance
export const logger = createLogger();

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware(log: Logger = logger) {
  return (
    req: { method: string; path: string; headers: Record<string, unknown> },
    res: { on: (event: string, callback: () => void) => void },
    next: () => void
  ) => {
    const requestId =
      (req.headers["x-request-id"] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    log.requestStart(requestId, `${req.method} ${req.path}`, {
      path: req.path,
    });

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      log.requestEnd(requestId, `${req.method} ${req.path}`, duration, true, {
        path: req.path,
      });
    });

    next();
  };
}
