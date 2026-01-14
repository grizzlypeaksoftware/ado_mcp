/**
 * Authentication Middleware Stub
 *
 * This is a placeholder for future authentication implementation.
 * Currently, the server uses the ADO_PAT environment variable for
 * Azure DevOps authentication. This middleware stub provides the
 * foundation for adding HTTP-level authentication for SaaS deployments.
 *
 * Future implementation options:
 * - API Key authentication
 * - JWT/OAuth2 tokens
 * - Azure AD integration
 * - Multi-tenant support
 */

import { Request, Response, NextFunction } from "express";

/**
 * Authentication configuration options
 */
export interface AuthConfig {
  /**
   * Enable authentication (default: false for backward compatibility)
   */
  enabled: boolean;

  /**
   * Authentication mode
   * - 'api-key': Simple API key in header
   * - 'jwt': JSON Web Token validation
   * - 'azure-ad': Azure Active Directory
   * - 'none': No authentication (default)
   */
  mode: "api-key" | "jwt" | "azure-ad" | "none";

  /**
   * API key header name (for api-key mode)
   */
  apiKeyHeader?: string;

  /**
   * Paths to exclude from authentication
   */
  excludePaths?: string[];
}

const defaultConfig: AuthConfig = {
  enabled: false,
  mode: "none",
  apiKeyHeader: "X-API-Key",
  excludePaths: ["/health"],
};

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  tenantId?: string;
  error?: string;
}

/**
 * Create authentication middleware
 *
 * @param config Authentication configuration
 * @returns Express middleware function
 *
 * @example
 * // Enable API key authentication
 * app.use(createAuthMiddleware({
 *   enabled: true,
 *   mode: 'api-key',
 *   apiKeyHeader: 'X-API-Key'
 * }));
 *
 * @example
 * // Disabled (passthrough)
 * app.use(createAuthMiddleware({ enabled: false, mode: 'none' }));
 */
export function createAuthMiddleware(config: Partial<AuthConfig> = {}) {
  const mergedConfig: AuthConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip authentication if disabled
    if (!mergedConfig.enabled || mergedConfig.mode === "none") {
      return next();
    }

    // Skip excluded paths
    if (mergedConfig.excludePaths?.includes(req.path)) {
      return next();
    }

    // Perform authentication based on mode
    const result = await authenticate(req, mergedConfig);

    if (!result.authenticated) {
      return res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: result.error || "Authentication required",
        },
        id: null,
      });
    }

    // Attach auth info to request for downstream use
    (req as AuthenticatedRequest).auth = result;

    next();
  };
}

/**
 * Extended Request type with authentication info
 */
export interface AuthenticatedRequest extends Request {
  auth?: AuthResult;
}

/**
 * Authenticate request based on configuration
 *
 * @param req Express request
 * @param config Authentication configuration
 * @returns Authentication result
 */
async function authenticate(
  req: Request,
  config: AuthConfig
): Promise<AuthResult> {
  switch (config.mode) {
    case "api-key":
      return authenticateApiKey(req, config);

    case "jwt":
      return authenticateJwt(req);

    case "azure-ad":
      return authenticateAzureAd(req);

    default:
      return { authenticated: true };
  }
}

/**
 * API Key authentication
 * Validates API key from header against configured keys
 *
 * TODO: Implement actual API key validation
 * - Store keys in environment or database
 * - Support key rotation
 * - Rate limiting per key
 */
async function authenticateApiKey(
  req: Request,
  config: AuthConfig
): Promise<AuthResult> {
  const headerName = config.apiKeyHeader || "X-API-Key";
  const apiKey = req.headers[headerName.toLowerCase()] as string;

  if (!apiKey) {
    return {
      authenticated: false,
      error: `Missing ${headerName} header`,
    };
  }

  // TODO: Validate API key against stored keys
  // For now, this is a stub that accepts any non-empty key
  // In production, validate against a secure key store

  // Placeholder validation - MUST be replaced for production
  const validKeys = process.env.MCP_API_KEYS?.split(",") || [];
  if (validKeys.length > 0 && !validKeys.includes(apiKey)) {
    return {
      authenticated: false,
      error: "Invalid API key",
    };
  }

  return {
    authenticated: true,
    userId: "api-key-user", // TODO: Map key to user
  };
}

/**
 * JWT authentication stub
 *
 * TODO: Implement JWT validation
 * - Verify signature with public key
 * - Check expiration
 * - Extract claims (userId, tenantId, scopes)
 */
async function authenticateJwt(_req: Request): Promise<AuthResult> {
  // TODO: Implement JWT validation
  // const authHeader = req.headers.authorization;
  // if (!authHeader?.startsWith('Bearer ')) {
  //   return { authenticated: false, error: 'Missing Bearer token' };
  // }
  // const token = authHeader.substring(7);
  // Verify and decode token...

  return {
    authenticated: false,
    error: "JWT authentication not yet implemented",
  };
}

/**
 * Azure AD authentication stub
 *
 * TODO: Implement Azure AD authentication
 * - Validate tokens from Azure AD
 * - Support multi-tenant scenarios
 * - Extract user and tenant information
 */
async function authenticateAzureAd(_req: Request): Promise<AuthResult> {
  // TODO: Implement Azure AD validation
  // Use @azure/identity or passport-azure-ad

  return {
    authenticated: false,
    error: "Azure AD authentication not yet implemented",
  };
}

/**
 * Get authentication configuration from environment
 */
export function getAuthConfigFromEnv(): AuthConfig {
  const enabled = process.env.MCP_AUTH_ENABLED === "true";
  const mode =
    (process.env.MCP_AUTH_MODE as AuthConfig["mode"]) || "none";

  return {
    enabled,
    mode,
    apiKeyHeader: process.env.MCP_AUTH_API_KEY_HEADER || "X-API-Key",
    excludePaths: ["/health"],
  };
}
