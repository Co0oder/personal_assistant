/**
 * Validates the request secret against the environment variable
 * @param secret - The secret from request headers
 * @returns true if authorized, false otherwise
 */
export function validateSecret(secret: string | undefined): boolean {
  const expectedSecret = process.env.AGENT_SECRET;

  if (!expectedSecret) {
    console.error("AGENT_SECRET environment variable is not set");
    return false;
  }

  if (!secret || secret !== expectedSecret) {
    console.warn("Unauthorized access attempt:", {
      timestamp: new Date().toISOString(),
      providedSecret: secret ? "***" : "missing"
    });
    return false;
  }

  return true;
}

/**
 * Middleware-style auth check for Vercel functions
 * Returns a response object if unauthorized, null if authorized
 *
 * @param req - The request object
 * @param res - The response object
 * @returns null if authorized, otherwise sends 401 response
 *
 * @example
 * export default async function handler(req, res) {
 *   if (checkAuth(req, res)) return;
 *   // ... rest of your handler code
 * }
 */
export function checkAuth(req: any, res: any): boolean {
  const secret = req.headers['x-agent-secret'];

  if (!validateSecret(secret)) {
    res.status(401).json({
      error: "Unauthorized: Wrong or missing secret key."
    });
    return true; // Indicates auth failed
  }

  return false; // Indicates auth passed
}
