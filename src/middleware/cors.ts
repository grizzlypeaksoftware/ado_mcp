import cors from "cors";
import { CorsOptions } from "cors";

/**
 * Get CORS configuration based on environment
 */
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.MCP_CORS_ORIGINS;

  // Parse allowed origins from environment variable
  const origins = allowedOrigins
    ? allowedOrigins.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origins.includes(origin) || origins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Mcp-Session-Id",
      "X-Request-Id",
    ],
    exposedHeaders: ["Mcp-Session-Id"],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

/**
 * Create CORS middleware with MCP-specific configuration
 */
export function createCorsMiddleware() {
  return cors(getCorsOptions());
}
