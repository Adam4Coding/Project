import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET ?? "cartly-dev-secret";

export interface JwtPayload {
  userId: number;
  role: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
  (req as AuthenticatedRequest).user = payload;
  next();
}

export function requireVendorAuth(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== "vendor") {
      res.status(403).json({ message: "Vendor access required" });
      return;
    }
    next();
  });
}

export function requireCustomerAuth(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== "customer") {
      res.status(403).json({ message: "Customer access required" });
      return;
    }
    next();
  });
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

