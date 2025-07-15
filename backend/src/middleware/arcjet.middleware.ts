// To use these types, you'll need to install the Express types package:
// npm install --save-dev @types/express

import { Request, Response, NextFunction } from "express";
import { aj } from "../config/arcjet.js";

/**
 * Arcjet middleware for rate limiting, bot protection, and security.
 * This middleware protects your routes by analyzing incoming requests
 * with Arcjet and blocking them if they violate any defined rules.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next middleware function.
 */
export const arcjetMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ CORRECTED: The protect() method only takes the request object as an argument.
    const decision = await aj.protect(req);

    // Handle denied requests
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
        });
        return;
      }

      if (decision.reason.isBot()) {
        res.status(403).json({
          error: "Bot Access Denied",
          message: "Automated access is not allowed.",
        });
        return;
      }

      // Default fallback for other security reasons
      res.status(403).json({
        error: "Forbidden",
        message: "Access denied by security policy.",
      });
      return;
    }

    // You can also inspect the results for logging or other actions,
    // even if the request is allowed.
    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      console.warn("Spoofed bot detected", { path: req.path, ip: req.ip });
    }

    // If the decision is to allow the request, pass control to the next middleware
    next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    // CRITICAL: Fail open to ensure your application remains available
    // if the Arcjet SDK encounters an error.
    next();
  }
};